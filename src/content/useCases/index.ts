import type { UseCase } from "@/content/type";

//------------------------------------------------------------------------------
import { maintenance_incident } from "./maintenance_incident";
import { lorem_ipsum } from "./lorem_ipsum";

//------------------------------------------------------------------------------
export const useCases: UseCase[] = [maintenance_incident, lorem_ipsum];
