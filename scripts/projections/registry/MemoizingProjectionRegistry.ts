import {inject, interfaces, injectable} from "inversify";
import IProjectionRegistry from "./IProjectionRegistry";
import IProjectionDefinition from "./IProjectionDefinition";
import AreaRegistry from "./AreaRegistry";
import RegistryEntry from "./RegistryEntry";
import Dictionary from "../../util/Dictionary";

type CachedLookup = { area: string; data: RegistryEntry<any>|undefined };

@injectable()
class MemoizingProjectionRegistry implements IProjectionRegistry {
    registryType: "projection";

    private cache: Dictionary<CachedLookup> = { };

    constructor(@inject("ProjectionRegistry") private registry: IProjectionRegistry) {

    }

    master<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>): AreaRegistry {
        return this.registry.master(constructor);
    }

    index<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>): AreaRegistry {
        return this.registry.index(constructor);
    }

    add<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>, parametersKey?: (parameters: any) => string): IProjectionRegistry {
        return this.registry.add(constructor, parametersKey);
    }

    forArea(area: string): AreaRegistry {
        return this.registry.forArea(area);
    }

    getAreas(): AreaRegistry[] {
        return this.registry.getAreas();
    }

    getArea(areaId: string): AreaRegistry | undefined {
        return this.registry.getArea(areaId);
    }

    getEntry<T>(id: string, area?: string): CachedLookup | undefined {
        let cachedEntry: CachedLookup | undefined = this.cache[id + area];
        if ((cachedEntry === undefined) || (cachedEntry.data === undefined)) {
            cachedEntry = this.registry.getEntry(id, area);
            if (cachedEntry !== undefined) {
                this.cache[id + area] = cachedEntry;
            }
        }

        return cachedEntry;
    }

}

export default MemoizingProjectionRegistry
