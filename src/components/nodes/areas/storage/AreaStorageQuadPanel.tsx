//------------------------------------------------------------------------------
import { AreaStorageKpiCharts } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";
import { MOCK_KPI_DATA } from "@/components/nodes/areas/storage/content";

//------------------------------------------------------------------------------
export function AreaStorageQuadPanel() {
    //--------------------------------------------------------------------------
    return <AreaStorageKpiCharts data={MOCK_KPI_DATA} />;
}
