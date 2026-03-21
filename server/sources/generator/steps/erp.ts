import type { GeneratorConfig } from "../types";
import type { RNG } from "../rng";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function addMonths(d: Date, n: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const CUSTOMER_NAMES = [
    "Apex Dynamics Corp",
    "Meridian Industrial",
    "Northfield Machinery",
    "Summit Hydraulics",
    "Cascade Engineering",
    "Ironclad Systems",
    "Precision Works Ltd",
    "Allied Manufacturing",
];

const SUPPLIER_NAMES: Record<string, string> = {
    "SUP-001": "SteelSource International",
    "SUP-002": "Aluminum Alloys Direct",
    "SUP-003": "Precision Components Inc",
    "SUP-004": "Electronics Supplies Co",
};

const GL_ACCOUNTS = [
    { code: "1000", name: "Cash and Bank", accountType: "asset" },
    { code: "1200", name: "Accounts Receivable", accountType: "asset" },
    { code: "1300", name: "Raw Material Inventory", accountType: "asset" },
    { code: "1400", name: "Work In Progress", accountType: "asset" },
    { code: "1500", name: "Finished Goods Inventory", accountType: "asset" },
    { code: "1800", name: "Property Plant Equipment", accountType: "asset" },
    { code: "2000", name: "Accounts Payable", accountType: "liability" },
    { code: "2100", name: "Accrued Liabilities", accountType: "liability" },
    { code: "2500", name: "Long-Term Debt", accountType: "liability" },
    { code: "3000", name: "Common Equity", accountType: "equity" },
    { code: "4000", name: "Product Revenue", accountType: "revenue" },
    { code: "5000", name: "Cost of Goods Sold", accountType: "expense" },
    { code: "5100", name: "Direct Labor", accountType: "expense" },
    { code: "5200", name: "Manufacturing Overhead", accountType: "expense" },
    { code: "6000", name: "SGA Expenses", accountType: "expense" },
];

export function generateERP(
    config: GeneratorConfig,
    structural: { erpCostCenters: Map<string, any>; erpCostCenterList: string[] },
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, items } = config;
    const windowStart = addMonths(now, -monthsBack);
    const windowEnd = addMonths(now, monthsForward);

    // --- Company ---
    const company = {
        id: "COMP-001",
        code: "COMP-001",
        name: "Acme Manufacturing Inc.",
        baseCurrency: "USD",
        countryCode: "CA",
        status: "active",
        updatedAt: toUnix(now),
    };

    // --- Currencies ---
    const currencies = [
        { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
        { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
        { code: "CAD", name: "Canadian Dollar", symbol: "CA$", decimals: 2 },
    ];

    // --- Fiscal Periods ---
    const fiscalPeriods: any[] = [];
    const fpStart = addMonths(startOfMonth(windowStart), -1);
    let fpCursor = new Date(fpStart);
    let fpNum = 1;
    while (fpCursor <= addMonths(windowEnd, 1)) {
        const start = startOfMonth(fpCursor);
        const end = endOfMonth(fpCursor);
        const status = end < now ? "closed" : start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear() ? "open" : "planned";
        fiscalPeriods.push({
            id: `FP-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
            companyId: "COMP-001",
            fiscalYear: start.getFullYear(),
            periodNumber: fpNum++,
            startDate: toUnix(start),
            endDate: toUnix(end),
            status,
        });
        fpCursor = addMonths(fpCursor, 1);
    }

    // --- GL Accounts ---
    const glAccounts = new Map<string, any>();
    const glAccountList: any[] = [];
    for (const acc of GL_ACCOUNTS) {
        const id = `GLA-${acc.code}`;
        const obj = { id, companyId: "COMP-001", code: acc.code, name: acc.name, accountType: acc.accountType, isPostingAllowed: true, status: "active" };
        glAccounts.set(id, obj);
        glAccountList.push(obj);
    }

    // --- Cost Centers from structural ---
    const costCenters = structural.erpCostCenters;
    const costCenterList = structural.erpCostCenterList.map((id) => costCenters.get(id)!);

    // --- Customers ---
    const customers = new Map<string, any>();
    const customerList: any[] = [];
    for (let i = 0; i < 8; i++) {
        const id = `CUST-${String(i + 1).padStart(3, "0")}`;
        const name = CUSTOMER_NAMES[i];
        const status = i === 2 ? "on_hold" : "active";
        const obj = {
            id,
            companyId: "COMP-001",
            customerNumber: id,
            name,
            email: `orders@${name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`,
            phone: `+1-416-555-${String(1000 + i * 17).padStart(4, "0")}`,
            taxId: `TAX-${100000 + i * 1234}`,
            currency: "USD",
            paymentTermsCode: "NET30",
            billingAddress: {
                line1: `${100 + i * 10} Industrial Pkwy`,
                city: ["Toronto", "Detroit", "Chicago", "Cleveland", "Buffalo", "Pittsburgh", "Hamilton", "Windsor"][i],
                stateOrProvince: ["ON", "MI", "IL", "OH", "NY", "PA", "ON", "ON"][i],
                postalCode: `M${i}B ${i}C${i}`,
                countryCode: i < 5 ? "US" : "CA",
            },
            status,
            updatedAt: toUnix(now),
        };
        customers.set(id, obj);
        customerList.push(obj);
    }

    // --- Suppliers ---
    const suppliers = new Map<string, any>();
    const supplierList: any[] = [];
    for (const [id, name] of Object.entries(SUPPLIER_NAMES)) {
        const obj = {
            id,
            companyId: "COMP-001",
            supplierNumber: id,
            name,
            email: `purchasing@${name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`,
            phone: `+1-800-555-${id.split("-")[1]}000`,
            taxId: `VTAX-${id}`,
            currency: "USD",
            paymentTermsCode: "NET45",
            remitToAddress: {
                line1: "100 Supplier Ave",
                city: "Chicago",
                stateOrProvince: "IL",
                postalCode: "60601",
                countryCode: "US",
            },
            status: "active",
            updatedAt: toUnix(now),
        };
        suppliers.set(id, obj);
        supplierList.push(obj);
    }

    // --- Items ---
    const erpItems = new Map<string, any>();
    const itemList: any[] = [];
    const finishedGoods = items.filter((i) => i.itemType === "finished_good");
    const rawMaterials = items.filter((i) => i.itemType === "raw_material");

    for (const item of items) {
        const obj = {
            id: item.id,
            companyId: "COMP-001",
            itemNumber: item.itemNumber,
            name: item.name,
            description: item.description,
            itemType: item.itemType,
            productGroup: item.itemType === "finished_good" ? "FG" : "RM",
            uom: item.uom,
            standardCost: { amount: item.standardCost, currency: item.currency },
            salesUom: item.uom,
            purchaseUom: item.uom,
            status: "active",
            updatedAt: toUnix(now),
        };
        erpItems.set(item.id, obj);
        itemList.push(obj);
    }

    // --- Sales Orders ---
    const salesOrders = new Map<string, any>();
    const salesOrderList: any[] = [];

    let soNum = 1;
    let soDate = new Date(windowStart);
    while (soDate <= windowEnd) {
        const numSOs = rng.nextInt(0, 2);
        for (let s = 0; s < numSOs; s++) {
            const soId = `SO-${String(soNum).padStart(6, "0")}`;
            const orderDate = addDays(soDate, rng.nextInt(0, 6));
            if (orderDate > windowEnd) break;

            const customer = rng.pick(customerList.filter((c) => c.status === "active"));
            const deliveryDays = rng.nextInt(14, 28);
            const requestedDeliveryDate = addDays(orderDate, deliveryDays);

            const numLines = rng.nextInt(1, 3);
            const lines = [];
            let subtotal = 0;
            for (let l = 0; l < numLines; l++) {
                const item = rng.pick(finishedGoods);
                const qty = rng.nextInt(50, 500);
                const unitPrice = item.standardCost * rng.nextFloat(1.2, 1.5);
                const lineAmount = qty * unitPrice;
                subtotal += lineAmount;
                lines.push({
                    lineNumber: l + 1,
                    itemId: item.id,
                    itemNumber: item.itemNumber,
                    description: item.name,
                    orderedQuantity: qty,
                    uom: item.uom,
                    unitPrice: { amount: Math.round(unitPrice * 100) / 100, currency: "USD" },
                    lineAmount: { amount: Math.round(lineAmount * 100) / 100, currency: "USD" },
                    requestedDate: toUnix(requestedDeliveryDate),
                });
            }

            const taxAmt = subtotal * 0.05;
            const totalAmt = subtotal + taxAmt;

            // Derive status
            let status: string;
            if (requestedDeliveryDate < addDays(now, -30)) {
                status = "invoiced";
            } else if (requestedDeliveryDate < now) {
                status = rng.bool(0.7) ? "fulfilled" : "partially_fulfilled";
            } else if (orderDate < now) {
                status = rng.bool(0.8) ? "confirmed" : "partially_fulfilled";
            } else {
                status = rng.bool(0.9) ? "confirmed" : "draft";
            }

            // Status transition timestamps
            const confirmedAt = (status === "confirmed" || status === "fulfilled" || status === "invoiced" || status === "partially_fulfilled") && orderDate < now
                ? toUnix(addDays(orderDate, rng.nextInt(0, 2))) : null;
            const fulfilledAt = (status === "fulfilled" || status === "invoiced")
                ? toUnix(addDays(requestedDeliveryDate, rng.nextInt(-1, 1))) : null;

            const so = {
                id: soId,
                companyId: "COMP-001",
                orderNumber: soId,
                customerId: customer.id,
                customerName: customer.name,
                orderDate: toUnix(orderDate),
                requestedDeliveryDate: toUnix(requestedDeliveryDate),
                currency: "USD",
                subtotal: { amount: Math.round(subtotal * 100) / 100, currency: "USD" },
                taxAmount: { amount: Math.round(taxAmt * 100) / 100, currency: "USD" },
                totalAmount: { amount: Math.round(totalAmt * 100) / 100, currency: "USD" },
                status,
                confirmedAt,
                fulfilledAt,
                lines,
            };
            salesOrders.set(soId, so);
            salesOrderList.push(so);
            soNum++;
        }
        soDate = addDays(soDate, 7);
    }

    // --- Purchase Orders ---
    const purchaseOrders = new Map<string, any>();
    const purchaseOrderList: any[] = [];

    const supplierItemMap: Record<string, string[]> = {
        "SUP-001": ["RM-STEEL-BAR"],
        "SUP-002": ["RM-ALU-BLOCK", "RM-PAINT-PRIMER"],
        "SUP-003": ["RM-SEAL-KIT", "RM-FASTENERS"],
        "SUP-004": ["RM-PCB-BLANK"],
    };

    let poNum = 1;
    for (const [supplierId, rmIds] of Object.entries(supplierItemMap)) {
        const supplier = suppliers.get(supplierId)!;
        let poDate = new Date(windowStart);
        while (poDate <= windowEnd) {
            const poId = `PO-${String(poNum).padStart(6, "0")}`;
            const receiptDate = addDays(poDate, rng.nextInt(7, 21));
            const lines = [];
            let subtotal = 0;
            for (let li = 0; li < rmIds.length; li++) {
                const item = erpItems.get(rmIds[li])!;
                const qty = rng.nextInt(200, 2000);
                const unitPrice = (item.standardCost.amount as number) * rng.nextFloat(0.9, 1.05);
                const lineAmount = qty * unitPrice;
                subtotal += lineAmount;
                lines.push({
                    lineNumber: li + 1,
                    itemId: item.id,
                    itemNumber: item.itemNumber,
                    description: item.name,
                    orderedQuantity: qty,
                    uom: item.uom,
                    unitPrice: { amount: Math.round(unitPrice * 100) / 100, currency: "USD" },
                    lineAmount: { amount: Math.round(lineAmount * 100) / 100, currency: "USD" },
                    expectedReceiptDate: toUnix(receiptDate),
                });
            }
            const totalAmt = subtotal;

            let status: string;
            if (receiptDate < addDays(now, -14)) {
                status = "received";
            } else if (receiptDate < now) {
                status = "partially_received";
            } else if (poDate < now) {
                status = "approved";
            } else {
                status = "draft";
            }

            // Status transition timestamps
            const approvedAt = (status === "approved" || status === "received" || status === "partially_received") && poDate < now
                ? toUnix(addDays(poDate, rng.nextInt(0, 1))) : null;
            const receivedAt = status === "received"
                ? toUnix(addDays(receiptDate, rng.nextInt(0, 2))) : null;

            const po = {
                id: poId,
                companyId: "COMP-001",
                orderNumber: poId,
                supplierId,
                supplierName: supplier.name,
                orderDate: toUnix(poDate),
                currency: "USD",
                subtotal: { amount: Math.round(subtotal * 100) / 100, currency: "USD" },
                taxAmount: { amount: 0, currency: "USD" },
                totalAmount: { amount: Math.round(totalAmt * 100) / 100, currency: "USD" },
                status,
                approvedAt,
                receivedAt,
                lines,
            };
            purchaseOrders.set(poId, po);
            purchaseOrderList.push(po);
            poNum++;
            poDate = addDays(poDate, rng.nextInt(10, 16));
        }
    }

    // --- Invoices ---
    const invoices = new Map<string, any>();
    const invoiceList: any[] = [];
    let invNum = 1;

    // AR invoices from fulfilled/invoiced SOs
    for (const so of salesOrderList) {
        if (so.status === "fulfilled" || so.status === "invoiced") {
            const invId = `INV-AR-${String(invNum).padStart(6, "0")}`;
            const invDate = addDays(new Date(so.requestedDeliveryDate * 1000), rng.nextInt(0, 5));
            const dueDate = addDays(invDate, 30);
            const status = invDate < addDays(now, -30) ? "paid" : invDate < now ? rng.bool(0.5) ? "partially_paid" : "posted" : "posted";
            const inv = {
                id: invId,
                companyId: "COMP-001",
                invoiceNumber: invId,
                invoiceType: "accounts_receivable",
                relatedOrderId: so.id,
                partyId: so.customerId,
                partyName: so.customerName,
                invoiceDate: toUnix(invDate),
                dueDate: toUnix(dueDate),
                currency: "USD",
                subtotal: so.subtotal,
                taxAmount: so.taxAmount,
                totalAmount: so.totalAmount,
                paidAmount: status === "paid" ? so.totalAmount : status === "partially_paid" ? { amount: Math.round(so.totalAmount.amount * 0.5 * 100) / 100, currency: "USD" } : { amount: 0, currency: "USD" },
                status,
                lines: so.lines.map((l: any, i: number) => ({
                    lineNumber: i + 1,
                    itemId: l.itemId,
                    description: l.description,
                    quantity: l.orderedQuantity,
                    uom: l.uom,
                    unitPrice: l.unitPrice,
                    lineAmount: l.lineAmount,
                })),
            };
            invoices.set(invId, inv);
            invoiceList.push(inv);
            invNum++;
        }
    }

    // AP invoices from received POs
    for (const po of purchaseOrderList) {
        if (po.status === "received" || po.status === "partially_received") {
            const invId = `INV-AP-${String(invNum).padStart(6, "0")}`;
            const invDate = addDays(new Date(po.orderDate * 1000), rng.nextInt(14, 25));
            const dueDate = addDays(invDate, 45);
            const status = invDate < addDays(now, -45) ? "paid" : invDate < now ? "posted" : "draft";
            const inv = {
                id: invId,
                companyId: "COMP-001",
                invoiceNumber: invId,
                invoiceType: "accounts_payable",
                relatedOrderId: po.id,
                partyId: po.supplierId,
                partyName: po.supplierName,
                invoiceDate: toUnix(invDate),
                dueDate: toUnix(dueDate),
                currency: "USD",
                subtotal: po.subtotal,
                taxAmount: po.taxAmount,
                totalAmount: po.totalAmount,
                paidAmount: status === "paid" ? po.totalAmount : { amount: 0, currency: "USD" },
                status,
                lines: po.lines.map((l: any, i: number) => ({
                    lineNumber: i + 1,
                    itemId: l.itemId,
                    description: l.description,
                    quantity: l.orderedQuantity,
                    uom: l.uom,
                    unitPrice: l.unitPrice,
                    lineAmount: l.lineAmount,
                })),
            };
            invoices.set(invId, inv);
            invoiceList.push(inv);
            invNum++;
        }
    }

    // --- Payments ---
    const payments = new Map<string, any>();
    const paymentList: any[] = [];
    let payNum = 1;

    for (const inv of invoiceList) {
        if (inv.status === "paid" || inv.status === "partially_paid") {
            const payId = `PAY-${String(payNum).padStart(6, "0")}`;
            const payDate = addDays(new Date(inv.invoiceDate * 1000), rng.nextInt(15, 35));
            const amt = inv.status === "paid" ? inv.totalAmount.amount : inv.paidAmount.amount;
            const pay = {
                id: payId,
                companyId: "COMP-001",
                paymentNumber: payId,
                paymentType: inv.invoiceType === "accounts_receivable" ? "incoming" : "outgoing",
                partyId: inv.partyId,
                partyName: inv.partyName,
                invoiceId: inv.id,
                paymentDate: toUnix(payDate),
                method: rng.pick(["bank_transfer", "check", "bank_transfer", "bank_transfer"]),
                amount: Math.round(amt * 100) / 100,
                currency: "USD",
                reference: `REF-${payId}`,
            };
            payments.set(payId, pay);
            paymentList.push(pay);
            payNum++;
        }
    }

    // --- Journal Entries ---
    const journalEntries = new Map<string, any>();
    const journalEntryList: any[] = [];
    let jeNum = 1;

    for (const inv of invoiceList) {
        if (inv.status !== "draft") {
            const jeId = `JE-${String(jeNum).padStart(6, "0")}`;
            const postingDate = new Date(inv.invoiceDate * 1000);
            const fp = fiscalPeriods.find(
                (p) => new Date(p.startDate * 1000) <= postingDate && new Date(p.endDate * 1000) >= postingDate,
            );
            const isAR = inv.invoiceType === "accounts_receivable";
            const amount = inv.totalAmount.amount;
            const je = {
                id: jeId,
                companyId: "COMP-001",
                journalNumber: jeId,
                postingDate: inv.invoiceDate,
                documentDate: inv.invoiceDate,
                fiscalPeriodId: fp?.id ?? null,
                sourceDocumentType: inv.invoiceType,
                sourceDocumentId: inv.id,
                currency: "USD",
                description: `Invoice ${inv.invoiceNumber} posting`,
                lines: isAR
                    ? [
                          { lineNumber: 1, accountId: "GLA-1200", accountCode: "1200", accountName: "Accounts Receivable", costCenterId: null, description: "Customer receivable", debit: amount, credit: 0, currency: "USD" },
                          { lineNumber: 2, accountId: "GLA-4000", accountCode: "4000", accountName: "Product Revenue", costCenterId: null, description: "Revenue recognition", debit: 0, credit: amount, currency: "USD" },
                      ]
                    : [
                          { lineNumber: 1, accountId: "GLA-1300", accountCode: "1300", accountName: "Raw Material Inventory", costCenterId: null, description: "Inventory receipt", debit: amount, credit: 0, currency: "USD" },
                          { lineNumber: 2, accountId: "GLA-2000", accountCode: "2000", accountName: "Accounts Payable", costCenterId: null, description: "Supplier payable", debit: 0, credit: amount, currency: "USD" },
                      ],
            };
            journalEntries.set(jeId, je);
            journalEntryList.push(je);
            jeNum++;
        }
    }

    return {
        companies: new Map([["COMP-001", company]]),
        currencies,
        fiscalPeriods,
        glAccounts,
        costCenters,
        customers,
        suppliers,
        items: erpItems,
        salesOrders,
        purchaseOrders,
        invoices,
        payments,
        journalEntries,
        salesOrderList,
        purchaseOrderList,
        invoiceList,
        paymentList,
        journalEntryList,
        glAccountList,
        costCenterList,
        customerList,
        supplierList,
        itemList,
        _finishedGoods: finishedGoods,
        _rawMaterials: rawMaterials,
    };
}
