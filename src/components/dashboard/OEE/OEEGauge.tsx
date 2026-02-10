//------------------------------------------------------------------------------
import { GaugeComponent } from "react-gauge-component";

//------------------------------------------------------------------------------
interface OEEGaugeProps {
    value?: number;
    size?: number;
}

//------------------------------------------------------------------------------
export const OEEGauge: React.FC<OEEGaugeProps> = ({ value }) => {
    return (
        <GaugeComponent
            value={value}
            type="semicircle"
            arc={{
                width: 0.12,
                subArcs: [
                    { limit: 30, color: "var(--color-negative-600)", showTick: false },
                    { limit: 60, color: "var(--color-warning-600)", showTick: false },
                    { limit: 100, color: "var(--color-positive-600)", showTick: false },
                ],
                subArcsStrokeWidth: 0,
                effects: { innerShadow: false, glow: false },
            }}
            pointer={{
                type: "arrow",
                color: "var(--color-neutral)",
                width: 10,
                maxFps: 30,
                baseColor: "#ffffff",
                length: 0.7,
                strokeWidth: 0,
                arrowOffset: 0.75,
            }}
            labels={{
                valueLabel: {
                    formatTextValue: (e) => "".concat(e, "%"),
                    matchColorWithArc: true,
                    style: {
                        translate: "4px 6px",
                        fontSize: "58px",
                        fontWeight: "bold",
                        letterSpacing: "-0.05em",
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "none",
                    },
                },
                tickLabels: {
                    type: "outer",
                    defaultTickValueConfig: { style: { fontSize: "12px", fill: "#aaa" } },
                    hideMinMax: true,
                },
            }}
            startAngle={-90}
            endAngle={90}
        />
    );
};

//------------------------------------------------------------------------------
export default OEEGauge;
