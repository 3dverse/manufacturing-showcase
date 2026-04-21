//------------------------------------------------------------------------------
import { jsPDF } from "jspdf";

//------------------------------------------------------------------------------
import type { ProjectedDowntime } from "@/core/Projection";
import type { ProjectedProductionOrder, ProjectedOperation } from "@/core/Projection";
import { fmtTs, fmtDuration } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
export type IncidentReportData = {
    downtime: ProjectedDowntime;
    machineName: string;
    workCenterId: string;
    productionOrder?: Pick<ProjectedProductionOrder, "orderNumber" | "itemCode" | "phase"> | null;
    operation?: Pick<ProjectedOperation, "operationCode" | "operationDescription" | "quantities"> | null;
};

//------------------------------------------------------------------------------
const BRAND = "#1e3a5f";
const ACCENT = "#f59e0b"; // warning-500
const GRAY_DARK = "#1e293b";
const GRAY_MID = "#475569";
const GRAY_LIGHT = "#94a3b8";
const DIVIDER = "#e2e8f0";
const RED = "#dc2626";
const BG_LIGHT = "#f8fafc";

//------------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function setFill(doc: jsPDF, hex: string) {
    doc.setFillColor(...hexToRgb(hex));
}

function setTextColor(doc: jsPDF, hex: string) {
    doc.setTextColor(...hexToRgb(hex));
}

function setDrawColor(doc: jsPDF, hex: string) {
    doc.setDrawColor(...hexToRgb(hex));
}

