
import type { CustomerFormData as CustomerFormDataTypeInternal, PurchaseEntryFormData, PurchaseItemFormData, InvoiceFormData as InvoiceFormDataTypeInternal, InvoiceSettingsFormData, InvoiceItemFormData as InvoiceItemFormDataType, CompanyProfileFormData as CompanyProfileFormDataType, GeneralSettingsFormData as GeneralSettingsFormDataTypeInternal } from '@/lib/schemas';
import type { z } from 'zod';
import type { StockItemSchema } from '@/lib/schemas';


export type CustomerFormData = Omit<CustomerFormDataTypeInternal, 'dob'> & {
  dob?: string; // Stored as 'yyyy-MM-dd' string
};

export type Customer = CustomerFormData & {
  id: string;
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseItem = PurchaseItemFormData & {
   id: string;
};

export type PurchaseEntry = Omit<PurchaseEntryFormData, 'items' | 'customerDetails'> & {
  id: string;
  serialNo: string;
  partyName: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
  customerDetails?: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
};


export type StockItem = z.infer<typeof StockItemSchema>;


export type InvoiceItem = InvoiceItemFormDataType & {
  // id is already in InvoiceItemFormDataType via default
  hsnSac?: string;
  discountPercentage?: number;
};

export type InvoiceSettings = InvoiceSettingsFormData;

// InvoiceFormData is used by the form and has invoiceDate as a Date object (from Zod schema)
export type InvoiceFormData = InvoiceFormDataTypeInternal;


// Invoice type represents the data structure as stored (e.g., in localStorage)
// Here, invoiceDate is a string.
export type Invoice = Omit<InvoiceFormData, 'invoiceDate' | 'customerDetails'> & {
  id: string;
  serialNo: string;
  invoiceDate: string; // Explicitly string for stored version
  customerDetails: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: string;
  updatedAt: string;
  aadharNo?: string;
  nomineeName?: string;
  rto?: string;
};

// CompanyProfileFormData already reflects schema changes due to type inference
export type CompanyProfile = CompanyProfileFormDataType & {
  stateCode?: string;
};

export type GeneralSettings = GeneralSettingsFormDataTypeInternal;

