import {Observable, IDisposable} from "rx";
import {Event} from "../streams/Event";
import Dictionary from "../util/Dictionary";
import {Snapshot} from "../snapshots/ISnapshotRepository";
import ProjectionStats from "./ProjectionStats";

interface IProjectionRunner<T> extends IDisposable {
    state:T|Dictionary<T>;
    stats:ProjectionStats;
    run(snapshot?:Snapshot<T|Dictionary<T>>):void;
    stop():void;
    notifications():Observable<Event>;
}

export default IProjectionRunner
