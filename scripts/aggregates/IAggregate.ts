import {ISplit, IWhen} from "../projections/IProjection";
import {ISnapshotStrategy} from "../snapshots/ISnapshotStrategy";
import {IFilterStrategy} from "../filters/IFilterStrategy";
/**
 * Created by jheinnic on 4/19/17.
 */

export interface IAggregate<T> {
    name:string;
    split?:ISplit;
    definition:IWhen<T>;
    snapshotStrategy?:ISnapshotStrategy;
    filterStrategy?: IFilterStrategy<T>;
}
