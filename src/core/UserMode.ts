const STORAGE_KEY_DEV = "useDevMode";
const STORAGE_KEY_PRESENTATION = "usePresentationMode";

//------------------------------------------------------------------------------
const defaultDevEnabled = localStorage.getItem(STORAGE_KEY_DEV) === "true";
const defaultPresentationEnabled = localStorage.getItem(STORAGE_KEY_PRESENTATION) === "true";

if (defaultDevEnabled)
    console.log(`
//------------------------------------------------------------------------------
// Dev mode is enabled! to disable, press Ctrl + Shift + \\
//------------------------------------------------------------------------------
`);
if (defaultPresentationEnabled)
    console.log(`
//------------------------------------------------------------------------------
// Pro mode is enabled! to disable, press Ctrl + Shift + Enter
//------------------------------------------------------------------------------
`);

export class UserMode {
    private static initialized: boolean = false;

    //--------------------------------------------------------------------------
    // Dev Mode
    static dev: boolean = defaultDevEnabled;
    static enableDevMode() {
        this.dev = true;
        localStorage.setItem(STORAGE_KEY_DEV, "true");
        console.log("Dev mode enabled");
        location.reload();
    }
    static disableDevMode() {
        this.dev = false;
        localStorage.removeItem(STORAGE_KEY_DEV);
        console.log("Dev mode disabled");
        location.reload();
    }
    static toggleDevMode() {
        return this.dev ? this.disableDevMode() : this.enableDevMode();
    }

    //--------------------------------------------------------------------------
    // Pro Mode
    static presentation: boolean = defaultPresentationEnabled || defaultDevEnabled;
    static enablePresentationMode() {
        this.presentation = true;
        localStorage.setItem(STORAGE_KEY_PRESENTATION, "true");
        console.log("presentation mode enabled");
        location.reload();
    }
    static disablePresentationMode() {
        this.presentation = false;
        localStorage.removeItem(STORAGE_KEY_PRESENTATION);
        console.log("presentation mode disabled");
        location.reload();
    }
    static togglePresentationMode() {
        return this.presentation ? this.disablePresentationMode() : this.enablePresentationMode();
    }

    //--------------------------------------------------------------------------
    static disableAllModes() {
        this.dev = false;
        this.presentation = false;
        localStorage.removeItem(STORAGE_KEY_DEV);
        localStorage.removeItem(STORAGE_KEY_PRESENTATION);
        location.reload();
    }

    //--------------------------------------------------------------------------
    static init() {
        if (this.initialized) return;
        document.addEventListener("keydown", function (e) {
            if (!e.ctrlKey || !e.shiftKey) return;
            if (e.key === "\\") {
                const key = STORAGE_KEY_DEV;
                if (localStorage.getItem(key) === "true") localStorage.removeItem(key);
                else localStorage.setItem(key, "true");
                location.reload();
            } else if (e.key === "Enter") {
                const key = STORAGE_KEY_PRESENTATION;
                if (localStorage.getItem(key) === "true") localStorage.removeItem(key);
                else localStorage.setItem(key, "true");
                location.reload();
            }
        });
        this.initialized = true;
    }
}
