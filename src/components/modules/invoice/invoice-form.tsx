
"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceSchema, type InvoiceFormData } from '@/lib/schemas'; 
import type { Invoice, Customer, StockItem, InvoiceSettings } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format, parseISO } from "date-fns";
import { CalendarIcon, PackageSearch, Printer, FileText as FileTextIconLucide, UserPlus, Trash2 } from 'lucide-react'; 
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; 
import type { CustomerForm } from '@/components/modules/customer/customer-form';

interface InvoiceFormProps {
  invoiceData?: Invoice | null;
  customers: Customer[];
  availableStockItems: StockItem[];
  invoiceSettings: InvoiceSettings;
  onSave: (invoice: InvoiceFormData, customer: Customer) => void;
  onCancel: () => void;
  generateSerialNumber: (isRegisteredParty: boolean) => string;
  onPrint: (invoiceId: string, type: 'tax' | 'challan') => void;
  onAddNewCustomer: (newCustomer: Customer) => Customer; 
  CustomerFormComponent: typeof CustomerForm;
  defaultStateFromCompany?: string | null;
  defaultDistrictFromCompany?: string | null;
}

export const InvoiceForm = memo(function InvoiceForm({
  invoiceData,
  customers,
  availableStockItems,
  invoiceSettings,
  onSave,
  onCancel,
  generateSerialNumber,
  onPrint,
  onAddNewCustomer,
  CustomerFormComponent,
  defaultStateFromCompany,
  defaultDistrictFromCompany,
}: InvoiceFormProps) {
  const { toast } = useToast();
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [selectedCustomerForDisplay, setSelectedCustomerForDisplay] = useState<Customer | null>(null);
  const [currentSerialNo, setCurrentSerialNo] = useState('');
  
  const [isStockItemPopoverOpen, setIsStockItemPopoverOpen] = useState(false);
  const [stockItemSearchTerm, setStockItemSearchTerm] = useState("");
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);


  const defaultValues = useMemo(() => {
    const base: Partial<InvoiceFormData> = {
      customerId: '',
      invoiceDate: new Date(),
      cashOrHypothecation: invoiceSettings.enableCashOrHypothecation ? '' : undefined,
      onRoadPrice: invoiceSettings.enableOnRoadPrice ? 0 : undefined,
      scheme: invoiceSettings.enableScheme ? undefined : undefined, 
      items: [],
      insuranceAmount: invoiceSettings.enableInsurance ? 0 : undefined,
      registrationAmount: invoiceSettings.enableRegistration ? 0 : undefined,
      accessoriesAmount: invoiceSettings.enableAccessories ? 0 : undefined,
      salesPersonName: invoiceSettings.enableSalesPerson ? '' : undefined,
      aadharNo: invoiceSettings.enableAadharNo ? '' : undefined,
      nomineeName: invoiceSettings.enableNomineeName ? '' : undefined,
      rto: invoiceSettings.enableRTO ? '' : undefined,
      serialNo: '', 
    };
    if (invoiceData) {
      const customer = customers.find(c => c.id === invoiceData.customerId);
      const parsedDate = invoiceData.invoiceDate ? parseISO(invoiceData.invoiceDate as unknown as string) : new Date();
      return {
        ...base,
        ...invoiceData,
        invoiceDate: parsedDate,
        items: invoiceData.items.map(item => ({ ...item, id: item.id || uuidv4() })),
        customerDetails: customer ? { ...customer } : undefined,
        cashOrHypothecation: invoiceSettings.enableCashOrHypothecation ? invoiceData.cashOrHypothecation : undefined,
        onRoadPrice: invoiceSettings.enableOnRoadPrice ? invoiceData.onRoadPrice : undefined,
        scheme: invoiceSettings.enableScheme ? invoiceData.scheme : undefined,
        insuranceAmount: invoiceSettings.enableInsurance && invoiceData.insuranceAmount !== undefined ? invoiceData.insuranceAmount : (invoiceSettings.enableInsurance ? 0 : undefined),
        registrationAmount: invoiceSettings.enableRegistration && invoiceData.registrationAmount !== undefined ? invoiceData.registrationAmount : (invoiceSettings.enableRegistration ? 0 : undefined),
        accessoriesAmount: invoiceSettings.enableAccessories && invoiceData.accessoriesAmount !== undefined ? invoiceData.accessoriesAmount : (invoiceSettings.enableAccessories ? 0 : undefined),
        salesPersonName: invoiceSettings.enableSalesPerson && invoiceData.salesPersonName ? invoiceData.salesPersonName : (invoiceSettings.enableSalesPerson ? '' : undefined),
        aadharNo: invoiceSettings.enableAadharNo && invoiceData.aadharNo ? invoiceData.aadharNo : (invoiceSettings.enableAadharNo ? '' : undefined),
        nomineeName: invoiceSettings.enableNomineeName && invoiceData.nomineeName ? invoiceData.nomineeName : (invoiceSettings.enableNomineeName ? '' : undefined),
        rto: invoiceSettings.enableRTO && invoiceData.rto ? invoiceData.rto : (invoiceSettings.enableRTO ? '' : undefined),
      };
    }
    return base;
  }, [invoiceData, customers, invoiceSettings]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({ 
    resolver: zodResolver(InvoiceSchema),
    defaultValues: defaultValues as InvoiceFormData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (invoiceData) { 
      const customer = customers.find(c => c.id === invoiceData.customerId);
      setSelectedCustomerForDisplay(customer || null);
      setCurrentSerialNo(invoiceData.serialNo); 
      const parsedDate = invoiceData.invoiceDate ? parseISO(invoiceData.invoiceDate as unknown as string) : new Date();
      reset({ 
        ...invoiceData,
        invoiceDate: parsedDate,
        items: invoiceData.items.map(item => ({ ...item, id: item.id || uuidv4() })),
        customerDetails: customer ? {
          customerName: customer.customerName, fatherName: customer.fatherName, mobileNo: customer.mobileNo,
          address: customer.address, state: customer.state, district: customer.district,
          gstNo: customer.gstNo, isRegistered: customer.isRegistered, pincode: customer.pincode, dob: customer.dob,
        } : undefined,
        cashOrHypothecation: invoiceSettings.enableCashOrHypothecation ? invoiceData.cashOrHypothecation : undefined,
        onRoadPrice: invoiceSettings.enableOnRoadPrice ? invoiceData.onRoadPrice : undefined,
        scheme: invoiceSettings.enableScheme ? invoiceData.scheme : undefined,
        insuranceAmount: invoiceSettings.enableInsurance && invoiceData.insuranceAmount !== undefined ? invoiceData.insuranceAmount : (invoiceSettings.enableInsurance ? 0 : undefined),
        registrationAmount: invoiceSettings.enableRegistration && invoiceData.registrationAmount !== undefined ? invoiceData.registrationAmount : (invoiceSettings.enableRegistration ? 0 : undefined),
        accessoriesAmount: invoiceSettings.enableAccessories && invoiceData.accessoriesAmount !== undefined ? invoiceData.accessoriesAmount : (invoiceSettings.enableAccessories ? 0 : undefined),
        salesPersonName: invoiceSettings.enableSalesPerson && invoiceData.salesPersonName ? invoiceData.salesPersonName : (invoiceSettings.enableSalesPerson ? '' : undefined),
        aadharNo: invoiceSettings.enableAadharNo && invoiceData.aadharNo ? invoiceData.aadharNo : (invoiceSettings.enableAadharNo ? '' : undefined),
        nomineeName: invoiceSettings.enableNomineeName && invoiceData.nomineeName ? invoiceData.nomineeName : (invoiceSettings.enableNomineeName ? '' : undefined),
        rto: invoiceSettings.enableRTO && invoiceData.rto ? invoiceData.rto : (invoiceSettings.enableRTO ? '' : undefined),
      });
    } else { 
      if (!selectedCustomerForDisplay) {
        setCurrentSerialNo('Pending Customer Selection');
        reset({ 
            ...(defaultValues as InvoiceFormData), 
            invoiceDate: new Date(),
            items: [],
            customerDetails: undefined,
            customerId: '',
            serialNo: '', 
        });
      }
    }
  }, [invoiceData, customers, invoiceSettings, reset, selectedCustomerForDisplay, defaultValues]);


  useEffect(() => {
    if (!invoiceData && selectedCustomerForDisplay) { 
      const newSerial = generateSerialNumber(selectedCustomerForDisplay.isRegistered);
      setCurrentSerialNo(newSerial);
      setValue('serialNo', newSerial);
      setValue('customerDetails', {
        customerName: selectedCustomerForDisplay.customerName, fatherName: selectedCustomerForDisplay.fatherName, mobileNo: selectedCustomerForDisplay.mobileNo,
        address: selectedCustomerForDisplay.address, state: selectedCustomerForDisplay.state, district: selectedCustomerForDisplay.district,
        gstNo: selectedCustomerForDisplay.gstNo, isRegistered: selectedCustomerForDisplay.isRegistered, pincode: selectedCustomerForDisplay.pincode, dob: selectedCustomerForDisplay.dob
      }, { shouldValidate: true });

    } else if (invoiceData && selectedCustomerForDisplay) { 
        setCurrentSerialNo(invoiceData.serialNo); 
        setValue('serialNo', invoiceData.serialNo);
        setValue('customerDetails', {
            customerName: selectedCustomerForDisplay.customerName, fatherName: selectedCustomerForDisplay.fatherName, mobileNo: selectedCustomerForDisplay.mobileNo,
            address: selectedCustomerForDisplay.address, state: selectedCustomerForDisplay.state, district: selectedCustomerForDisplay.district,
            gstNo: selectedCustomerForDisplay.gstNo, isRegistered: selectedCustomerForDisplay.isRegistered, pincode: selectedCustomerForDisplay.pincode, dob: selectedCustomerForDisplay.dob,
        }, {shouldValidate: true});
    } else if (invoiceData && !selectedCustomerForDisplay) { 
        setCurrentSerialNo(invoiceData.serialNo);
        setValue('serialNo', invoiceData.serialNo);
        setValue('customerDetails', invoiceData.customerDetails);
    }
  }, [selectedCustomerForDisplay, invoiceData, generateSerialNumber, setValue]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setValue('customerId', customer.id, { shouldValidate: true });
    setSelectedCustomerForDisplay(customer);
    setIsCustomerPopoverOpen(false);
  }, [setValue]);

  const handleSaveNewCustomerFromDialog = useCallback((newCustomerData: Customer) => {
  const savedCustomer = onAddNewCustomer({
    ...newCustomerData,
    isRegistered: !!newCustomerData.gstNo && newCustomerData.gstNo.trim() !== ''
  });

  handleSelectCustomer(savedCustomer); // ✅ ensures new customer is selected
  setIsAddCustomerDialogOpen(false);

  toast({
    title: "Customer Added",
    description: `${savedCustomer.customerName} has been added and selected.`,
  });
}, [onAddNewCustomer, handleSelectCustomer, toast]);

  
  const handleAddItem = useCallback((stockItem: StockItem) => {
    const alreadyAdded = fields.some(field => field.stockItemId === stockItem.id);
    if (alreadyAdded) {
      toast({ title: "Item Already Added", description: "This chassis number is already in the invoice.", variant: "destructive" });
      return;
    }
    append({
      id: uuidv4(),
      stockItemId: stockItem.id,
      modelName: stockItem.modelName,
      chassisNo: stockItem.chassisNo,
      engineNo: stockItem.engineNo,
      colour: stockItem.colour,
      qty: 1,
      gst: stockItem.gst,
      price: stockItem.price,
    });
    setStockItemSearchTerm(""); 
    setIsStockItemPopoverOpen(false);
  }, [fields, append, toast]);

  const isNonRegisteredCustomerSelected = useMemo(() => {
    return selectedCustomerForDisplay ? !selectedCustomerForDisplay.isRegistered : false;
  }, [selectedCustomerForDisplay]);

  const onSubmitHandler = useCallback((data: InvoiceFormData) => {
  if (!selectedCustomerForDisplay) {
    toast({
      title: "Customer Not Selected",
      description: "Please select a customer.",
      variant: "destructive",
    });
    return;
  }

  const currentSerialFromState = currentSerialNo;

  if (
    invoiceSettings.enableAadharNo &&
    data.aadharNo &&
    data.aadharNo.trim() !== "" &&
    !/^\d{12}$/.test(data.aadharNo)
  ) {
    toast({
      title: "Invalid Aadhar No.",
      description: "If provided, Aadhar No. must be 12 digits.",
      variant: "destructive",
    });
    return;
  }

  if (isNonRegisteredCustomerSelected) {
    data.cashOrHypothecation = data.cashOrHypothecation || "N/A";
    data.rto = data.rto || "N/A";
    data.nomineeName = data.nomineeName || "N/A";
    data.salesPersonName = data.salesPersonName || "N/A";
    data.scheme = data.scheme || "Without Scheme";
    data.aadharNo = data.aadharNo || "";
  }

  const finalData: InvoiceFormData = {
    ...data,
    serialNo: currentSerialFromState,
    items: data.items.map(item => ({ ...item, id: item.id || uuidv4() })),
    cashOrHypothecation: invoiceSettings.enableCashOrHypothecation ? data.cashOrHypothecation : undefined,
    onRoadPrice: invoiceSettings.enableOnRoadPrice ? data.onRoadPrice : undefined,
    scheme: invoiceSettings.enableScheme ? data.scheme : undefined,
    insuranceAmount: invoiceSettings.enableInsurance ? data.insuranceAmount : undefined,
    registrationAmount: invoiceSettings.enableRegistration ? data.registrationAmount : undefined,
    accessoriesAmount: invoiceSettings.enableAccessories ? data.accessoriesAmount : undefined,
    salesPersonName: invoiceSettings.enableSalesPerson ? data.salesPersonName : undefined,
    aadharNo: invoiceSettings.enableAadharNo ? data.aadharNo : undefined,
    nomineeName: invoiceSettings.enableNomineeName ? data.nomineeName : undefined,
    rto: invoiceSettings.enableRTO ? data.rto : undefined,
  };

  onSave(finalData, selectedCustomerForDisplay);
}, [selectedCustomerForDisplay, invoiceSettings, currentSerialNo, onSave, toast, isNonRegisteredCustomerSelected]);

  
  const customerDisplay = watch('customerDetails'); 
  const currentInvoiceItems = watch('items');

  const filteredStockForSelection = useMemo(() => {
    const selectedStockItemIds = currentInvoiceItems.map(item => item.stockItemId);
    return availableStockItems.filter(
      stockItem => !selectedStockItemIds.includes(stockItem.id) &&
                   (stockItem.chassisNo.toLowerCase().includes(stockItemSearchTerm.toLowerCase()) ||
                    stockItem.engineNo.toLowerCase().includes(stockItemSearchTerm.toLowerCase()) ||
                    stockItem.modelName.toLowerCase().includes(stockItemSearchTerm.toLowerCase()))
    );
  }, [availableStockItems, currentInvoiceItems, stockItemSearchTerm]);

  const handleTriggerPrint = useCallback((type: 'tax' | 'challan') => {
    if (invoiceData?.id) {
      onPrint(invoiceData.id, type);
    } else {
      toast({
        title: `Cannot Print Unsaved Invoice`,
        description: `Please save the invoice first before printing.`,
        variant: "destructive"
      });
    }
  }, [invoiceData, onPrint, toast]);

  const handleRemoveItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);
  
  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 flex flex-col h-full p-2 sm:p-4">
      <ScrollArea className="flex-grow pr-2 sm:pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="serialNoDisplay">Invoice Serial No.</Label>
            <Input id="serialNoDisplay" value={currentSerialNo} readOnly disabled className="bg-muted/50" />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label htmlFor="customerId">Customer <span className="text-destructive">*</span></Label>
            <div className="flex space-x-2">
                <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                        <UserPlus className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {selectedCustomerForDisplay ? selectedCustomerForDisplay.customerName : "Select customer..."}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList><ScrollArea className="h-[200px]">
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                        {customers.map((customer) => (
                            <CommandItem key={customer.id} value={`${customer.customerName} ${customer.mobileNo}`} onSelect={() => handleSelectCustomer(customer)}>
                            {customer.customerName} ({customer.mobileNo})
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </ScrollArea></CommandList>
                    </Command>
                </PopoverContent>
                </Popover>
                <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title="Add New Customer">
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <CustomerFormComponent
                            onSave={handleSaveNewCustomerFromDialog}
                            onCancel={() => setIsAddCustomerDialogOpen(false)}
                            defaultStateFromCompany={defaultStateFromCompany}
                            defaultDistrictFromCompany={defaultDistrictFromCompany}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {errors.customerId && <p className="text-sm text-destructive mt-1">{errors.customerId.message}</p>}
          </div>

          {customerDisplay && (
            <div className="sm:col-span-2 lg:col-span-3 mt-1 p-3 border rounded-md bg-muted/50 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                <div><strong>Father:</strong> {customerDisplay.fatherName || 'N/A'}</div>
                <div><strong>Mobile:</strong> {customerDisplay.mobileNo}</div>
                <div className="md:col-span-2"><strong>Address:</strong> {`${customerDisplay.address}, ${customerDisplay.district}, ${customerDisplay.state}${customerDisplay.pincode ? ' - ' + customerDisplay.pincode : ''}`}</div>
                <div><strong>GST:</strong> {customerDisplay.gstNo || 'N/A'} ({customerDisplay.isRegistered ? 'Registered' : 'Non-Reg'})</div>
            </div>
          )}

          <div>
            <Label htmlFor="invoiceDate">Invoice Date <span className="text-destructive">*</span></Label>
            <Controller name="invoiceDate" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
            )} />
            {errors.invoiceDate && <p className="text-sm text-destructive mt-1">{errors.invoiceDate.message}</p>}
          </div>

          {invoiceSettings.enableCashOrHypothecation && (
            <div>
              <Label htmlFor="cashOrHypothecation">Cash/Hypothecation {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
              <Input id="cashOrHypothecation" {...register('cashOrHypothecation')} placeholder="e.g. Cash, HDFC Bank" />
              {errors.cashOrHypothecation && <p className="text-sm text-destructive mt-1">{errors.cashOrHypothecation.message}</p>}
            </div>
          )}

          {invoiceSettings.enableOnRoadPrice && (
            <div>
              <Label htmlFor="onRoadPrice">On Road Price {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
              <Input id="onRoadPrice" type="number" {...register('onRoadPrice', { valueAsNumber: true })} placeholder="e.g. 120000" />
              {errors.onRoadPrice && <p className="text-sm text-destructive mt-1">{errors.onRoadPrice.message}</p>}
            </div>
          )}
          
          {invoiceSettings.enableScheme && (
            <div>
              <Label htmlFor="scheme">Scheme {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
              <Controller name="scheme" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select scheme status" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="With Scheme">With Scheme</SelectItem>
                          <SelectItem value="Without Scheme">Without Scheme</SelectItem>
                      </SelectContent>
                  </Select>
              )} />
              {errors.scheme && <p className="text-sm text-destructive mt-1">{errors.scheme.message}</p>}
            </div>
          )}

          {invoiceSettings.enableSalesPerson && (
             <div>
                <Label htmlFor="salesPersonName">Sales Person Name {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
                <Input id="salesPersonName" {...register('salesPersonName')} placeholder="Enter sales person name" />
                {errors.salesPersonName && <p className="text-sm text-destructive mt-1">{errors.salesPersonName.message}</p>}
             </div>
          )}

          {invoiceSettings.enableAadharNo && (
             <div>
                <Label htmlFor="aadharNo">Aadhar No. {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
                <Input id="aadharNo" {...register('aadharNo')} placeholder="12 Digit Aadhar No." maxLength={12} />
                {errors.aadharNo && <p className="text-sm text-destructive mt-1">{errors.aadharNo.message}</p>}
             </div>
          )}
          {invoiceSettings.enableNomineeName && (
             <div>
                <Label htmlFor="nomineeName">Nominee Name {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
                <Input id="nomineeName" {...register('nomineeName')} placeholder="Nominee Full Name" />
                {errors.nomineeName && <p className="text-sm text-destructive mt-1">{errors.nomineeName.message}</p>}
             </div>
          )}
          {invoiceSettings.enableRTO && (
             <div>
                <Label htmlFor="rto">RTO {isNonRegisteredCustomerSelected && <span className="text-destructive">*</span>}</Label>
                <Input id="rto" {...register('rto')} placeholder="RTO Location/Code" />
                {errors.rto && <p className="text-sm text-destructive mt-1">{errors.rto.message}</p>}
             </div>
          )}

          {invoiceSettings.enableInsurance && (
            <div><Label htmlFor="insuranceAmount">Insurance Amount</Label><Input id="insuranceAmount" type="number" {...register('insuranceAmount', { valueAsNumber: true })} />{errors.insuranceAmount && <p className="text-sm text-destructive mt-1">{errors.insuranceAmount.message}</p>}</div>
          )}
          {invoiceSettings.enableRegistration && (
            <div><Label htmlFor="registrationAmount">Registration Amount</Label><Input id="registrationAmount" type="number" {...register('registrationAmount', { valueAsNumber: true })} />{errors.registrationAmount && <p className="text-sm text-destructive mt-1">{errors.registrationAmount.message}</p>}</div>
          )}
          {invoiceSettings.enableAccessories && (
            <div><Label htmlFor="accessoriesAmount">Accessories Amount</Label><Input id="accessoriesAmount" type="number" {...register('accessoriesAmount', { valueAsNumber: true })} />{errors.accessoriesAmount && <p className="text-sm text-destructive mt-1">{errors.accessoriesAmount.message}</p>}</div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Invoice Items</h3>
             <Popover open={isStockItemPopoverOpen} onOpenChange={setIsStockItemPopoverOpen}>
              <PopoverTrigger asChild>
                 <Button variant="outline" size="sm" className="w-auto justify-between" type="button">
                    <PackageSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" /> Add Item from Stock
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" side="bottom" align="end">
                <Command>
                  <CommandInput 
                    placeholder="Search stock by Chassis, Engine, Model..." 
                    value={stockItemSearchTerm}
                    onValueChange={setStockItemSearchTerm}
                  />
                  <CommandList><ScrollArea className="h-[250px]">
                    <CommandEmpty>No stock item found, or all available items already added.</CommandEmpty>
                    <CommandGroup heading={`${filteredStockForSelection.length} item(s) available`}>
                      {filteredStockForSelection.map((item) => (
                        <CommandItem 
                            key={item.id} 
                            value={`${item.chassisNo} ${item.modelName} ${item.engineNo}`} 
                            onSelect={() => handleAddItem(item)}
                            className="flex justify-between cursor-pointer"
                        >
                          <span>{item.modelName} ({item.colour}) - CH: {item.chassisNo}</span>
                          <span className="text-xs text-muted-foreground">₹{item.price.toLocaleString()}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea></CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && errors.items.message && (
            <p className="text-sm text-destructive my-2">{errors.items.message}</p>
          )}
          {fields.length === 0 && !errors.items?.message && (
             <p className="text-sm text-muted-foreground my-2">No items added to invoice yet. Add at least one item. <span className="text-destructive">*</span></p>
          )}

          {fields.length > 0 && (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                    <TableHead className="w-[20%] min-w-[150px]">Model</TableHead>
                    <TableHead className="w-[20%] min-w-[150px]">Chassis No.</TableHead>
                    <TableHead className="w-[15%] min-w-[150px] hidden sm:table-cell">Engine No.</TableHead>
                    <TableHead className="w-[10%] min-w-[100px] hidden md:table-cell">Colour</TableHead>
                    <TableHead className="w-[10%] min-w-[80px] text-right">GST(%)</TableHead>
                    <TableHead className="w-[15%] min-w-[120px] text-right">Price</TableHead>
                    <TableHead className="w-[10%] min-w-[80px] text-center">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.modelName}</TableCell>
                      <TableCell>{item.chassisNo}</TableCell>
                      <TableCell className="hidden sm:table-cell">{item.engineNo}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.colour}</TableCell>
                      <TableCell className="text-right">{item.gst.toFixed(1)}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="text-right"
                          {...register(`items.${index}.price`, { valueAsNumber: true })}
                          placeholder="Price"
                        />
                        {errors.items?.[index]?.price && <p className="text-xs text-destructive mt-1 text-left">{errors.items[index]?.price?.message}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex justify-between items-center pt-4 border-t mt-auto flex-shrink-0">
        <div>
            {invoiceData?.id && (
              <>
                <Button type="button" variant="outline" className="mr-2" onClick={() => handleTriggerPrint('tax')}><Printer className="mr-2 h-4 w-4"/> Print Tax Invoice</Button>
                <Button type="button" variant="outline" onClick={() => handleTriggerPrint('challan')}><FileTextIconLucide className="mr-2 h-4 w-4"/> Print Delivery Challan</Button>
              </>
            )}
        </div>
        <div className="space-x-3">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{invoiceData ? 'Update Invoice' : 'Save Invoice'}</Button>
        </div>
      </div>
    </form>
  );
});

