import { IProjection } from "./IProjection";
import {injectable} from "inversify";

export class ProjectionErrors {
    public static NoName = "Projection has no name";
    public static NoDefinition = "Projection requires an event handling definition";
}

@injectable()
export class ProjectionAnalyzer {
    analyze<T>(projection: IProjection<T>): Array<string> {
        let result = new Array<string>();

        if (!projection.name || projection.name.trim() === "")
            result.push(ProjectionErrors.NoName);

        if (!projection.definition)
            result.push(ProjectionErrors.NoDefinition);
        return result;
    }
}
