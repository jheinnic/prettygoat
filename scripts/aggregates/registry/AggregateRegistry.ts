import {inject, injectable, interfaces} from "inversify";
import RegistryEntry from "./RegistryEntry";
import IAggregateRegistry from "./IAggregateRegistry";
import BoundedContextRegistry from "./BoundedContextRegistry";
import IAggregateDefinition from "./IAggregateDefinition";
import ITickScheduler from "../../ticks/ITickScheduler";
import IObjectContainer from "../../ioc/IObjectContainer";
import * as _ from "lodash";

@injectable()
class AggregateRegistry implements IAggregateRegistry {
    registryType: "aggregate";
    private registry: BoundedContextRegistry[] = [];
    private unregisteredEntries: {
        ctor: interfaces.Newable<IAggregateDefinition<any>>,
        exposedName: string,
        parametersKey?: (parameters: any) => string
    }[] = [];

    constructor(@inject("IObjectContainer") private container: IObjectContainer,
                @inject("Factory<ITickScheduler>") private tickSchedulerFactory: interfaces.Factory<ITickScheduler>,
                @inject("ITickSchedulerHolder") private tickSchedulerHolder: Dictionary<ITickScheduler>) {

    }

    add<T>(constructor: interfaces.Newable<IAggregateDefinition<T>>, parametersKey?: (parameters: any) => string): IAggregateRegistry {
        let name = Reflect.getMetadata("prettygoat:Aggregate", constructor);
        if (!name)
            throw new Error("Missing Aggregate decorator");
        this.unregisteredEntries.push({ctor: constructor, exposedName: name, parametersKey: parametersKey});
        return this;
    }

    forBoundedContext(BoundedContext: string): BoundedContextRegistry {
        let entries = _.map(this.unregisteredEntries, entry => {
            let tickScheduler = <ITickScheduler>this.tickSchedulerFactory(),
                aggregate = this.getDefinitionFromConstructor(entry.ctor, BoundedContext, entry.exposedName).define(tickScheduler);
            // validationErrors = this.analyzer.analyze(aggregate);

            this.tickSchedulerHolder[aggregate.name] = tickScheduler;
            if (aggregate.split && !entry.parametersKey)
                throw new Error(`Missing parameters key function from Aggregate ${aggregate.name} registration`);
            // if (validationErrors.length > 0)
            //     throw new Error(validationErrors[0]);
            return new RegistryEntry(aggregate, entry.exposedName, entry.parametersKey);
        });

        let boundedContextRegistry = new BoundedContextRegistry(BoundedContext, entries);
        this.registry.push(boundedContextRegistry);
        this.unregisteredEntries = [];
        if (this.hasDuplicatedEntries())
            throw new Error("Cannot startup due to some aggregates with the same name");

        return boundedContextRegistry;
    }

    private getDefinitionFromConstructor<T>(constructor: interfaces.Newable<IAggregateDefinition<T>>,
                                            boundedContext: string, name: string): IAggregateDefinition<T> {
        const key = `prettygoat:definitions:${boundedContext}:${name}`;
        if (!this.container.contains(key))
            this.container.set(key, constructor);
        return this.container.get<IAggregateDefinition<T>>(key);
    }

    private hasDuplicatedEntries(): boolean {
        let entries = _(this.getBoundedContexts())
            .map(
                (BoundedContextRegistry: BoundedContextRegistry) => BoundedContextRegistry.entries)
            .concat()
            .flatten()
            .groupBy((entry: RegistryEntry<any>) => entry.aggregate.name)
            .valueOf();
        return _.some(entries, (entry: RegistryEntry<any>[]) => entry.length > 1);
    }

    getBoundedContexts(): BoundedContextRegistry[] {
        return this.registry;
    }

    getBoundedContext(boundedContextId: string): BoundedContextRegistry|undefined {
        return _.find(
            this.registry,
            (entry: BoundedContextRegistry) =>
            entry.boundedContext.toLowerCase() === boundedContextId.toLowerCase()
        );
    }

    getEntry<T>(id: string, boundedContext: string): { boundedContext: string, data: RegistryEntry<T> }|undefined {
        let entry: RegistryEntry<T>|undefined;
        if (boundedContext) {
            let boundedContextRegistry = this.getBoundedContext(boundedContext);
            if (boundedContextRegistry) {
                entry = _.find(
                    boundedContextRegistry.entries, (entry: RegistryEntry<any>) =>
                    entry.exposedName.toLowerCase() === id.toLowerCase())!;
                boundedContext = boundedContextRegistry.boundedContext;
            }
        } else {
            let boundedContexts = this.getBoundedContexts();
            _.forEach(boundedContexts, (boundedContextRegistry: BoundedContextRegistry) => {
                if (!entry) {
                    let foundEntry: RegistryEntry<any> | undefined = _.find(
                        boundedContextRegistry.entries, (entry: RegistryEntry<any>) =>
                        entry.aggregate.name.toLowerCase() === id.toLowerCase());

                    if (!!foundEntry) {
                        entry = foundEntry;
                        boundedContext = boundedContextRegistry.boundedContext;
                    }
                }
            });
        }
        return entry ? {
            boundedContext: boundedContext,
            data: entry
        } : undefined;
    }
}

export default AggregateRegistry
