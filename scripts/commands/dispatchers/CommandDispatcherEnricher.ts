import ICommandDispatcher from "./ICommandDispatcher";
import CommandResponse from "../CommandResponse";
import IMetadataEnricher from "../enrichers/IMetadataEnricher";
import {injectable, inject, multiInject} from "inversify";
import * as _ from "lodash";

@injectable()
class CommandDispatcherEnricher implements ICommandDispatcher {
    private enrichers: ReadonlyArray<IMetadataEnricher>;

    constructor(@inject("CommandDispatcher") private commandDispatcher:ICommandDispatcher,
                @multiInject("IMetadataEnricher") enrichers:IMetadataEnricher[] = []) {
        this.enrichers = Array.of.apply(undefined, enrichers);
    }

    dispatch(command:Object):Promise<CommandResponse> {
        let metadata:Dictionary<any> = _.reduce(this.enrichers, (result, enricher) => {
            result = enricher.enrich(command, result);
            return result;
        }, {});
        return this.commandDispatcher.dispatch(command, metadata);
    }
}

export default CommandDispatcherEnricher
