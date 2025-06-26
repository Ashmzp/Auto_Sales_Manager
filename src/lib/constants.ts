
export const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'autoSalesManager_customers',
  PURCHASES: 'autoSalesManager_purchases',
  STOCK: 'autoSalesManager_stock',
  INVOICES: 'autoSalesManager_invoices',
  SETTINGS: 'autoSalesManager_settings',
  COMPANY_PROFILE: 'autoSalesManager_companyProfile',
  GENERAL_SETTINGS: 'autoSalesManager_generalSettings',
};

export const DEFAULT_INVOICE_SETTINGS = {
  registeredPrefix: 'REG-INV-',
  nonRegisteredPrefix: 'NON-INV-',
  customPrefix: '',
  nextSerialNo: 1,
  nextRegisteredSerialNo: 1,
  nextNonRegisteredSerialNo: 1,
  enableInsurance: false,
  enableRegistration: false,
  enableAccessories: false,
  enableSalesPerson: false,
  enableCashOrHypothecation: true,
  enableOnRoadPrice: true,
  enableScheme: true,
  enableAadharNo: false,
  enableNomineeName: false,
  enableRTO: false,
  enableCustomerDOBDisplay: false,
};

export const DEFAULT_COMPANY_PROFILE = {
  companyName: '',
  legalName: '',
  gstNumber: '',
  panNumber: '',
  address: '',
  state: '',
  district: '',
  pincode: '',
  email: '',
  phone: '',
  website: '',
  logoUrl: '',
  bankDetails: '',
  signatureUrl: '',
  financialYearStart: null,
  financialYearEnd: null,
  termsAndConditions: `1. Goods once sold will not be taken back.
2. Interest @18% p.a. will be charged if payment is not made within due date.
3. Subject to jurisdiction.
4. All disputes subject to jurisdiction only.
5. Warranty as per manufacturer's terms.`,
  stateCode: '09', // Example, should match company's state GST code
};

export const DEFAULT_GENERAL_SETTINGS = {
  theme: 'system' as 'system' | 'light' | 'dark',
  defaultItemsPerPage: 20,
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
  "Delhi (National Capital Territory of Delhi)", "Puducherry", "Ladakh", "Jammu and Kashmir"
];



