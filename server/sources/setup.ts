import { isStaticBuild } from "./config";

//------------------------------------------------------------------------------
export async function setupService(): Promise<void> {
    const setupPromises: Promise<void>[] = [];

    if (!isStaticBuild) {
        setupPromises.push(import("./frontend").then((module) => module.initialize()));
    }

    await Promise.all(setupPromises);
}

//------------------------------------------------------------------------------
// Anything to do after closing the server goes here
export async function tearDownService(): Promise<void> {}
