import RegistryEntry from "./RegistryEntry";

class BoundedContextRegistry {
    constructor(public boundedContext:string, public entries:RegistryEntry<any>[]) {
    }
}

export default BoundedContextRegistry;
