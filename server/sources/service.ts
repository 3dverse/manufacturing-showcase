//------------------------------------------------------------------------------
import express, { Express, Router } from "express";
import compression from "compression";
import * as bodyParser from "body-parser";
//import { attachLogger, defaultErrorHandler, installHealthProbes } from "@3dverse/service-express-middlewares";
import path from "path";
import swaggerUi from "swagger-ui-express";

//------------------------------------------------------------------------------
import { isStaticBuild, useSecureCookie } from "./config";
import { setupService, tearDownService } from "./setup";
import { apiConfigs, apiRequestHandler } from "./apis";

//------------------------------------------------------------------------------
export interface Service extends Express {
    close: () => Promise<void>;
    isReady: boolean;
    isHealthy: boolean;
    auth: Router;
}

//------------------------------------------------------------------------------
const app = express() as Service;
app.isReady = false;
app.isHealthy = true;
app.close = tearDownService;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export async function startService(): Promise<Service> {
    //--------------------------------------------------------------------------
    await setupService();

    //--------------------------------------------------------------------------
    app.use(compression());
    app.use(express.json());

    app.use(
        "/-/api",
        // TODO:express5
        //attachLogger,
        apiRequestHandler,
        // TODO:express5
        //, defaultErrorHandler
    );

    // Health check
    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "OK",
            uptime: process.uptime(),
            timestamp: Date.now(),
        });
    });

    //--------------------------------------------------------------------------
    // Expose the documentation
    const urls = apiConfigs.map(({ name }) => ({ name, url: `/-/specs/${name}.yaml` }));
    const options = {
        explorer: true,
        swaggerOptions: { urls, "urls.primaryName": "ERP", queryConfigEnabled: false },
        customSiteTitle: "Manufacturing Showcase API Docs",
    };
    app.use("/-/specs", express.static(path.resolve("./server/spec")));
    app.use(`/-/doc`, swaggerUi.serveFiles(undefined, options), swaggerUi.setup(undefined, options));

    //--------------------------------------------------------------------------
    // Expose the front end routes.
    if (isStaticBuild) {
        const distDir = path.join(process.cwd(), "dist");
        app.use(
            express.static(distDir, {
                maxAge: "1y",
                immutable: true,
                index: false,
            }),
        );
        app.use(
            "/static",
            express.static(distDir, {
                maxAge: "1y",
                immutable: true,
                index: false,
            }),
        );

        app.get("*", (req, res, next) => {
            if (req.method !== "GET") return next();

            res.setHeader("Cache-Control", "no-cache");
            res.sendFile(path.join(distDir, "index.html"));
        });
    } else {
        const frontend = await import("./frontend");
        app.use("/static", express.static(path.join(process.cwd(), "public"), { maxAge: "1y" }));
        app.use("/", frontend.router);
    }

    setReadyState(true);

    //--------------------------------------------------------------------------
    // TODO: Needed?
    //--------------------------------------------------------------------------
    //--------------------------------------------------------------------------
    if (useSecureCookie) {
        app.set("trust proxy", 1);
    }

    return app;
}

//------------------------------------------------------------------------------
export function setReadyState(state: boolean) {
    app.isReady = state;
}

//------------------------------------------------------------------------------
export function setHealthyState(state: boolean) {
    app.isHealthy = state;
}

//------------------------------------------------------------------------------
export async function startOpsService(): Promise<Express> {
    const opsService = express();
    // TODO:express5
    // opsService.use(
    //     installHealthProbes(
    //         () => Promise.resolve(app.isReady),
    //         () => app.isHealthy,
    //     ),
    // );

    return opsService;
}
