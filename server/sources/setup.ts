import { isStaticBuild } from "./config";
import { generateDataset } from "./generator";
import { setDataset } from "./generator/store";
import { defaultGeneratorConfig } from "./generator/input";

//------------------------------------------------------------------------------
export async function setupService(): Promise<void> {
    // Generate the in-memory dataset at startup
    const dataset = generateDataset(defaultGeneratorConfig);
    setDataset(dataset);

    const setupPromises: Promise<void>[] = [];

    if (!isStaticBuild) {
        setupPromises.push(import("./frontend").then((module) => module.initialize()));
    }

    await Promise.all(setupPromises);
}

//------------------------------------------------------------------------------
// Anything to do after closing the server goes here
export async function tearDownService(): Promise<void> {}
