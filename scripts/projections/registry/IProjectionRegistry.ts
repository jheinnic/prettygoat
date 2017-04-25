import AreaRegistry from "./AreaRegistry";
import RegistryEntry from "./RegistryEntry";
import IProjectionDefinition from "./IProjectionDefinition";
import {interfaces} from "inversify";

interface IProjectionRegistry {
    registryType: "projection";
    master<T>(constructor:interfaces.Newable<IProjectionDefinition<T>>):AreaRegistry;
    index<T>(constructor:interfaces.Newable<IProjectionDefinition<T>>):AreaRegistry;
    add<T>(constructor:interfaces.Newable<IProjectionDefinition<T>>, parametersKey?:(parameters:any) => string):IProjectionRegistry;
    forArea(area:string):AreaRegistry;
    getAreas():AreaRegistry[];
    getArea(areaId: string): AreaRegistry|undefined;
    getEntry<T>(id:string, area?:string):{ area:string, data:RegistryEntry<T>|undefined}|undefined;

}

export default IProjectionRegistry;
