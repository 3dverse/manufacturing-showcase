import { getNonconformances } from "./getNonconformances";
import { getNonconformanceById } from "./getNonconformanceById";
import { getCapas } from "./getCapas";
import { getCapaById } from "./getCapaById";
import { getDeviations } from "./getDeviations";
import { getDeviationById } from "./getDeviationById";
import { getAudits } from "./getAudits";
import { getAuditById } from "./getAuditById";
import { getComplaints } from "./getComplaints";
import { getComplaintById } from "./getComplaintById";
import { getDocuments } from "./getDocuments";
import { getDocumentById } from "./getDocumentById";
import { getQualityMetrics } from "./getQualityMetrics";

export const qmsOperations = {
    getNonconformances,
    getNonconformanceById,
    getCapas,
    getCapaById,
    getDeviations,
    getDeviationById,
    getAudits,
    getAuditById,
    getComplaints,
    getComplaintById,
    getDocuments,
    getDocumentById,
    getQualityMetrics,
};
