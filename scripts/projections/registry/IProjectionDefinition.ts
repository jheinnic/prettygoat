import {IProjection} from "../IProjection";
import ITickScheduler from "../../ticks/ITickScheduler";

interface IProjectionDefinition<T> {
    define(tickScheduler?:ITickScheduler):IProjection<T>
}

export default IProjectionDefinition
