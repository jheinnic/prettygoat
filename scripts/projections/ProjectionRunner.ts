import {Subject, Subscription} from "rxjs";
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

class ProjectionRunner<T> extends Subscription implements IProjectionRunner<T> {
    state: T | Dictionary<T> | undefined;
    stats = new ProjectionStats();
    protected streamId: string;
    protected subject: Subject<Event>;
    protected subscription: Subscription;
    protected isDisposed: boolean;
    protected isFailed: boolean;

    constructor(protected projection: IProjection<T>, protected stream: IStreamFactory, protected matcher: IMatcher, protected readModelFactory: IReadModelFactory,
                protected tickScheduler: IStreamFactory, protected dateRetriever: IDateRetriever) {
        super(() => {
            this.stop();
        });

        this.subject = new Subject<Event>();
        this.add(this.subject);
        this.streamId = projection.name;
    }

    notifications() {
        return this.subject;
    }

    run(snapshot?: Snapshot<T | Dictionary<T>>): void {
        if (this.isDisposed)
            throw new Error(`${this.streamId}: cannot run a disposed projection`);

        if (this.subscription !== undefined)
            return;

        this.stats.running = true;
        this.subscribeToStateChanges();
        this.state = snapshot ? snapshot.memento : this.matcher.match(SpecialNames.Init)!();
        this.notifyStateChange(new Date(1));

        let combinedStream = new Subject<Event>();
        let completions = new Subject<string>();
        this.add(combinedStream);
        this.add(completions);

        this.subscription = combinedStream
            .map<Event, [Event, Function | null]>(event => [event, this.matcher.match(event.type)])
            .filter(data => !!data && !!data[1])
            .do(data => {
                if (data[0].type === ReservedEvents.FETCH_EVENTS)
                    completions.next(data[0].payload.event);
            })
            .filter(data => data[1] !== Identity)
            .do(data => this.updateStats(data[0]))
            .subscribe(data => {
                let [event, matchFn] = data;
                try {
                    let newState = matchFn!(this.state, event.payload, event);
                    if (newState === undefined) {
                        throw Error("new state is undefined")
                    } else if (newState instanceof SpecialState)
                        this.state = (<SpecialState<T>>newState).state;
                    else
                        this.state = newState;

                    // Stop Signalling State events always bear a timestamp.  In this specific scenario,
                    // timestamp is not an optional property.
                    if (!(newState instanceof StopSignallingState))
                        this.notifyStateChange(event.timestamp!);
                } catch (error) {
                    this.isFailed = true;
                    this.subject.error(error);
                    this.stop();
                }
            });

        this.add(this.subscription);

        combineStreams(
            combinedStream,
            this.stream.from(snapshot ? snapshot.lastEvent : null, completions, this.projection.definition),
            this.readModelFactory.from(null).filter(event => event.type !== this.streamId),
            this.tickScheduler.from(null),
            this.dateRetriever);
    }

    //Patch to remove sampling in tests where needed
    protected subscribeToStateChanges() {
        this.add(
            this.subject.sampleTime(100).subscribe(readModel => {
                this.readModelFactory.publish({
                    payload: readModel.payload,
                    type: readModel.type,
                    timestamp: readModel.timestamp,  // Was undefined?
                    splitKey: readModel.splitKey     // Was undefined?
                });
            }, error => null));
    }

    protected updateStats(event: Event) {
        if (event.timestamp)
            this.stats.events++;
        else
            this.stats.readModels++;
    }

    stop(): void {
        if (this.closed)
            throw Error("Projection already stopped");

        // this.isDisposed = true;
        this.stats.running = false;

        // if (this.subscription)
        //     this.subscription.unsubscribe();
        if (!this.isFailed)
            this.subject.complete();
    }

    protected notifyStateChange(timestamp: Date, splitKey?: string) {
        this.subject.next({payload: this.state, type: this.streamId, timestamp: timestamp, splitKey: undefined});
    }
}

export default ProjectionRunner
