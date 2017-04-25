import {interfaces} from "inversify";
import IModule from "../bootstrap/module/IModule";
import IServiceLocator from "../ioc/IServiceLocator";
import IAuthorizationStrategy from "./IAuthorizationStrategy";
import {IMiddleware, IRequestHandler} from "../web/IRequestComponents";
import AuthMiddleware from "./AuthMiddleware";
import {SnapshotSaveHandler, SnapshotDeleteHandler} from "./SnapshotHandlers";
import AuthorizationHandler from "./AuthorizationHandler";
import SystemProjection from "./SystemProjection";
import ApiKeyAuthorizationStrategy from "./ApiKeyAuthorizationStrategy";
import {ProjectionStopHandler, ProjectionStatsHandler, ProjectionRestartHandler} from "./ProjectionsHandlers";
import {IRegistry} from "../bootstrap/module/IRegistry";

class APIModule implements IModule {

    modules = (container: interfaces.Container) => {
        container.bind<IAuthorizationStrategy>("IAuthorizationStrategy").to(ApiKeyAuthorizationStrategy).inSingletonScope();
        container.bind<IMiddleware>("IMiddleware").to(AuthMiddleware).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(ProjectionStopHandler).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(ProjectionRestartHandler).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(SnapshotSaveHandler).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(SnapshotDeleteHandler).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(AuthorizationHandler).inSingletonScope();
        container.bind<IRequestHandler>("IRequestHandler").to(ProjectionStatsHandler).inSingletonScope();
    };

    register(registry: IRegistry, serviceLocator?: IServiceLocator, overrides?: any): void {
        switch (registry.registryType) {
            case "aggregate":
                break;
            case "projection": {
                registry.add(SystemProjection).forArea("__diagnostic");
                break;
            }
        }
    }
}

export default APIModule;
