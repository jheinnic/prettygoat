import {interfaces} from "inversify";
import IModule from "../bootstrap/module/IModule";
import IServiceLocator from "../ioc/IServiceLocator";
import ICommandDispatcher from "./dispatchers/ICommandDispatcher";
import CommandDispatcherEnricher from "./dispatchers/CommandDispatcherEnricher";
import CommandDispatcher from "./dispatchers/CommandDispatcher";
import PostCommandDispatcher from "./dispatchers/PostCommandDispatcher";
import IMetadataEnricher from "./enrichers/IMetadataEnricher";
import EmptyMetadataEnricher from "./enrichers/EmptyMetadataEnricher";
import {IRegistry} from "../bootstrap/module/IRegistry";

class CommandsModule implements IModule {

    modules = (container:interfaces.Container) => {
        container.bind<ICommandDispatcher>("ICommandDispatcher").to(CommandDispatcherEnricher).inSingletonScope();
        container.bind<CommandDispatcher>("ICommandDispatcher").to(PostCommandDispatcher).inSingletonScope().whenInjectedInto(CommandDispatcherEnricher);
        container.bind<IMetadataEnricher>("IMetadataEnricher").to(EmptyMetadataEnricher).inSingletonScope(); //Needed by inversify to resolve correctly the dependency graph
    };

    register(registry:IRegistry, serviceLocator?:IServiceLocator, overrides?:any):void {

    }
}

export default CommandsModule;
