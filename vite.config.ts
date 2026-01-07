import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig((env: ConfigEnv) => ({
    plugins: [tailwindcss(), react()],
    base: env.command === "build" ? "/" : "/",
}));
