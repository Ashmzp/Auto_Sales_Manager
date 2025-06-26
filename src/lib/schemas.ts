
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  fatherName: z.string().optional(),
  mobileNo: z.string().regex(/^\d{10}$/, { message: "Mobile number must be 10 digits." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  state: z.string().min(2, { message: "State is required." }),
  district: z.string().min(2, { message: "District is required." }),
  gstNo: z.string().optional().transform(val => val ? val.toUpperCase() : undefined),
  isRegistered: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits.").optional(),
  dob: z.date().nullable().optional(),
});

export type CustomerFormData = z.infer<typeof CustomerSchema>;

CustomerSchema.refine(data => {
  if (data.gstNo && !/^[0-9A-Z]{15}$/.test(data.gstNo)) {
    return false;
  }
  return true;
}, {
  message: "GST No. must be 15 alphanumeric characters.",
  path: ["gstNo"],
});


export const PurchaseItemSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  modelName: z.string().min(1, "Model name is required."),
  chassisNo: z.string().min(1, "Chassis number is required.").regex(/^[a-zA-Z0-9-]+$/, "Chassis number must be alphanumeric (hyphens allowed)."),
  engineNo: z.string().min(1, "Engine number is required.").regex(/^[a-zA-Z0-9-]+$/, "Engine number must be alphanumeric (hyphens allowed)."),
  colour: z.string().min(1, "Colour is required."),
  gst: z.coerce.number().min(0, "GST rate must be non-negative."),
  price: z.coerce.number().min(0, "Price must be non-negative."),
});
export type PurchaseItemFormData = z.infer<typeof PurchaseItemSchema>;


export const PurchaseEntrySchema = z.object({
  id: z.string().uuid().optional(),
  serialNo: z.string().optional(),
  partyId: z.string().min(1, "Party is required."),
  partyName: z.string().optional(),
  customerDetails: CustomerSchema.omit({id: true, createdAt: true, updatedAt: true}).optional(),
  invoiceDate: z.date({ required_error: "Invoice date is required."}),
  invoiceNo: z.string().min(1, "Invoice number is required."),
  items: z.array(PurchaseItemSchema).min(1, "At least one item is required."),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type PurchaseEntryFormData = z.infer<typeof PurchaseEntrySchema>;


export const StockItemSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  purchaseEntryId: z.string().uuid(),
  purchaseItemId: z.string().uuid(),
  modelName: z.string(),
  chassisNo: z.string(),
  engineNo: z.string(),
  colour: z.string(),
  gst: z.number(),
  price: z.number(),
  purchaseDate: z.string().datetime(),
  sold: z.boolean().default(false),
  invoiceId: z.string().uuid().optional(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});


export const InvoiceSettingsSchema = z.object({
  registeredPrefix: z.string().max(10, "Prefix too long (max 10 chars)").default("REG-INV-"),
  nonRegisteredPrefix: z.string().max(10, "Prefix too long (max 10 chars)").default("NON-INV-"),
  customPrefix: z.string().max(5, "Custom prefix max 5 chars").optional(),
  nextSerialNo: z.coerce.number().int().min(1).default(1),
  nextRegisteredSerialNo: z.coerce.number().int().min(1).default(1),
  nextNonRegisteredSerialNo: z.coerce.number().int().min(1).default(1),
  enableInsurance: z.boolean().default(false),
  enableRegistration: z.boolean().default(false),
  enableAccessories: z.boolean().default(false),
  enableSalesPerson: z.boolean().default(false),
  enableCashOrHypothecation: z.boolean().default(true),
  enableOnRoadPrice: z.boolean().default(true),
  enableScheme: z.boolean().default(true),
  enableAadharNo: z.boolean().default(false),
  enableNomineeName: z.boolean().default(false),
  enableRTO: z.boolean().default(false),
  enableCustomerDOBDisplay: z.boolean().default(false),
});

export type InvoiceSettingsFormData = z.infer<typeof InvoiceSettingsSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  stockItemId: z.string().uuid({ message: "Stock item ID is required." }),
  modelName: z.string(),
  chassisNo: z.string(),
  engineNo: z.string(),
  colour: z.string(),
  qty: z.literal(1).default(1),
  gst: z.number(),
  price: z.number(), // This is the item rate BEFORE discount
  hsnSac: z.string().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
});
export type InvoiceItemFormData = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  serialNo: z.string().optional(),
  customerId: z.string().min(1, "Customer is required."),
  customerDetails: CustomerSchema.omit({id: true, createdAt: true, updatedAt: true}).optional(),
  invoiceDate: z.date({ required_error: "Invoice date is required."}),

  cashOrHypothecation: z.string().optional(), // Used for Bill Type: "Credit" or "Cash"
  onRoadPrice: z.coerce.number({invalid_type_error: "On Road Price must be a valid number."})
                      .min(0, "On Road Price cannot be negative.").optional(), // This might be the grand total
  scheme: z.enum(['With Scheme', 'Without Scheme']).optional(),

  insuranceAmount: z.coerce.number().min(0).optional(),
  registrationAmount: z.coerce.number().min(0).optional(),
  accessoriesAmount: z.coerce.number().min(0).optional(), // Could be 'Logistics Charges Paid'
  salesPersonName: z.string().optional(),

  aadharNo: z.string().regex(/^\d{12}$/, "Aadhar No. must be 12 digits.").optional().or(z.literal('')),
  nomineeName: z.string().optional().or(z.literal('')),
  rto: z.string().optional().or(z.literal('')), // Also used for Document Extra Info: RTO

  items: z.array(InvoiceItemSchema).min(1, "At least one item must be added to the invoice."),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type InvoiceFormData = z.infer<typeof InvoiceSchema>;


export const CompanyProfileSchema = z.object({
  companyName: z.string().min(1, "Company Name is required."),
  legalName: z.string().min(1, "Legal Name is required."),
  gstNumber: z.string().optional().refine(val => !val || /^[0-9A-Z]{15}$/.test(val), {
    message: "GST Number must be 15 alphanumeric characters.",
  }),
  panNumber: z.string().min(1, "PAN Number is required.").regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number format."),
  address: z.string().min(1, "Company Address is required."),
  state: z.string().min(1, "State is required."),
  district: z.string().min(1, "District is required."),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits."),
  email: z.string().email("Invalid email address."),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number."),
  website: z.string().url("Invalid URL.").optional().or(z.literal('')),
  logoUrl: z.string().url("Invalid logo URL.").optional().or(z.literal('')),
  bankDetails: z.string().min(1, "Bank Details are required."),
  signatureUrl: z.string().url("Invalid signature URL.").optional().or(z.literal('')),
  financialYearStart: z.date({invalid_type_error: "Financial year start date is required."}).nullable(),
  financialYearEnd: z.date({invalid_type_error: "Financial year end date is required."}).nullable(),
  termsAndConditions: z.string().optional(),
  stateCode: z.string().regex(/^\d{2}$/, "State code must be 2 digits.").optional(),
}).refine(data => {
  if (data.financialYearStart && data.financialYearEnd) {
    return data.financialYearEnd > data.financialYearStart;
  }
  return true;
}, {
  message: "Financial year end date must be after start date.",
  path: ["financialYearEnd"],
});

export type CompanyProfileFormData = z.infer<typeof CompanyProfileSchema>;

export const GeneralSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  defaultItemsPerPage: z.coerce.number().int().min(5).max(100).default(20),
});

export type GeneralSettingsFormData = z.infer<typeof GeneralSettingsSchema>;

