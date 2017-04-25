import {Event} from "../streams/Event";
import Dictionary from "../util/Dictionary";
import {Snapshot} from "../snapshots/ISnapshotRepository";
import ProjectionStats from "./ProjectionStats";
import {ISubscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";

interface IProjectionRunner<T> extends ISubscription {
    state:T|Dictionary<T>|undefined;
    stats:ProjectionStats;
    run(snapshot?:Snapshot<T|Dictionary<T>>):void;
    stop():void;
    notifications():Observable<Event>;
}

export default IProjectionRunner
