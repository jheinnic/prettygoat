import {Observable} from "rx";
import {Event} from "./Event";
import {IWhen} from "../projections/IProjection";

export interface IStreamFactory {
    from(lastEvent:Date|null, completions?:Observable<string>, definition?:IWhen<any>):Observable<Event>;
}
