import {decorate, injectable} from "inversify";
import Methods from "./Methods";
import {makeDecorator} from "reflect-helper";

export class RouteDecorator {
    method: Methods;
    path: string;
}

const applyRoute = makeDecorator(RouteDecorator);
// const applyRoute = <MethodDecorator|ClassDecorator> makeDecorator(RouteDecorator);

// function Route(method: Methods, path: string) {
//     return function (target: any) {
//         decorate(injectable(), target);
//         Reflect.defineMetadata("prettygoat:method", method, target);
//         Reflect.defineMetadata("prettygoat:path", path, target);
//         return target;
//     };
// }

function Route(method: Methods, path: string) {
    const decoFn = applyRoute(method, path);
    return function (target: any, ...args: any[]) {
        decorate(injectable(), target);
        decoFn.apply(target, args);
    }
};

export default Route

