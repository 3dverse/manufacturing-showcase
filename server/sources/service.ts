//------------------------------------------------------------------------------
import express, { Express, Router } from "express";
import compression from "compression";
import * as bodyParser from "body-parser";
import path from "path";
import { readFileSync } from "fs";
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
        (_req, res, next) => {
            res.setHeader("Cache-Control", "no-store");
            next();
        },
        apiRequestHandler,
        // TODO:express5
        //, defaultErrorHandler
    );

    //--------------------------------------------------------------------------
    // Expose the documentation
    const urls = apiConfigs.reduce((acc: { name: string; url: string }[], conf) => {
        conf.docs && acc.push({ name: conf.name, url: `/-/specs/${conf.name}.yaml` });
        return acc;
    }, []);

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
        const distDir = path.join(process.cwd(), "out");

        // Don't serve index.html with sendFile/static: their ETag is size + mtime,
        // `npm pack` resets every mtime to 1985 and index.html keeps the same size
        // across builds, so browsers got a 304 on an outdated index.html pointing
        // to old bundles (and Express 5 ignores sendFile's `etag: false`).
        // res.send() computes the ETag from the content instead.
        const indexHtml = readFileSync(path.join(distDir, "index.html"), "utf-8");
        const sendIndex = (_req: express.Request, res: express.Response) => {
            res.setHeader("Cache-Control", "no-cache");
            res.type("html").send(indexHtml);
        };
        app.get(["/index.html", "/static/index.html"], sendIndex);

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

        app.use((req, res, next) => {
            if (req.method !== "GET") return next();
            sendIndex(req, res);
        });
    } else {
        const frontend = await import("./frontend");
        app.use("/static", express.static(path.join(process.cwd(), "public"), { maxAge: "1y" }));
        app.use("/", frontend.router);
    }

    setReadyState(true);

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
    opsService.use(express.json());

    // Health endpoints for Kubernetes probes
    opsService.get("/health/liveness", (req, res) => {
        if (app.isHealthy) {
            res.status(204).end();
        } else {
            res.status(503).end();
        }
    });

    opsService.get("/health/readiness", (req, res) => {
        if (app.isReady) {
            res.status(204).end();
        } else {
            res.status(503).end();
        }
    });

    return opsService;
}
