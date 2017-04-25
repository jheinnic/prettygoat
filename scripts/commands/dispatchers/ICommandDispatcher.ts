import CommandResponse from "../CommandResponse";
import {Dictionary} from "ninjagoat";

interface ICommandDispatcher {
    dispatch(command:Object, metadata?:Dictionary<any>):Promise<CommandResponse>;
}

export default ICommandDispatcher