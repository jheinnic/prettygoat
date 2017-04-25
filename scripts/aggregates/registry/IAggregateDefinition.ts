import {IAggregate} from "../IAggregate";
import ITickScheduler from "../../ticks/ITickScheduler";

interface IAggregateDefinition<T> {
    define(tickScheduler?:ITickScheduler):IAggregate<T>
}

export default IAggregateDefinition
