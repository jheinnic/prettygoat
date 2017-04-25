/**
 * Created by jheinnic on 4/20/17.
 */

import {Symbolic} from "../../../utils/values/builder";
export type RegistryType = "aggregate" | "projection";

export const REGISTRIES: Symbolic<RegistryType> = {
    aggregate: Symbol("aggregate"),
    projection: Symbol("projection")
};
