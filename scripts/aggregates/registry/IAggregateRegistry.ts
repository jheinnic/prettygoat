import BoundedContextRegistry from "./BoundedContextRegistry";
import IAggregateDefinition from "./IAggregateDefinition";
import {interfaces} from "inversify";
import RegistryEntry from "./RegistryEntry";

interface IAggregateRegistry {
    registryType: "aggregate";
    add<T>(constructor:interfaces.Newable<IAggregateDefinition<T>>, parametersKey?:(parameters:any) => string):IAggregateRegistry;
    forBoundedContext(BoundedContext:string):BoundedContextRegistry;
    getBoundedContexts():BoundedContextRegistry[];
    getBoundedContext(BoundedContextId: string): BoundedContextRegistry | undefined;
    getEntry<T>(id:string, boundedContext?:string):{ boundedContext:string, data:RegistryEntry<T>} | undefined;
}

export default IAggregateRegistry;
