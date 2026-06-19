import type { Logger } from "pino";

//------------------------------------------------------------------------------
export function installFatalErrorHandler(logger: Logger) {
    process.on("unhandledRejection", (error) => {
        let stacktrace: string[] | null = null;
        if (error instanceof Error) {
            stacktrace = captureStackTrace(error);
        }
        logger.error({ error, stacktrace }, "Unhandled rejection");
    });

    process.on("uncaughtException", (error) => {
        const stacktrace = captureStackTrace(error);
        logger.fatal({ error, stacktrace }, "Uncaught exception");
        process.exit(1);
    });
}

//------------------------------------------------------------------------------
function captureStackTrace(capturedError: Error): string[] {
    if (!capturedError.stack) {
        Error.captureStackTrace(capturedError);
    }

    return capturedError.stack ? capturedError.stack.split("\n    at ").slice(1) : [];
}
