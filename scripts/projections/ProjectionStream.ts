import {Event} from "../streams/Event";
import {Observable, Subject, VirtualTimeScheduler} from "rxjs";
// Disposable, HistoricalScheduler} from "rxjs";
import ReservedEvents from "../streams/ReservedEvents";
import Tick from "../ticks/Tick";
import IDateRetriever from "../util/IDateRetriever";
import * as _ from "lodash";
import HistoricalScheduler from "rx.schedulers";

function defaultSubComparer(x, y) { return x > y ? 1 : (x < y ? -1 : 0); }

export function combineStreams(combined: Subject<Event>, events: Observable<Event>, readModels: Observable<Event>, ticks: Observable<Event>, dateRetriever: IDateRetriever) {
    let realtime = false;
    let scheduler = new HistoricalScheduler(0, defaultSubComparer);

    events
        .merge(readModels)
        .filter(event => !_.startsWith(event.type, "__diagnostic"))
        .subscribe(event => {
            if (event.type === ReservedEvents.REALTIME) {
                if (!realtime)
                    scheduler.advanceTo(Number.MAX_VALUE); //Flush events buffer since there are no more events
                realtime = true;
            }
            if (realtime || !event.timestamp) {
                combined.next(event);
            } else {
                scheduler.scheduleFuture(null, event.timestamp, (scheduler, state) => {
                    combined.next(event);
                    return Observable.empty().subscribe(() => {});
                });
                try {
                    scheduler.advanceTo(+event.timestamp);
                } catch (error) {
                    combined.error(error);
                }
            }
        });

    ticks.subscribe(event => {
        let payload: Tick = event.payload;
        if (realtime || payload.clock > dateRetriever.getDate()) {
            Observable.timer(event.timestamp).subscribe((pulse:any) => combined.next(event));
        } else {
            scheduler.scheduleFuture(null, payload.clock, (scheduler, state) => {
                combined.next(event);
                return Observable.empty().subscribe(() => {});
            });
        }
    });
}
