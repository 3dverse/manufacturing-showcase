import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
type ColorScheme = "brand" | "accent" | "neutral" | "informative" | "negative" | "warning" | "positive" | "guidance";

const colorSchemes: ColorScheme[] = ["brand", "accent", "neutral", "informative", "negative", "warning", "positive", "guidance"];

//------------------------------------------------------------------------------
const ColorSwatch = ({ colorName, theme }: { colorName: string; theme: "light" | "dark" }) => {
    const colorVar = `--color-${colorName}`;
    return (
        <div
            className={cn("flex flex-col gap-1 p-2 rounded border border-border-subtle", "bg-foreground")}
            data-theme={theme}
        >
            <div
                className="w-full h-16 rounded border border-border-muted"
                style={{ backgroundColor: `var(${colorVar})` }}
            />
            <div className="text-xs">
                <div className="font-medium text-default">{colorName}</div>
                <div className="text-muted text-2xs font-mono">{`var(${colorVar})`}</div>
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const ColorSchemeSection = ({ scheme, theme }: { scheme: ColorScheme; theme: "light" | "dark" }) => {
    const shades = scheme === "neutral" ? ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"] : ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-default capitalize">{scheme}</h3>
            <div className="grid grid-cols-5 gap-2">
                {shades.map((shade) => (
                    <ColorSwatch key={shade} colorName={`${scheme}-${shade}`} theme={theme} />
                ))}
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const SemanticTokensSection = ({ theme }: { theme: "light" | "dark" }) => {
    const textTokens = [
        { name: "text-default", var: "--token-text-default" },
        { name: "text-subtle", var: "--token-text-subtle" },
        { name: "text-muted", var: "--token-text-muted" },
    ];

    const borderTokens = [
        { name: "border-default", var: "--token-border-default" },
        { name: "border-subtle", var: "--token-border-subtle" },
        { name: "border-muted", var: "--token-border-muted" },
    ];

    const bgTokens = [
        { name: "bg-ground", var: "--token-bg-ground" },
        { name: "bg-underground", var: "--token-bg-underground" },
        { name: "bg-foreground", var: "--token-bg-foreground" },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-default">Semantic Tokens</h2>

            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-medium text-subtle mb-2">Text Tokens</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {textTokens.map((token) => (
                            <div
                                key={token.name}
                                className={cn("flex flex-col gap-1 p-2 rounded border border-border-subtle", "bg-foreground")}
                                data-theme={theme}
                            >
                                <div
                                    className="w-full h-12 rounded border border-border-muted flex items-center justify-center bg-ground"
                                >
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: `var(${token.var})` }}
                                    >
                                        Sample Text
                                    </span>
                                </div>
                                <div className="text-xs">
                                    <div className="font-medium text-default">{token.name}</div>
                                    <div className="text-muted text-2xs font-mono">{`var(${token.var})`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-subtle mb-2">Border Tokens</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {borderTokens.map((token) => (
                            <div
                                key={token.name}
                                className={cn("flex flex-col gap-1 p-2 rounded border border-border-subtle", "bg-foreground")}
                                data-theme={theme}
                            >
                                <div
                                    className="w-full h-12 rounded border-2"
                                    style={{ borderColor: `var(${token.var})`, backgroundColor: "transparent" }}
                                />
                                <div className="text-xs">
                                    <div className="font-medium text-default">{token.name}</div>
                                    <div className="text-muted text-2xs font-mono">{`var(${token.var})`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-subtle mb-2">Background Tokens</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {bgTokens.map((token) => (
                            <div
                                key={token.name}
                                className={cn("flex flex-col gap-1 p-2 rounded border border-border-subtle", "bg-foreground")}
                                data-theme={theme}
                            >
                                <div
                                    className="w-full h-12 rounded border border-border-muted"
                                    style={{ backgroundColor: `var(${token.var})` }}
                                />
                                <div className="text-xs">
                                    <div className="font-medium text-default">{token.name}</div>
                                    <div className="text-muted text-2xs font-mono">{`var(${token.var})`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const ThemeColumn = ({ theme }: { theme: "light" | "dark" }) => {
    return (
        <div className="flex-1 space-y-6 bg-ground" data-theme={theme}>
            <div className="sticky top-0 z-10 bg-foreground border-b border-border-default pb-2">
                <h2 className="text-lg font-semibold text-default capitalize">{theme} Theme</h2>
            </div>

            <SemanticTokensSection theme={theme} />

            <div className="space-y-6">
                <h2 className="text-base font-semibold text-default">Color Schemes</h2>
                {colorSchemes.map((scheme) => (
                    <ColorSchemeSection key={scheme} scheme={scheme} theme={theme} />
                ))}
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const Theme = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="absolute inset-0 overflow-auto bg-ground">
            <div className="mx-auto p-6">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-default">Theme Showcase</h1>
                        <p className="text-sm text-subtle mt-1">Compare light and dark themes with all color schemes and semantic tokens</p>
                    </div>
                    <Button onClick={onBack} variant="ghost" size="sm">
                        Back
                    </Button>
                </div>

                <div className="flex gap-6">
                    <ThemeColumn theme="light" />
                    <div className="w-px bg-border-default" />
                    <ThemeColumn theme="dark" />
                </div>
            </div>
        </div>
    );
};

export default Theme;
