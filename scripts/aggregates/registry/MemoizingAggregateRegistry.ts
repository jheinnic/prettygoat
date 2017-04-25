import {inject, interfaces, injectable} from "inversify";
import IAggregateRegistry from "./IAggregateRegistry";
import IAggregateDefinition from "./IAggregateDefinition";
import BoundedContextRegistry from "./BoundedContextRegistry";
import RegistryEntry from "./RegistryEntry";

@injectable()
class MemoizingAggregateRegistry implements IAggregateRegistry {
    registryType: "aggregate";

    private cache: Dictionary<{boundedContext: string; data: RegistryEntry<any>}|undefined> = {};

    constructor(@inject("AggregateRegistry") private registry: IAggregateRegistry) {

    }

   add<T>(constructor: interfaces.Newable<IAggregateDefinition<T>>, parametersKey?: (parameters: any) => string): IAggregateRegistry {
        return this.registry.add(constructor, parametersKey);
    }

    forBoundedContext(boundedContext: string): BoundedContextRegistry {
        return this.registry.forBoundedContext(boundedContext);
    }

    getBoundedContexts(): BoundedContextRegistry[] {
        return this.registry.getBoundedContexts();
    }

    getBoundedContext(boundedContextId: string): BoundedContextRegistry|undefined {
        return this.registry.getBoundedContext(boundedContextId);
    }

    getEntry<T>(id: string, boundedContext?: string): {boundedContext: string; data: RegistryEntry<T>} |undefined {
        let cachedEntry = this.cache[id + boundedContext];
        if (!cachedEntry) {
            this.cache[id + boundedContext] = cachedEntry = this.registry.getEntry(id, boundedContext);
        }
        return cachedEntry;
    }

}

export default MemoizingAggregateRegistry
