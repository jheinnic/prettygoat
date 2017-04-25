/**
 * Created by jheinnic on 3/17/17.
 */

// export abstract class EventPayload {
//     protected constructor(readonly urn: Readonly<URI>) { }
// }

export interface IEventPayload {
    // TODO: Use the type from the IEvent interface intead
    readonly type: string;
}
