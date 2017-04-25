import {injectable, inject} from "inversify";
import IProjectionRegistry from "../registry/IProjectionRegistry";
import * as _ from "lodash";
import AreaRegistry from "../registry/AreaRegistry";
import RegistryEntry from "../registry/RegistryEntry";
import IProjectionSorter from "./IProjectionSorter";
import {IProjection} from "./IProjection";
import {Matcher} from "../matcher/Matcher";
import Identity from "../matcher/Identity";
const toposort = require("toposort");

@injectable()
class ProjectionSorter implements IProjectionSorter {

    constructor(@inject("IProjectionRegistry") private registry: IProjectionRegistry) {
    }

    sort(projection?: IProjection<any>): string[] {
        return toposort(_.reduce(this.registry.getAreas(), (graph, area: AreaRegistry) => {
            graph = _.concat(graph, _.reduce(area.entries, (result, entry: RegistryEntry<any>) => {
                result = _.concat(result, this.edgesOf(entry.projection));
                return result;
            }, <string[][]>[]));
            return graph;
        }, <string[][]>[]));
    }

    dependencies(projection: IProjection<any>): string[] {
        return _.filter(toposort(this.edgesOf(projection)), (p: string) => p != projection.name);
    }

    dependents(projection: IProjection<any>): string[] {
        let projections = <IProjection<any>[]>_(this.registry.getAreas())
            .map((area: AreaRegistry) => _.map(area.entries, (entry: RegistryEntry<any>) => entry.projection))
            .flatten()
            .valueOf();

        return _(projections)
            .filter(proj => {
                let matcher = new Matcher(proj.definition);
                return matcher.match(projection.name) !== Identity;
            })
            .map(proj => proj.name)
            .valueOf();
    }

    private edgesOf(projection: IProjection<any>): string[][] {
        return _(projection.definition)
            .keys()
            .filter(projection => {
                let registryEntry = this.registry.getEntry(projection, undefined);
                // TODO: Check whether null data was previously treated differently than undefined data?
                return !!registryEntry && !!registryEntry.data;
            })
            .map((nodeTo) => [projection.name, nodeTo])
            .valueOf();
    }

}

export default ProjectionSorter
