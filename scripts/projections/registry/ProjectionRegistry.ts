import IProjectionRegistry from "./IProjectionRegistry";
import AreaRegistry from "./AreaRegistry";
import RegistryEntry from "./RegistryEntry";
import IProjectionDefinition from "./IProjectionDefinition";
import Constants from "./Constants";
import {ProjectionAnalyzer} from "../ProjectionAnalyzer";
import ITickScheduler from "../../ticks/ITickScheduler";
import IObjectContainer from "../../ioc/IObjectContainer";
import {inject, injectable, interfaces} from "inversify";
import * as _ from "lodash";

@injectable()
class ProjectionRegistry implements IProjectionRegistry {
    registryType: "projection";

    private registry: AreaRegistry[] = [];
    private unregisteredEntries: {
        ctor: interfaces.Newable<IProjectionDefinition<any>>,
        exposedName: string,
        parametersKey?: (parameters: any) => string
    }[] = [];

    constructor(@inject("ProjectionAnalyzer") private analyzer: ProjectionAnalyzer,
                @inject("IObjectContainer") private container: IObjectContainer,
                @inject("Factory<ITickScheduler>") private tickSchedulerFactory: interfaces.Factory<ITickScheduler>,
                @inject("ITickSchedulerHolder") private tickSchedulerHolder: Dictionary<ITickScheduler>) {
    }

    master<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>): AreaRegistry {
        return this.add(constructor).forArea(Constants.MASTER_AREA);
    }

    index<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>): AreaRegistry {
        return this.add(constructor).forArea(Constants.INDEX_AREA);
    }

    add<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>,
           parametersKey?: (parameters: any) => string): ProjectionRegistry {
        let name = Reflect.getMetadata("prettygoat:projection", constructor);
        if (!name)
            throw new Error("Missing Projection decorator");
        this.unregisteredEntries.push({ctor: constructor, exposedName: name, parametersKey: parametersKey});
        return this!!;
    }

    forArea(area: string): AreaRegistry {
        let entries = _.map(this.unregisteredEntries, entry => {
            let tickScheduler = <ITickScheduler>this.tickSchedulerFactory(),
                projection = this.getDefinitionFromConstructor(entry.ctor, area, entry.exposedName).define(tickScheduler),
                validationErrors = this.analyzer.analyze(projection);
            this.tickSchedulerHolder[projection.name] = tickScheduler;
            if (projection.split && !entry.parametersKey)
                throw new Error(`Missing parameters key function from projection ${projection.name} registration`);
            if (validationErrors.length > 0)
                throw new Error(validationErrors[0]);
            return new RegistryEntry(projection, entry.exposedName, entry.parametersKey);
        });
        let areaRegistry = new AreaRegistry(area, entries);
        this.registry.push(areaRegistry);
        this.unregisteredEntries = [];
        if (this.hasDuplicatedEntries()) throw new Error("Cannot startup due to some projections with the same name");
        return areaRegistry;
    }

    private getDefinitionFromConstructor<T>(constructor: interfaces.Newable<IProjectionDefinition<T>>, area: string, name: string): IProjectionDefinition<T> {
        const key = `prettygoat:definitions:${area}:${name}`;
        if (!this.container.contains(key))
            this.container.set(key, constructor);
        return this.container.get<IProjectionDefinition<T>>(key);
    }

    private hasDuplicatedEntries(): boolean {
        let entries = _(this.getAreas())
            .map((areaRegistry: AreaRegistry) => areaRegistry.entries)
            .concat()
            .flatten()
            .groupBy((entry: RegistryEntry<any>) => entry.projection.name)
            .valueOf();
        return _.some(entries, (entry: RegistryEntry<any>[]) => entry.length > 1);
    }

    getAreas(): AreaRegistry[] {
        return this.registry;
    }

    getArea(areaId: string): AreaRegistry | undefined {
        return _.find(this.registry, (entry: AreaRegistry) => entry.area.toLowerCase() === areaId.toLowerCase());
    }

    getEntry<T>(id: string, area: string): { area: string, data: RegistryEntry<T> } | undefined {
        let entry: RegistryEntry<any> | undefined;

        if (area) {
            let areaRegistry = this.getArea(area);
            if (areaRegistry) {
                entry = _.find(
                    areaRegistry.entries, (entry: RegistryEntry<any>) =>
                    entry.exposedName.toLowerCase() === id.toLowerCase())!;
                area = areaRegistry.area;
            }
        } else {
            let areas = this.getAreas();
            _.forEach(areas, (areaRegistry: AreaRegistry) => {
                if (!entry) {
                    let foundEntry: RegistryEntry<any> | undefined = _.find(
                        areaRegistry.entries, (entry: RegistryEntry<any>) =>
                        entry.projection.name.toLowerCase() === id.toLowerCase());

                    if (!!foundEntry) {
                        entry = foundEntry;
                        area = areaRegistry.area;
                    }
                }
            });
        }
        return !!entry ? {
            area: area,
            data: entry
        } : undefined;
    }
}

export default ProjectionRegistry
