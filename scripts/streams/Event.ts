export interface Event {
    type: string;
    payload?: any;
    timestamp: Date;
    splitKey?: string;
}
