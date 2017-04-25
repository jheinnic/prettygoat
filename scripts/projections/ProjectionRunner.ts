import {Subject, IDisposable} from "rx";
import {SpecialNames} from "../matcher/SpecialNames";
import {IMatcher} from "../matcher/IMatcher";
import {IStreamFactory} from "../streams/IStreamFactory";
import IProjectionRunner from "./IProjectionRunner";
import {IProjection} from "./IProjection";
import IReadModelFactory from "../streams/IReadModelFactory";
import {Event} from "../streams/Event";
import {Snapshot} from "../snapshots/ISnapshotRepository";
import Dictionary from "../util/Dictionary";
import {combineStreams} from "./ProjectionStream";
import IDateRetriever from "../util/IDateRetriever";
import {SpecialState, StopSignallingState} from "./SpecialState";
import ProjectionStats from "./ProjectionStats";
import ReservedEvents from "../streams/ReservedEvents";
import Identity from "../matcher/Identity";

class ProjectionRunner<T> implements IProjectionRunner<T> {
    state: T|Dictionary<T>;
    stats = new ProjectionStats();
    protected streamId: string;
    protected subject: Subject<Event>;
    protected subscription: IDisposable;
    protected isDisposed: boolean;
    protected isFailed: boolean;

    constructor(protected projection: IProjection<T>, protected stream: IStreamFactory, protected matcher: IMatcher, protected readModelFactory: IReadModelFactory,
                protected tickScheduler: IStreamFactory, protected dateRetriever: IDateRetriever) {
        this.subject = new Subject<Event>();
        this.streamId = projection.name;
    }

    notifications() {
        return this.subject;
    }

    run(snapshot?: Snapshot<T|Dictionary<T>>): void {
        if (this.isDisposed)
            throw new Error(`${this.streamId}: cannot run a disposed projection`);

        if (this.subscription !== undefined)
            return;

        this.stats.running = true;
        this.subscribeToStateChanges();
        this.state = snapshot ? snapshot.memento : this.matcher.match(SpecialNames.Init)();
        this.notifyStateChange(new Date(1));
        let combinedStream = new Subject<Event>();
        let completions = new Subject<string>();

        this.subscription = combinedStream
            .map<[Event, Function]>(event => [event, this.matcher.match(event.type)])
            .do(data => {
                if (data[0].type === ReservedEvents.FETCH_EVENTS)
                    completions.onNext(data[0].payload.event);
            })
            .filter(data => data[1] !== Identity)
            .do(data => this.updateStats(data[0]))
            .subscribe(data => {
                let [event, matchFn] = data;
                try {
                    let newState = matchFn(this.state, event.payload, event);
                    if (newState instanceof SpecialState)
                        this.state = (<SpecialState<T>>newState).state;
                    else
                        this.state = newState;
                    if (!(newState instanceof StopSignallingState))
                        this.notifyStateChange(event.timestamp);
                } catch (error) {
                    this.isFailed = true;
                    this.subject.onError(error);
                    this.stop();
                }
            });

        combineStreams(
            combinedStream,
            this.stream.from(snapshot ? snapshot.lastEvent : null, completions, this.projection.definition),
            this.readModelFactory.from(null).filter(event => event.type !== this.streamId),
            this.tickScheduler.from(null),
            this.dateRetriever);
    }

    //Patch to remove sampling in tests where needed
    protected subscribeToStateChanges() {
        this.subject.sample(100).subscribe(readModel => {
            this.readModelFactory.publish({
                payload: readModel.payload,
                type: readModel.type,
                timestamp: null,
                splitKey: null
            });
        }, error => null);
    }

    protected updateStats(event: Event) {
        if (event.timestamp)
            this.stats.events++;
        else
            this.stats.readModels++;
    }

    stop(): void {
        if (this.isDisposed)
            throw Error("Projection already stopped");

        this.isDisposed = true;
        this.stats.running = false;

        if (this.subscription)
            this.subscription.dispose();
        if (!this.isFailed)
            this.subject.onCompleted();
    }

    dispose(): void {
        this.stop();

        if (!this.subject.isDisposed)
            this.subject.dispose();
    }

    protected notifyStateChange(timestamp: Date, splitKey?: string) {
        this.subject.onNext({payload: this.state, type: this.streamId, timestamp: timestamp, splitKey: null});
    }
}

export default ProjectionRunner
