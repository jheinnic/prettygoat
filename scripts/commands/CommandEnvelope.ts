import {Dictionary} from "ninjagoat";
import {IsUUID} from "class-validator";

class CommandEnvelope {
    readonly id:string;
    readonly type:string;
    readonly createdTimestamp:string;
    readonly metadata:Dictionary<any>;
    readonly payload:Object;

    static of(payload:Object, metadata?:Dictionary<any>) {

        let envelope = new CommandEnvelope();
        envelope.payload = payload;
        envelope.metadata = metadata || { };
        return envelope;
    }
}

export default CommandEnvelope
