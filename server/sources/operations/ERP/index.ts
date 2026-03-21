import { getCompanies } from "./getCompanies";
import { getCompanyById } from "./getCompanyById";
import { getCurrencies } from "./getCurrencies";
import { getFiscalPeriods } from "./getFiscalPeriods";
import { getGlAccounts } from "./getGlAccounts";
import { getCostCenters } from "./getCostCenters";
import { getCustomers } from "./getCustomers";
import { getCustomerById } from "./getCustomerById";
import { getSuppliers } from "./getSuppliers";
import { getSupplierById } from "./getSupplierById";
import { getItems } from "./getItems";
import { getItemById } from "./getItemById";
import { getSalesOrders } from "./getSalesOrders";
import { getSalesOrderById } from "./getSalesOrderById";
import { getPurchaseOrders } from "./getPurchaseOrders";
import { getPurchaseOrderById } from "./getPurchaseOrderById";
import { getInvoices } from "./getInvoices";
import { getInvoiceById } from "./getInvoiceById";
import { getPayments } from "./getPayments";
import { getJournalEntries } from "./getJournalEntries";
import { getJournalEntryById } from "./getJournalEntryById";

export const erpOperations = {
    getCompanies,
    getCompanyById,
    getCurrencies,
    getFiscalPeriods,
    getGlAccounts,
    getCostCenters,
    getCustomers,
    getCustomerById,
    getSuppliers,
    getSupplierById,
    getItems,
    getItemById,
    getSalesOrders,
    getSalesOrderById,
    getPurchaseOrders,
    getPurchaseOrderById,
    getInvoices,
    getInvoiceById,
    getPayments,
    getJournalEntries,
    getJournalEntryById,
};
