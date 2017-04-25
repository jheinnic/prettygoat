import {inject} from "inversify";
import Dictionary from "../util/Dictionary";
import IProjectionRunner from "../projections/IProjectionRunner";
import {ISnapshotRepository, Snapshot} from "../snapshots/ISnapshotRepository";
import IDateRetriever from "../util/IDateRetriever";
import Route from "../web/RouteDecorator";
import {IRequestHandler, IRequest, IResponse} from "../web/IRequestComponents";
//import {TYPES} from "../../../server/constants/types";
import {Logger} from "bunyan";

@Route("POST", "/api/snapshots/save/:projectionName")
export class SnapshotSaveHandler implements IRequestHandler {

    constructor(@inject("IProjectionRunnerHolder") private holder: Dictionary<IProjectionRunner<any>>,
                @inject("ISnapshotRepository") private snapshotRepository: ISnapshotRepository,
                @inject("IDateRetriever") private dateRetriever: IDateRetriever,
                @inject("Logger") private logger: Logger) {
    }

    handle(request: IRequest, response: IResponse) {
        let name = request.params.projectionName;
        let projection = this.holder[name];

        if (!projection) {
            response.status(404);
            response.send({error: "Projection not found"});
            return;
        }

        this.snapshotRepository.saveSnapshot(name, new Snapshot(projection.state, this.dateRetriever.getDate())).subscribe(
            () => { },
            (error: any) => { this.logger.error(`Error on saving snapshot for ${name}`, error); },
            () => { this.logger.debug("Successfully saved snapshot for %s", name); }
        );
        response.send({name: name});
    }

    keyFor(request: IRequest): string {
        return request.params.projectionName;
    }

}

@Route("POST", "/api/snapshots/delete/:projectionName")
export class SnapshotDeleteHandler implements IRequestHandler {

    constructor(@inject("IProjectionRunnerHolder") private holder: Dictionary<IProjectionRunner<any>>,
                @inject("ISnapshotRepository") private snapshotRepository: ISnapshotRepository) {
    }

    handle(request: IRequest, response: IResponse) {
        let name = request.params.projectionName;
        let projection = this.holder[name];

        if (!projection) {
            response.status(404);
            response.send({error: "Projection not found"});
            return;
        }

        this.snapshotRepository.deleteSnapshot(name).subscribe(() => {});
        response.send({name: name});
    }

    keyFor(request: IRequest): string {
        return request.params.projectionName;
    }

}
