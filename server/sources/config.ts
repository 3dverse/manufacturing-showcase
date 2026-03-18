import config from "@3dverse/service-environment";

import localConfig from "../../config.json";

export const isStaticBuild = process.env.NODE_ENV === "production";

export type ManufacturingConfig = typeof localConfig;

export default config as unknown as ManufacturingConfig;

export const isLocalEnvironment = config.environment === "local";
export const useSecureCookie = !isLocalEnvironment;
