import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import express from "express";
import type { ViteDevServer } from "vite";
import { createServer as createViteServer } from "vite";

import { isStaticBuild } from "./config";

export const router = Router();

let vite: ViteDevServer | undefined;

//------------------------------------------------------------------------------
export async function initialize() {
    if (isStaticBuild) {
        // Production / static build: serve prebuilt assets
        const distDir = path.resolve(process.cwd(), "dist");

        router.use(express.static(distDir));

        // SPA fallback (serve index.html for non-asset routes)
        router.get("*", async (_req, res, next) => {
            try {
                const html = await fs.readFile(path.join(distDir, "index.html"), "utf-8");
                res.status(200).type("html").send(html);
            } catch (e) {
                next(e);
            }
        });

        return;
    }

    // Dev: Vite middleware (HMR etc.)
    vite = await createViteServer({
        root: path.resolve(process.cwd()),
        server: {
            middlewareMode: true,
        },
    });

    router.use(vite.middlewares);
}
