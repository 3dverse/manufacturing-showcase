import { isStaticBuild } from "./config";
import { bootstrapDatasets } from "./generator/bootstrap";

//------------------------------------------------------------------------------
export async function setupService(): Promise<void> {
    await bootstrapDatasets();

    if (!isStaticBuild) {
        await import("./frontend").then((m) => m.initialize());
    }
}

//------------------------------------------------------------------------------
export async function tearDownService(): Promise<void> {}
