import {interfaces} from "inversify";
import IServiceLocator from "../../ioc/IServiceLocator";
import IProjectionRegistry from "../../projections/registry/IProjectionRegistry";
import IAggregateRegistry from "../../aggregates/registry/IAggregateRegistry";
import {IRegistry} from "./IRegistry";
import ContainerModuleCallBack = interfaces.ContainerModuleCallBack;

interface IModule {
    /**
     * Original Prettygoat/Ninjagoat module activation method.  Exposes the container
     * @param container
     */
    modules?: (container: interfaces.Container) => void;
    load?: (bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => void;

    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any): void;
    register(registry: IAggregateRegistry, serviceLocator?: IServiceLocator, overrides?: any): void;
    register(registry: IRegistry, serviceLocator?: IServiceLocator, overrides?: any): void;
}

export default IModule;
