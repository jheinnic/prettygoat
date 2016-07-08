/// <reference path="../node_modules/typemoq/typemoq.node.d.ts" />
import "bluebird";
import "reflect-metadata";
import {ProjectionRunner} from "../scripts/projections/ProjectionRunner";
import {SpecialNames} from "../scripts/matcher/SpecialNames";
import {IMatcher} from "../scripts/matcher/IMatcher";
import {IStreamFactory} from "../scripts/streams/IStreamFactory";
import {MockMatcher} from "./fixtures/MockMatcher";
import {MockStreamFactory} from "./fixtures/MockStreamFactory";
import {Observable, Subject, IDisposable} from "rx";
import {Mock, Times, It} from "typemoq";
import expect = require("expect.js");
import * as Rx from "rx";
import IReadModelFactory from "../scripts/streams/IReadModelFactory";
import ReadModelFactory from "../scripts/streams/ReadModelFactory";
import Event from "../scripts/streams/Event";

describe("Given a ProjectionRunner", () => {
    let stream:Mock<IStreamFactory>;
    let subject:ProjectionRunner<number>;
    let matcher:Mock<IMatcher>;
    let notifications:number[];
    let stopped:boolean;
    let failed:boolean;
    let subscription:IDisposable;
    let readModelFactory:Mock<IReadModelFactory>;

    beforeEach(() => {
        notifications = [];
        stopped = false;
        failed = false;
        stream = Mock.ofType<IStreamFactory>(MockStreamFactory);
        matcher = Mock.ofType<IMatcher>(MockMatcher);
        readModelFactory = Mock.ofType<IReadModelFactory>(ReadModelFactory);
        subject = new ProjectionRunner<number>("test", stream.object, matcher.object, readModelFactory.object);
        subscription = subject.subscribe((state:Event) => notifications.push(state.payload), e => failed = true, () => stopped = true);
        readModelFactory.setup(r => r.from(null)).returns(_ => Rx.Observable.empty<Event>());
    });

    afterEach(() => subscription.dispose());

    context("when initializing a projection", () => {
        beforeEach(() => {
            stream.setup(s => s.from(null)).returns(_ => Observable.just({ type: null,  payload:null }));
            matcher.setup(m => m.match(SpecialNames.Init)).returns(streamId => () => 42);
            subject.run();
        });

        it("should create an initial state based on the projection definition", () => {
            matcher.verify(m => m.match(SpecialNames.Init), Times.once());
        });
        it("should subscribe to the event stream starting from the stream's beginning", () => {
            stream.verify(s => s.from(null), Times.once());
        });

        it("should subscribe to the aggregates stream to build linked projections", () => {
            readModelFactory.verify(a => a.from(null), Times.once());
        });

        context("should behave regularly", behavesRegularly);

        function behavesRegularly() {
            it("should consider the initial state as the projection state", () => {
                expect(subject.state).to.be(42);
            });
            it("should notify that the projection has been initialized", () => {
                expect(notifications).to.eql([42]);
            });
        }
    });

    context("when receiving an event from a stream", () => {
        beforeEach(() => {
            matcher.setup(m => m.match(SpecialNames.Init)).returns(streamId => () => 42);
            stream.setup(s => s.from(null)).returns(_ => Observable.range(1, 5).map(n => {
                return {type: "increment", payload: n};
            }).observeOn(Rx.Scheduler.immediate));
        });

        context("and no error occurs", () => {
            beforeEach(() => {
                matcher.setup(m => m.match("increment")).returns(streamId => (s:number, e:any) => s + e);
                subject.run();
            });

            it("should match the event with the projection definition", () => {
                matcher.verify(m => m.match("increment"), Times.exactly(5));
            });
            it("should consider the returned state as the projection state", () => {
                expect(subject.state).to.be(42 + 1 + 2 + 3 + 4 + 5);
            });
            it("should notify that the projection has been updated", () => {
                expect(notifications).to.be.eql([
                    42,
                    42 + 1,
                    42 + 1 + 2,
                    42 + 1 + 2 + 3,
                    42 + 1 + 2 + 3 + 4,
                    42 + 1 + 2 + 3 + 4 + 5
                ]);
            });

            it("should publish on the event stream the new aggregate state", () => {
                readModelFactory.verify(a => a.publish(It.isValue({type: "test", payload: 42, timestamp: ""})), Times.atLeastOnce());
            });

        });

        context("and no match is found for this event", () => {
            beforeEach(() => {
                stream.setup(s => s.from(null)).returns(_ => Observable.range(1, 5).map(n => {
                    return {type: "increment" + n, payload: n};
                }));
                matcher.setup(m => m.match("increment1")).returns(streamId => Rx.helpers.identity);
                matcher.setup(m => m.match("increment2")).returns(streamId => (s:number, e:any) => s + e);
                matcher.setup(m => m.match("increment3")).returns(streamId => (s:number, e:any) => s + e);
                matcher.setup(m => m.match("increment4")).returns(streamId => Rx.helpers.identity);
                matcher.setup(m => m.match("increment5")).returns(streamId => Rx.helpers.identity);
            });

            it("should not notify a state change", () => {
                subject.run();
                expect(notifications).to.be.eql([
                    42,
                    42 + 2,
                    42 + +2 + 3
                ]);
            });
        });

        context("and an error occurs while processing the event", () => {
            beforeEach(() => {
                matcher.setup(m => m.match("increment")).returns(streamId => (s:number, e:any) => {
                    throw new Error("Kaboom!");
                });
                subject.run();
            });
            it("should notify an error", () => {
                expect(failed).to.be.ok();
            });
        });
    });

    context("when stopping a projection", () => {
        let streamSubject = new Subject<any>();
        beforeEach(() => {
            matcher.setup(m => m.match(SpecialNames.Init)).returns(streamId => () => 42);
            matcher.setup(m => m.match("increment")).returns(streamId => (s:number, e:any) => s + e);
            stream.setup(s => s.from(null)).returns(_ => streamSubject);

            subject.run();
            streamSubject.onNext({type: "increment", payload: 1});
            streamSubject.onNext({type: "increment", payload: 2});
            streamSubject.onNext({type: "increment", payload: 3});
            streamSubject.onNext({type: "increment", payload: 4});
            subject.stop();
            streamSubject.onNext({type: "increment", payload: 5});
        });
        it("should not process any more events", () => {
            expect(notifications).to.eql([
                42,
                42 + 1,
                42 + 1 + 2,
                42 + 1 + 2 + 3,
                42 + 1 + 2 + 3 + 4
            ]);
        });
        it("should notify that the projection has been stopped", () => {
            expect(stopped).to.be.ok();
        });

        context("and the projection is started again", () => {
            it("should throw an error", () => {
                expect(() => subject.run()).to.throwError();
            });
        });
    });
});
