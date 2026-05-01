import { Field } from "@/components/correlation/SectionWrapper";

//------------------------------------------------------------------------------
type Props = {
    machineName: string;
    workCenterId: string;
};

//------------------------------------------------------------------------------
export function ScadaEquipmentSection({ machineName, workCenterId }: Props) {
    return (
        <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Equipment</h3>
            <div className="space-y-1">
                <Field label="Machine" value={machineName} />
                <Field label="Work center ID" value={workCenterId} />
            </div>
        </section>
    );
}
