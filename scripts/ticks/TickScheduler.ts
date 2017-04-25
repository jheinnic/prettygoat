import {Event} from "../streams/Event";
import IDateRetriever from "../util/IDateRetriever";
import ReservedEvents from "../streams/ReservedEvents";
import ITickScheduler from "./ITickScheduler";
import Tick from "./Tick";

import {injectable, inject} from "inversify";
import {ReplaySubject, Observable} from "rxjs";
import * as moment from "moment";

@injectable()
class TickScheduler implements ITickScheduler {

    private subject = new ReplaySubject<Event>();

    constructor(@inject("IDateRetriever") private dateRetriever:IDateRetriever) {

    }

    schedule(dueTime:number|Date, state?:string, splitKey?:string) {
        let dueDate = dueTime instanceof Date ? dueTime : this.calculateDueDate(<number>dueTime);
        this.subject.next({
            type: ReservedEvents.TICK,
            payload: new Tick(dueDate, state),
            timestamp: dueDate,
            splitKey: splitKey
        });
    }

    from(lastEvent:Date):Observable<Event> {
        return this.subject;
    }

    private calculateDueDate(dueTime:number):Date {
        return moment(this.dateRetriever.getDate()).add(dueTime, 'milliseconds').toDate();
    }
}

export default TickScheduler
