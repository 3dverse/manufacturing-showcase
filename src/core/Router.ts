//------------------------------------------------------------------------------
export type Route = {
    factorySlug?: string;
    nodeSlug?: string;
    itemSlug?: string;
    pathname: string;
    url: string;
};

//------------------------------------------------------------------------------
export type RouteChangeEvent = {
    route: Route;
    source: "init" | "push" | "pop" | "replace";
};

//------------------------------------------------------------------------------
export class Router {
    private static basePath = "";
    private static listeners = new Set<(event: RouteChangeEvent) => void>();
    private static isStarted = false;
    static activeFactorySlug: string | undefined = undefined;

    //--------------------------------------------------------------------------
    static configure(options?: { basePath?: string }) {
        this.basePath = this.normalizeBasePath(options?.basePath ?? "");
    }

    //--------------------------------------------------------------------------
    private static normalizeBasePath(path: string): string {
        if (!path || path === "/") return "";
        return path.startsWith("/") ? path.replace(/\/+$/, "") : `/${path.replace(/\/+$/, "")}`;
    }

    //--------------------------------------------------------------------------
    private static stripBasePath(pathname: string): string {
        if (!this.basePath) return pathname;
        if (pathname === this.basePath) return "/";
        if (pathname.startsWith(this.basePath + "/")) {
            return pathname.slice(this.basePath.length) || "/";
        }
        return pathname;
    }

    //--------------------------------------------------------------------------
    private static addBasePath(pathname: string): string {
        if (!this.basePath) return pathname;
        return pathname === "/" ? this.basePath : `${this.basePath}${pathname}`;
    }

    //--------------------------------------------------------------------------
    private static parsePath(pathname: string): Route {
        const localPath = this.stripBasePath(pathname);
        const clean = localPath.replace(/^\/+|\/+$/g, "");
        const [factorySlugRaw, nodeSlugRaw, itemSlugRaw] = clean ? clean.split("/") : [];

        return {
            factorySlug: factorySlugRaw ? decodeURIComponent(factorySlugRaw) : undefined,
            nodeSlug: nodeSlugRaw ? decodeURIComponent(nodeSlugRaw) : undefined,
            itemSlug: itemSlugRaw ? decodeURIComponent(itemSlugRaw) : undefined,
            pathname: pathname || "/",
            url: window.location.href,
        };
    }

    //--------------------------------------------------------------------------
    private static buildPath(factorySlug?: string, nodeSlug?: string, itemSlug?: string): string {
        if (!factorySlug) {
            return this.addBasePath("/");
        }

        const parts = [encodeURIComponent(factorySlug)];
        if (nodeSlug) parts.push(encodeURIComponent(nodeSlug));
        if (nodeSlug && itemSlug) parts.push(encodeURIComponent(itemSlug));

        return this.addBasePath(`/${parts.join("/")}`);
    }

    //--------------------------------------------------------------------------
    private static emit(source: RouteChangeEvent["source"]) {
        const event: RouteChangeEvent = {
            route: this.currentRoute(),
            source,
        };

        for (const listener of this.listeners) {
            listener(event);
        }
    }

    //--------------------------------------------------------------------------
    private static handlePopState = () => {
        this.emit("pop");
    };

    //--------------------------------------------------------------------------
    static start() {
        if (this.isStarted) return;
        window.addEventListener("popstate", this.handlePopState);
        this.isStarted = true;
    }

    //--------------------------------------------------------------------------
    static stop() {
        if (!this.isStarted) return;
        window.removeEventListener("popstate", this.handlePopState);
        this.isStarted = false;
    }

    //--------------------------------------------------------------------------
    static init(): Route {
        this.start();

        const route = this.currentRoute();
        Router.activeFactorySlug = route.factorySlug;
        history.replaceState(
            {
                ...(history.state ?? {}),
                __customRouter: true,
                pathname: route.pathname,
                factorySlug: route.factorySlug,
                nodeSlug: route.nodeSlug,
                itemSlug: route.itemSlug,
            },
            "",
            window.location.pathname + window.location.search + window.location.hash,
        );

        this.emit("init");
        return route;
    }

    //--------------------------------------------------------------------------
    static currentRoute(): Route {
        return this.parsePath(window.location.pathname);
    }

    //--------------------------------------------------------------------------
    static onChange(listener: (event: RouteChangeEvent) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    //--------------------------------------------------------------------------
    static push(data: { factorySlug?: string; nodeSlug?: string }, state: unknown = {}) {
        Router.activeFactorySlug = data.factorySlug;
        const pathname = this.buildPath(data.factorySlug, data.nodeSlug);

        history.pushState(
            {
                ...(typeof state === "object" && state !== undefined ? state : {}),
                __customRouter: true,
                pathname,
                ...data,
            },
            "",
            pathname,
        );

        this.emit("push");
    }

    //--------------------------------------------------------------------------
    static replace(data: { factorySlug: string; nodeSlug?: string; itemSlug?: string }, state: unknown = {}) {
        Router.activeFactorySlug = data.factorySlug;
        const pathname = this.buildPath(data.factorySlug, data.nodeSlug, data.itemSlug);

        history.replaceState(
            {
                ...(typeof state === "object" && state !== undefined ? state : {}),
                __customRouter: true,
                pathname,
                ...data,
            },
            "",
            pathname,
        );

        this.emit("replace");
    }

    //--------------------------------------------------------------------------
    static uuidToSlug(uuid: string) {
        return uuid.slice(0, 8);
    }
}
