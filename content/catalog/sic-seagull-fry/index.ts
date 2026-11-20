import { authored } from "./authored";
import { synced } from "./synced";

export const listing = { ...synced, ...authored } as const;
