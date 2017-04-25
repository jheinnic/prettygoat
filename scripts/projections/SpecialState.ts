export abstract class SpecialState<T> {
    // state:T;
    abstract get state(): T;
}

export class SpecialStates {

    static stopSignalling<T>(state: T): SpecialState<T> {
        return new StopSignallingState(state);
    }

    static deleteSplit(): SpecialState<any> {
        return new DeleteSplitState();
    }
}

export class StopSignallingState<T> extends SpecialState<T> {
    private readonly _state: T;

    constructor(state: T) {
        super();
        this._state = state;
    }

    get state(): T {
        return this._state;
    }
}

export class DeleteSplitState extends SpecialState<any> {
    constructor() {
        super();
    }

    get state(): any {
        return undefined;
    }
}