//------------------------------------------------------------------------------
export function generateIncidentReport(data: IncidentReportData): void {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;

    let y = 0;

    // ── Header band ──────────────────────────────────────────────────────────
    setFill(doc, BRAND);
    doc.rect(0, 0, pageW, 32, "F");

    // Amber left accent stripe
    setFill(doc, ACCENT);
    doc.rect(0, 0, 5, 32, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    setTextColor(doc, "#ffffff");
    doc.text("MAINTENANCE INCIDENT REPORT", margin + 4, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, "#93c5fd");
    doc.text("3Dverse Manufacturing Platform", margin + 4, 20);

    // Report ID + date top-right
    const reportId = `RPT-${data.downtime.id.toUpperCase().slice(-8)}`;
    const generatedAt = new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    doc.setFontSize(8);
    setTextColor(doc, "#bfdbfe");
    doc.text(`Report ID: ${reportId}`, pageW - margin, 13, { align: "right" });
    doc.text(`Generated: ${generatedAt}`, pageW - margin, 19, { align: "right" });

    y = 40;

    // ── Status badge ─────────────────────────────────────────────────────────
    const isOngoing = data.downtime.isOngoing;
    const badgeText = isOngoing ? "ONGOING" : "RESOLVED";
    const badgeColor = isOngoing ? RED : "#16a34a";
    const badgeBg = isOngoing ? "#fef2f2" : "#f0fdf4";
    const badgeBorder = isOngoing ? "#fca5a5" : "#86efac";

    setFill(doc, badgeBg);
    setDrawColor(doc, badgeBorder);
    doc.roundedRect(margin, y - 5, 38, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(doc, badgeColor);
    doc.text(badgeText, margin + 19, y, { align: "center" });

    y += 8;

    // ── Section helper ───────────────────────────────────────────────────────
    function sectionHeader(title: string) {
        y += 4;
        setFill(doc, BG_LIGHT);
        doc.rect(margin, y, contentW, 7, "F");
        setFill(doc, ACCENT);
        doc.rect(margin, y, 3, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        setTextColor(doc, BRAND);
        doc.text(title.toUpperCase(), margin + 6, y + 4.8);
        y += 11;
    }

    function row(label: string, value: string, opts?: { highlight?: boolean }) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(doc, GRAY_MID);
        doc.text(label, margin + 2, y);
        doc.setFont("helvetica", opts?.highlight ? "bold" : "normal");
        setTextColor(doc, opts?.highlight ? GRAY_DARK : GRAY_DARK);
        doc.text(value || "—", margin + 52, y);
        setDrawColor(doc, DIVIDER);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 1.5, margin + contentW, y + 1.5);
        y += 7;
    }

    // ── Equipment information ─────────────────────────────────────────────────
    sectionHeader("Equipment Information");
    row("Machine", data.machineName, { highlight: true });
    row("Work Center ID", data.workCenterId);

    // ── Incident details ──────────────────────────────────────────────────────
    sectionHeader("Incident Details");
    row("Fault Code", data.downtime.reasonCode, { highlight: true });
    row("Description", data.downtime.reasonDescription || "—");
    row(
        "Started At",
        fmtTs(data.downtime.startedAt, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
    );
    if (!isOngoing && data.downtime.endedAt) {
        row(
            "Resolved At",
            fmtTs(data.downtime.endedAt, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        );
    }
    row("Duration", fmtDuration(data.downtime.durationAtAsOf));
    row("Status", isOngoing ? "Ongoing — machine halted" : "Resolved");

    // ── Production impact ─────────────────────────────────────────────────────
    sectionHeader("Production Impact");
    if (data.productionOrder) {
        row("Production Order", data.productionOrder.orderNumber, { highlight: true });
        row("Item Code", data.productionOrder.itemCode);
    } else {
        row("Production Order", "No active order at time of incident");
    }

    if (data.operation) {
        row("Operation", `${data.operation.operationCode} — ${data.operation.operationDescription ?? ""}`.trim());
        const { goodQuantity, scrapQuantity, plannedQuantity, uom } = data.operation.quantities;
        row("Qty Produced / Planned", `${goodQuantity} / ${plannedQuantity} ${uom}`);
        if (scrapQuantity > 0) row("Scrap Quantity", `${scrapQuantity} ${uom}`);
    }

    // ── Possible causes ───────────────────────────────────────────────────────
    sectionHeader("Possible Causes");

    const causes = [
        "Motor imbalance due to uneven load distribution",
        "Defective bearing — wear detected on inner race",
        "Loose fastening — vibration loosened mounting bolts",
    ];

    causes.forEach((cause, i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(doc, GRAY_MID);
        doc.text(`${i + 1}.`, margin + 2, y);
        setTextColor(doc, GRAY_DARK);
        const lines = doc.splitTextToSize(cause, contentW - 14);
        doc.text(lines, margin + 9, y);
        y += lines.length * 5.5 + 1;
    });

    y += 2;

    // ── Recommended Actions ───────────────────────────────────────────────────
    sectionHeader("Recommended Actions");

    const actions = [
        { priority: "HIGH", text: "Alert floor supervisor and halt machine operation immediately" },
        { priority: "HIGH", text: "Inspect bearing condition and replace if wear exceeds tolerance limits" },
        { priority: "MED", text: "Check and re-torque all motor mounting bolts to manufacturer specifications" },
        { priority: "MED", text: "Conduct vibration analysis after repairs to validate baseline" },
        { priority: "LOW", text: "Schedule preventive maintenance review within 30 days" },
    ];

    actions.forEach((action) => {
        const priorityColor = action.priority === "HIGH" ? RED : action.priority === "MED" ? "#b45309" : GRAY_MID;
        const priorityBg = action.priority === "HIGH" ? "#fef2f2" : action.priority === "MED" ? "#fffbeb" : BG_LIGHT;

        // Priority badge
        setFill(doc, priorityBg);
        doc.roundedRect(margin + 2, y - 3.5, 12, 5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        setTextColor(doc, priorityColor);
        doc.text(action.priority, margin + 8, y, { align: "center" });

        // Action text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(doc, GRAY_DARK);
        const lines = doc.splitTextToSize(action.text, contentW - 20);
        doc.text(lines, margin + 17, y);
        y += lines.length * 5.5 + 2;
    });

    y += 4;

    // ── Sign-off section ──────────────────────────────────────────────────────
    // Guard against overflow to new page
    if (y > pageH - 55) {
        doc.addPage();
        y = margin;
    }

    sectionHeader("Authorization & Sign-off");

    const signOffY = y;
    const colW = contentW / 3;

    const signatories = ["Reported by", "Reviewed by", "Approved by"];
    signatories.forEach((label, i) => {
        const x = margin + i * colW;
        setDrawColor(doc, GRAY_LIGHT);
        doc.setLineWidth(0.3);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setTextColor(doc, GRAY_MID);
        doc.text(label, x + colW / 2, signOffY, { align: "center" });

        // Signature line
        doc.line(x + 4, signOffY + 12, x + colW - 4, signOffY + 12);
        setTextColor(doc, GRAY_LIGHT);
        doc.setFontSize(7.5);
        doc.text("Signature", x + colW / 2, signOffY + 16, { align: "center" });

        // Date line
        doc.line(x + 4, signOffY + 23, x + colW - 4, signOffY + 23);
        doc.text("Date", x + colW / 2, signOffY + 27, { align: "center" });
    });

    y = signOffY + 34;

    // ── Footer ────────────────────────────────────────────────────────────────
    setFill(doc, BRAND);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    setFill(doc, ACCENT);
    doc.rect(0, pageH - 12, 5, 12, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTextColor(doc, "#93c5fd");
    doc.text("CONFIDENTIAL — For internal use only", margin + 4, pageH - 5.5);
    setTextColor(doc, "#475569");
    doc.text(`${reportId} · Page 1`, pageW - margin, pageH - 5.5, { align: "right" });

    // ── Download ──────────────────────────────────────────────────────────────
    doc.save(`incident_report_${data.downtime.id.slice(-8)}.pdf`);
}
