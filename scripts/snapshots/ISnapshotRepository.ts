import {Observable} from "rxjs";
import Dictionary from "../util/Dictionary";

const EMPTY_DATE = new Date(0);

export class Snapshot<T> {
    public static Empty: Snapshot<any> = new Snapshot<any>(undefined, undefined);

    public lastEvent: Date;

    constructor(public memento: T, lastEvent?: Date) {
        this.lastEvent = !!lastEvent ? lastEvent : EMPTY_DATE;
    }
}

export interface ISnapshotRepository {
    initialize(): Observable<void>;
    getSnapshots(): Observable<Dictionary<Snapshot<any>>>;
    getSnapshot<T>(streamId: string): Observable<Snapshot<T>>;
    saveSnapshot<T>(streamId: string, snapshot: Snapshot<T>): Observable<void>;
    deleteSnapshot(streamId: string): Observable<void>;
}
