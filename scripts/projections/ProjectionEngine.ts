import IProjectionEngine from "./IProjectionEngine";
import {inject, injectable} from "inversify";
import IProjectionRegistry from "./registry/IProjectionRegistry";
import * as _ from "lodash";
import AreaRegistry from "./registry/AreaRegistry";
import PushContext from "../push/PushContext";
import {ISnapshotRepository, Snapshot} from "../snapshots/ISnapshotRepository";
import RegistryEntry from "./registry/RegistryEntry";
import IProjectionRunnerFactory from "./IProjectionRunnerFactory";
import ILogger from "../log/ILogger";
import NullLogger from "../log/NullLogger";
import IProjectionSorter from "./IProjectionSorter";
import {IProjection} from "./IProjection";
import {IPushNotifier} from "../push/IPushComponents";
import IAsyncPublisher from "../util/IAsyncPublisher";

type SnapshotData = [string, Snapshot<any>];

@injectable()
class ProjectionEngine implements IProjectionEngine {

    constructor(@inject("IProjectionRunnerFactory") private runnerFactory: IProjectionRunnerFactory,
                @inject("IPushNotifier") private pushNotifier: IPushNotifier,
                @inject("IProjectionRegistry") private registry: IProjectionRegistry,
                @inject("ISnapshotRepository") private snapshotRepository: ISnapshotRepository,
                @inject("ILogger") private logger: ILogger = NullLogger,
                @inject("IProjectionSorter") private sorter: IProjectionSorter,
                @inject("IAsyncPublisher") private publisher: IAsyncPublisher<SnapshotData>) {
        publisher.items()
            .flatMap(snapshotData => {
                return this.snapshotRepository.saveSnapshot(snapshotData[0], snapshotData[1]).map(() => snapshotData);
            })
            .subscribe(snapshotData => {
                let streamId = snapshotData[0],
                    snapshot = snapshotData[1];
                this.logger.info(`Snapshot saved for ${streamId} at time ${snapshot.lastEvent.toISOString()}`);
            });
    }

    run(projection?: IProjection<any>, context?: PushContext) {
        if (projection) {
            // TODO: Assess whether context is optional or manditory, and whether its ordere right in the argument list.
            this.snapshotRepository.getSnapshot(projection.name).subscribe(snapshot => {
                this.runSingleProjection(projection, context!, snapshot);
            });
        } else {
            this.sorter.sort();
            this.snapshotRepository
                .initialize()
                .flatMap(() => this.snapshotRepository.getSnapshots())
                .subscribe(snapshots => {
                        let areas = this.registry.getAreas();
                        _.forEach<AreaRegistry>(areas, areaRegistry => {
                            _.forEach<RegistryEntry<any>>(areaRegistry.entries, (entry: RegistryEntry<any>) => {
                                let projection = entry.projection;
                                this.runSingleProjection(projection, new PushContext(areaRegistry.area, entry.exposedName), snapshots[projection.name]);
                            });
                        });
                    });
        }
    }

    private runSingleProjection(projection: IProjection<any>, context: PushContext, snapshot?: Snapshot<any>) {
        let runner = this.runnerFactory.create(projection);

        let sequence = runner
            .notifications()
            .do(state => {
                let snapshotStrategy = projection.snapshotStrategy;
                if (state.timestamp && snapshotStrategy && snapshotStrategy.needsSnapshot(state)) {
                    this.publisher.publish([state.type, new Snapshot(runner.state, state.timestamp)]);
                }
            });

        if (!projection.split)
            sequence = sequence.sampleTime(200);
        else
            sequence = sequence.groupBy(state => state.splitKey).flatMap(states => states.sampleTime(200));

        let subscription = sequence.subscribe(state => {
            this.pushNotifier.notify(context, state.splitKey);
            this.logger.info(`Notifying state change on ${context.area}:${context.projectionName} ${state.splitKey ? "with key " + state.splitKey : ""}`);
        }, error => {
            subscription.unsubscribe();
            this.logger.error(error);
        });

        runner.run(snapshot);
    }
}

export default ProjectionEngine
