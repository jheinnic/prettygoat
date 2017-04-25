import {IAggregate} from "../IAggregate";

class RegistryEntry<T> {

    constructor(
        public aggregate: IAggregate<T>,
        public exposedName: string,
        public parametersKey?: (parameters: any) => string) {
    }
}

export default RegistryEntry;
