//------------------------------------------------------------------------------
import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

//------------------------------------------------------------------------------
import { METADATA } from "./src/content/metadata";

//------------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));

//------------------------------------------------------------------------------
// Inject metadata into index.html at build time (og:* and twitter:* need static values for crawlers)
function injectMetadata() {
    const og_image_url = METADATA.og_image.startsWith("http")
        ? METADATA.og_image
        : `${METADATA.url}${METADATA.og_image}`;
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: METADATA.app_name,
        description: `${METADATA.seo_title} - ${METADATA.seo_description}`,
        url: METADATA.url,
        logo: METADATA.logo.startsWith("http") ? METADATA.logo : `${METADATA.url}${METADATA.logo}`,
        sameAs: [
            METADATA.twitter_url,
            METADATA.linkedin_url,
            METADATA.youtube_url,
            METADATA.instagram_url,
            METADATA.facebook_url,
            METADATA.medium_url,
        ].filter(Boolean),
    };

    const vars: Record<string, string> = {
        url: METADATA.url,
        seo_title: METADATA.seo_title,
        seo_description: METADATA.seo_description,
        og_image: og_image_url,
        app_name: METADATA.app_name,
        structured_data: `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`,
    };
    return {
        name: "inject-metadata",
        transformIndexHtml(html: string) {
            let out = html;
            // Inject structured data (script tag with JSON-LD)
            out = out.replace(/\{\{structured_data\}\}/g, vars.structured_data);
            // Replace remaining {{key}} placeholders
            out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
            return out;
        },
    };
}

//------------------------------------------------------------------------------
// https://vite.dev/config/
export default defineConfig((env: ConfigEnv) => ({
    plugins: [injectMetadata(), tailwindcss(), react()],
    base: env.command === "build" ? "/" : "/",
    build: {
        outDir: "out",
    },
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
