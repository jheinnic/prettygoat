import Route from "../web/RouteDecorator";
import {IRequestHandler, IRequest, IResponse} from "../web/IRequestComponents";

@Route("POST", "/api/authorization/check")
class AuthorizationHandler implements IRequestHandler {

    handle(request: IRequest, response: IResponse) {
        response.send({authorization: "success", environment: process.env.NODE_ENV || "development"});
    }

    keyFor(request: IRequest): string {
        return "";
    }

}


export default AuthorizationHandler;
