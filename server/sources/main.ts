//-----------------------------------------------------------------------------
import { setApiKey, setBaseURL } from "@3dverse/api";
import config from "./config";

//------------------------------------------------------------------------------
import { installFatalErrorHandler } from "@3dverse/service-common-errors";

if (config.environment !== "local") {
    installFatalErrorHandler();
}

//-----------------------------------------------------------------------------
import pino from "pino";

const logger = pino({
    base: {},
    formatters: { level: (label) => ({ level: label }) },
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    level: (() => {
        const l = process.env.LOG_LEVEL?.toLowerCase();
        const valid = ["trace", "debug", "info", "warn", "error", "fatal"];
        return l && valid.includes(l) ? l : process.env.NODE_ENV === "development" ? "debug" : "info";
    })(),
});

//-----------------------------------------------------------------------------
import { startService, startOpsService } from "./service";

setBaseURL(config.apiURL);
setApiKey(config.apiKey);

//-----------------------------------------------------------------------------
startOpsService()
    .then((opsSvc): Promise<void> => {
        return new Promise((resolve) => {
            opsSvc
                .listen(config.opsPort, () => {
                    logger.info(
                        { opsPort: config.opsPort, hostname: process.env.HOSTNAME },
                        "Listening ops on %s",
                        config.environment === "local"
                            ? "http://localhost:".concat(config.opsPort.toString())
                            : config.opsPort,
                    );

                    resolve();
                })
                .on("error", (err: Error) => {
                    logger.fatal("Error on listening ops server: %s", err);
                    process.exit(1);
                });
        });
    })
    .then(() => startService())
    .then((svc) => {
        // Start listening to requests.
        const server = svc
            .listen(config.port, () => {
                logger.info(
                    { port: config.port, hostname: process.env.HOSTNAME },
                    "Listening on %s",
                    config.environment === "local" ? "http://localhost:".concat(config.port.toString()) : config.port,
                );
            })
            .on("error", (err: Error) => {
                logger.fatal("Error on listening: %s", err);
                process.exit(1);
            });
    });
