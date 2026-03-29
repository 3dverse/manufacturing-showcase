# Item & Material Flow Model

## Item Types

| Type | Code prefix | Description |
|---|---|---|
| `finished_good` | `FG-` | End product manufactured for a customer sales order |
| `raw_material` | `RM-` | Discrete component or material consumed during production |
| `wip` | `WIP-` | Intermediate sub-assembly produced between operations, auto-derived from routing |

**Excluded:** Bulk consumables (paint, primer, lubricant, coolant) are not tracked as inventory items. They are expensed directly and do not appear as BOM components or WMS stock positions.

---

## Bill of Materials

BOMs are **flat** — raw materials feed directly into the first applicable operation. There are no pre-defined multi-level BOMs. The intermediate WIP items are **auto-generated** by walking the routing sequence (see Operation Types below).

Raw material assignment heuristic:
- **Processable bulk materials** (steel bar, aluminum block, etc.) → assigned to the first `transformation` operation
- **Discrete components** (seal kits, fasteners, PCBs, etc.) → assigned to the `assembly` operation

---

## Operation Types

Operation type is derived from `workCenterOperationType` on each routing step.

### Transformation — `MACHINING`, `PAINTING`, `WELDING`, ...
- **Inputs:** 1 item (raw material or WIP from previous operation)
- **Outputs:** 1 new WIP item (auto-generated, e.g. `WIP-{FG_ID}-{sequence}`)
- Bulk consumables used in the process (paint, coolant, etc.) are **ignored** — not modeled as inventory inputs

### Assembly — `ASSEMBLY`
- **Inputs:** exactly 2 items — the output of the previous step (or the first RM if nothing precedes) + one new discrete raw material component
- **Outputs:** 1 item (WIP, or the finished good if this is the last non-QC operation)
- Each assembly step in sequence introduces **one** new raw material onto the growing WIP

### Quality Control — `QUALITY_CONTROL`
- **Inputs:** 1 item (WIP or FG from previous operation)
- **Outputs:** same 1 item, unchanged — QC is a passthrough, no material transformation occurs

---

## WIP Derivation Algorithm

For each finished good, walk its routing steps in sequence:

```
for each operation in routing (ordered by sequence):
  if TRANSFORMATION:
    input  = output of previous op  (or assigned raw material if first op)
    output = new WIP-{FG_ID}-{sequence}

  if ASSEMBLY:
    primary = output of previous op  (or first RM in pool if no prior step)
    inputs  = [primary, next RM from pool]   ← exactly 2 inputs per step
    output  = new WIP-{FG_ID}-{sequence}  (or FG if last assembly before QC)

  if QUALITY_CONTROL:
    input  = output of previous op
    output = same item (passthrough)
```

The final non-QC operation's output is the finished good item itself.

---

## Example A — FG-100045 Hydraulic Pump Assembly (1 machining + 2 assembly steps)

| Seq | Operation | Type | Inputs | Output |
|---|---|---|---|---|
| 10 | MCH-10 CNC Machining    | Transformation | RM-STEEL-BAR                        | WIP-100045-10 (Machined Body)   |
| 20 | ASM-20 Seal Assembly    | Assembly       | WIP-100045-10 + RM-SEAL-KIT         | WIP-100045-20 (Sealed Body)     |
| 30 | ASM-30 Fastener Fit     | Assembly       | WIP-100045-20 + RM-FASTENERS        | FG-100045                       |
| 40 | QC-40 Quality Inspection| QC             | FG-100045                           | FG-100045 (passthrough)         |

## Example B — FG-200010 Electronic Module (pure assembly, no prior transformation)

| Seq | Operation | Type | Inputs | Output |
|---|---|---|---|---|
| 10 | ASM-10 Board Assembly   | Assembly       | RM-PCB-BLANK + RM-FASTENERS         | FG-200010                       |
| 20 | QC-20 Quality Inspection| QC             | FG-200010                           | FG-200010 (passthrough)         |

The first assembly step takes **2 inputs** because no WIP precedes it.
Subsequent assembly steps each add exactly **1 new RM** onto the incoming WIP.
