import IProjectionDefinition from "../../../scripts/registry/IProjectionDefinition";
import {IProjection} from "../../../scripts/projections/IProjection";
import Projection from "../../../scripts/registry/ProjectionDecorator";
import {ISnapshotStrategy} from "../../../scripts/snapshots/ISnapshotStrategy";
import {FilterOutputType} from "../../../scripts/filters/FilterComponents";

@Projection("Mock")
class MockProjectionDefinition implements IProjectionDefinition<number> {

    constructor(private strategy?:ISnapshotStrategy) {

    }

    define():IProjection<number> {
        return {
            name: "test",
            definition: {
                $init: () => 10,
                TestEvent: (s, e:number) => s + e
            },
            snapshotStrategy: this.strategy
        };
    }

}

export default MockProjectionDefinition