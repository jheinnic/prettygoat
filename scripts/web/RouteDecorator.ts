import {decorate, injectable} from "inversify";
import Methods from "./Methods";

function Route(method: Methods, path: string) {
    return function (target: any) {
        decorate(injectable(), target);
        Reflect.defineMetadata("prettygoat:method", method, target);
        Reflect.defineMetadata("prettygoat:path", path, target);
        return target;
    };
}

export default Route

