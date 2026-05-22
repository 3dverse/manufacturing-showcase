import { useCallback } from "react";
import { FaFilePdf } from "react-icons/fa";

import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { generateIncidentReport, type IncidentReportData } from "@/utils/generateIncidentReport";

//------------------------------------------------------------------------------
type Props = {
    reportData: IncidentReportData;
};

//------------------------------------------------------------------------------
export function IncidentPdfDownload({ reportData }: Props) {
    const handleDownloadPdf = useCallback(() => {
        generateIncidentReport(reportData);
    }, [reportData]);

    return (
        <Button
            size="xs"
            variant="soft"
            colorScheme="neutral"
            className="mt-2 w-full sm:w-auto self-start"
            onClick={handleDownloadPdf}
        >
            <Icon icon={FaFilePdf} className="mr-2 text-xs" />
            Download incident report
        </Button>
    );
}
