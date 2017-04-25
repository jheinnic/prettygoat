import {injectable, decorate} from "inversify";

function Aggregate(name:string) {
    return function (target:any) {
        decorate(injectable(), target);
        Reflect.defineMetadata("prettygoat:Aggregate", name, target);
        return target;
    };
}

export default Aggregate
