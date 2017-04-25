/**
 * Created by jheinnic on 4/20/17.
 */

import IProjectionRegistry from "../../projections/registry/IProjectionRegistry";
import IAggregateRegistry from "../../aggregates/registry/IAggregateRegistry";
import IViewModelRegistry from "../../../TODO/views/registry/IViewModelRegistry";

export type IRegistry = IAggregateRegistry | IProjectionRegistry | IViewModelRegistry;


