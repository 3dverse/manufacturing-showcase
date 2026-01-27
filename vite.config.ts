import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig((env: ConfigEnv) => ({
    plugins: [tailwindcss(), react()],
    base: env.command === "build" ? "/" : "/",
    server: {
        host: "0.0.0.0",
        port: 5173,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
