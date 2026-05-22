import fs from "fs";
import path from "path";

import localConfig from "../../config.json";

export const isStaticBuild = process.env.NODE_ENV === "production";
export type ManufacturingConfig = typeof localConfig;

function resolveConfig(): ManufacturingConfig {
    const configPath = path.join(process.cwd(), "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as ManufacturingConfig;

    for (const key of Object.keys(config) as (keyof ManufacturingConfig)[]) {
        if (!(key in process.env)) continue;
        const raw = process.env[key]!;
        const current = config[key];
        (config as Record<string, unknown>)[key] =
            typeof current === "number" ? Number(raw) : typeof current === "boolean" ? raw === "true" : raw;
    }

    return config;
}

const config = resolveConfig();
export default config;

export const isLocalEnvironment = config.environment === "local";
export const useSecureCookie = !isLocalEnvironment;
