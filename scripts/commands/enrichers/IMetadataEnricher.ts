import {Dictionary} from "ninjagoat";

interface IMetadataEnricher {
    enrich(command?:Object, metadata?:Dictionary<any>):Dictionary<any>
}

export default IMetadataEnricher