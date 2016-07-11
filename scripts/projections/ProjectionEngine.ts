import IProjectionEngine from "./IProjectionEngine";
import IPushNotifier from "../push/IPushNotifier";
import {injectable, inject} from "inversify";
import IProjectionRunnerFactory from "./IProjectionRunnerFactory";
import IProjectionRegistry from "../registry/IProjectionRegistry";
import * as _ from "lodash";
import AreaRegistry from "../registry/AreaRegistry";
import RegistryEntry from "../registry/RegistryEntry";
import PushContext from "../push/PushContext";
import IStatePublisher from "../routing/IStatePublisher";
import {ISnapshotRepository, Snapshot} from "../snapshots/ISnapshotRepository";

@injectable()
class ProjectionEngine implements IProjectionEngine {

    constructor(@inject("IProjectionRunnerFactory") private runnerFactory:IProjectionRunnerFactory,
                @inject("IPushNotifier") private pushNotifier:IPushNotifier,
                @inject("IProjectionRegistry") private registry:IProjectionRegistry,
                @inject("IStatePublisher") private statePublisher:IStatePublisher,
                @inject("ISnapshotRepository") private snapshotRepository:ISnapshotRepository) {

    }

    run():void {
        this.snapshotRepository
            .initialize()
            .flatMap(a => this.snapshotRepository.getSnapshots())
            .map(snapshots => {
                let areas = this.registry.getAreas();
                _.forEach<AreaRegistry>(areas, areaRegistry => {
                    _.forEach<RegistryEntry<any>>(areaRegistry.entries, (entry:RegistryEntry<any>) => {
                        let runner = this.runnerFactory.create(entry.projection),
                            context = new PushContext(areaRegistry.area, entry.name);
                        runner.subscribe(state => {
                            let snapshotStrategy = entry.projection.snapshotStrategy;
                            this.pushNotifier.notify(context, null, state.splitKey);
                            if (snapshotStrategy && snapshotStrategy.needsSnapshot(state)) {
                                this.snapshotRepository.saveSnapshot(state.type, new Snapshot(runner.state, state.timestamp));
                            }
                        });
                        this.statePublisher.publish(runner, context);
                        runner.run(snapshots[entry.projection.name]);
                    });
                });
            }).subscribe(() => null);
    }

}

export default ProjectionEngine