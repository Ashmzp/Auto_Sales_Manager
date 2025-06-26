
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
import { PurchaseEntrySchema, type PurchaseEntryFormData, type PurchaseItemFormData } from '@/lib/schemas';
import { type PurchaseEntry, type Customer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format, parseISO } from "date-fns"; // parseISO added
import { CalendarIcon, PlusCircle, Trash2, FileSpreadsheet, Users } from 'lucide-react';
// import * as XLSX from 'xlsx'; // Dynamic import for XLSX
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface PurchaseFormProps {
  purchaseData?: PurchaseEntry | null;
  customers: Customer[];
  onSave: (purchase: PurchaseEntry) => void;
  onCancel: () => void;
  generateSerialNumber: () => string;
  existingPurchases: PurchaseEntry[];
}

export const PurchaseForm = memo(function PurchaseForm({ purchaseData, customers, onSave, onCancel, generateSerialNumber, existingPurchases }: PurchaseFormProps) {
  const { toast } = useToast();
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [selectedCustomerForDisplay, setSelectedCustomerForDisplay] = useState<Customer | null>(null);
  const [currentSerialNo, setCurrentSerialNo] = useState('');
  
  const defaultValues = useMemo(() => {
    const baseValues: Partial<PurchaseEntryFormData> = {
      partyId: '',
      invoiceDate: new Date(),
      invoiceNo: '',
      items: [{ modelName: '', chassisNo: '', engineNo: '', colour: '', gst: 0, price: 0, id: uuidv4() }],
    };

    if (purchaseData) {
      const party = customers.find(c => c.id === purchaseData.partyId);
      return {
        ...baseValues,
        ...purchaseData,
        invoiceDate: purchaseData.invoiceDate ? parseISO(purchaseData.invoiceDate) : new Date(), // Use parseISO
        items: purchaseData.items.map(item => ({ ...item, id: item.id || uuidv4() })),
        partyName: party?.customerName,
        customerDetails: party ? {
            customerName: party.customerName,
            fatherName: party.fatherName,
            mobileNo: party.mobileNo,
            address: party.address,
            state: party.state,
            district: party.district,
            gstNo: party.gstNo,
            isRegistered: party.isRegistered,
            pincode: party.pincode,
        } : undefined,
      };
    }
    return baseValues;
  }, [purchaseData, customers]);


  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<PurchaseEntryFormData>({
    resolver: zodResolver(PurchaseEntrySchema),
    defaultValues: defaultValues as PurchaseEntryFormData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  
  useEffect(() => {
    if (purchaseData) {
        const party = customers.find(c => c.id === purchaseData.partyId);
        setSelectedCustomerForDisplay(party || null);
        setCurrentSerialNo(purchaseData.serialNo);
         reset({
            ...purchaseData,
            invoiceDate: purchaseData.invoiceDate ? parseISO(purchaseData.invoiceDate) : new Date(), // Use parseISO
            items: purchaseData.items.map(item => ({...item, id: item.id || uuidv4()})),
            customerDetails: party ? { 
                customerName: party.customerName, fatherName: party.fatherName, mobileNo: party.mobileNo, 
                address: party.address, state: party.state, district: party.district, 
                gstNo: party.gstNo, isRegistered: party.isRegistered, pincode: party.pincode,
            } : undefined,
            partyId: purchaseData.partyId, 
            partyName: party?.customerName, 
         });
    } else {
        const newSerial = generateSerialNumber();
        setCurrentSerialNo(newSerial);
        setSelectedCustomerForDisplay(null);
        reset({
            serialNo: newSerial,
            partyId: '',
            partyName: '',
            invoiceDate: new Date(),
            invoiceNo: '',
            items: [{ modelName: '', chassisNo: '', engineNo: '', colour: '', gst: 0, price: 0, id: uuidv4() }],
            customerDetails: undefined,
        });
    }
  }, [purchaseData, reset, customers, setValue, generateSerialNumber]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setValue('partyId', customer.id, { shouldValidate: true });
    setValue('partyName', customer.customerName);
    setValue('customerDetails', {
      customerName: customer.customerName,
      fatherName: customer.fatherName,
      mobileNo: customer.mobileNo,
      address: customer.address,
      state: customer.state,
      district: customer.district,
      gstNo: customer.gstNo,
      isRegistered: customer.isRegistered,
      pincode: customer.pincode,
    });
    setSelectedCustomerForDisplay(customer);
    setIsCustomerPopoverOpen(false);
  }, [setValue]);

  const onSubmitHandler = useCallback((data: PurchaseEntryFormData) => {
    const finalData: PurchaseEntry = {
      ...data,
      id: purchaseData?.id || uuidv4(),
      serialNo: currentSerialNo,
      partyName: selectedCustomerForDisplay?.customerName || data.partyName || '',
      createdAt: purchaseData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      invoiceDate: format(data.invoiceDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), 
      items: data.items.map(item => ({...item, id: item.id || uuidv4()})),
    };
    onSave(finalData);
  }, [purchaseData, currentSerialNo, selectedCustomerForDisplay, onSave]);

  const parsePotentiallyMissingNumericCell = (valueFromCell: any): number => {
    if (valueFromCell === undefined || valueFromCell === null) {
        return 0; 
    }
    const strValue = String(valueFromCell).trim();
    if (strValue === "") {
        return 0; 
    }
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num; 
  };
  
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          const importedItems: PurchaseItemFormData[] = json.map((row: any) => ({
            id: uuidv4(),
            modelName: String(row['Model Name'] || row['modelName'] || '').trim(),
            chassisNo: String(row['Chassis No'] || row['chassisNo'] || '').trim(),
            engineNo: String(row['Engine No'] || row['engineNo'] || '').trim(),
            colour: String(row['Colour'] || row['colour'] || '').trim(),
            gst: parsePotentiallyMissingNumericCell(row['GST'] || row['gst']),
            price: parsePotentiallyMissingNumericCell(row['Price'] || row['price']),
          })).filter(item => item.modelName && item.chassisNo && item.engineNo && item.colour); 
          
          if (importedItems.length > 0) {
             const currentItems = watch('items');
             const newItems = currentItems.length === 1 && !currentItems[0].modelName && !currentItems[0].chassisNo && !currentItems[0].engineNo
                              ? importedItems 
                              : [...currentItems, ...importedItems];
             setValue('items', newItems, { shouldValidate: true });
             toast({ title: "Items Imported", description: `${importedItems.length} items imported successfully.` });
          } else {
             toast({ title: "Import Failed", description: "No valid items found in the Excel file. Ensure required headers (Model Name, Chassis No, Engine No, Colour) are present and contain data. GST and Price are optional for import and will default to 0 if not provided.", variant: "destructive", duration: 9000 });
          }
        } catch (error) {
          console.error("Error importing Excel file:", error);
          toast({ title: "Import Error", description: "Failed to process the Excel file.", variant: "destructive" });
        }
      };
      reader.readAsBinaryString(file);
      if (event.target) { 
        event.target.value = '';
      }
    }
  }, [watch, setValue, toast, parsePotentiallyMissingNumericCell]);

  const customerDisplay = watch('customerDetails');

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6 flex flex-col h-full">
      <ScrollArea className="flex-grow pr-4"> 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
          <div className="md:col-span-1">
            <Label htmlFor="serialNo">Serial No.</Label>
            <Input id="serialNo" value={currentSerialNo} readOnly disabled className="bg-muted/50" />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="invoiceDate">Invoice Date <span className="text-destructive">*</span></Label>
            <Controller
              name="invoiceDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value instanceof Date ? field.value : undefined}
                      onSelect={(date) => field.onChange(date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.invoiceDate && <p className="text-sm text-destructive mt-1">{errors.invoiceDate.message}</p>}
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="invoiceNo">Invoice No. <span className="text-destructive">*</span></Label>
            <Input id="invoiceNo" {...register('invoiceNo')} placeholder="e.g. INV-2024-001" />
            {errors.invoiceNo && <p className="text-sm text-destructive mt-1">{errors.invoiceNo.message}</p>}
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="partyId">Party Name (Customer) <span className="text-destructive">*</span></Label>
            <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                 <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCustomerPopoverOpen}
                    className="w-full justify-between pl-3 pr-3"
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    {selectedCustomerForDisplay
                      ? selectedCustomerForDisplay.customerName
                      : "Select party..."}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search customer by name or mobile..." />
                  <CommandList>
                    <ScrollArea className="h-[200px]">
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.customerName} ${customer.mobileNo} ${customer.id}`}
                            onSelect={() => {
                              handleSelectCustomer(customer);
                            }}
                            className="cursor-pointer"
                          >
                            {customer.customerName} ({customer.mobileNo})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </ScrollArea>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.partyId && <p className="text-sm text-destructive mt-1">{errors.partyId.message}</p>}
          </div>
            
          {customerDisplay && (
            <div className="md:col-span-3 mt-2 p-4 border rounded-md bg-muted/50 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div><strong>Father:</strong> {customerDisplay.fatherName || 'N/A'}</div>
                <div><strong>Mobile:</strong> {customerDisplay.mobileNo}</div>
                <div className="md:col-span-2"><strong>Address:</strong> {`${customerDisplay.address}, ${customerDisplay.district}, ${customerDisplay.state}${customerDisplay.pincode ? ' - ' + customerDisplay.pincode : ''}`}</div>
                <div><strong>GST:</strong> {customerDisplay.gstNo || 'N/A'} ({customerDisplay.isRegistered ? 'Registered' : 'Non-Reg'})</div>
            </div>
          )}

          <div className="md:col-span-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Items</h3>
              <div className="flex items-center space-x-2">
                <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('excel-upload-purchase')?.click()}>
                  <FileSpreadsheet className="mr-2 h-4 w-4"/> Import Excel
                </Button>
                <input type="file" id="excel-upload-purchase" className="hidden" accept=".xlsx, .xls" onChange={handleFileImport} />
                <Button type="button" size="sm" onClick={() => append({ modelName: '', chassisNo: '', engineNo: '', colour: '', gst: 0, price: 0, id: uuidv4() })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
            </div>
            <ScrollArea className="border rounded-md"> 
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Model Name</TableHead>
                    <TableHead className="min-w-[170px]">Chassis No.</TableHead>
                    <TableHead className="min-w-[170px]">Engine No.</TableHead>
                    <TableHead className="min-w-[100px]">Colour</TableHead>
                    <TableHead className="min-w-[80px] text-right">GST (%)</TableHead>
                    <TableHead className="min-w-[100px] text-right">Price</TableHead>
                    <TableHead className="w-[60px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input {...register(`items.${index}.modelName`)} placeholder="e.g. Activa 6G" />
                        {errors.items?.[index]?.modelName && <p className="text-xs text-destructive mt-1">{errors.items[index]?.modelName?.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.chassisNo`)} placeholder="Chassis Number" />
                        {errors.items?.[index]?.chassisNo && <p className="text-xs text-destructive mt-1">{errors.items[index]?.chassisNo?.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.engineNo`)} placeholder="Engine Number" />
                         {errors.items?.[index]?.engineNo && <p className="text-xs text-destructive mt-1">{errors.items[index]?.engineNo?.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input {...register(`items.${index}.colour`)} placeholder="e.g. Red" />
                        {errors.items?.[index]?.colour && <p className="text-xs text-destructive mt-1">{errors.items[index]?.colour?.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input className="text-right" type="number" step="0.01" {...register(`items.${index}.gst`, { valueAsNumber: true })} placeholder="e.g. 18" />
                        {errors.items?.[index]?.gst && <p className="text-xs text-destructive mt-1">{errors.items[index]?.gst?.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input className="text-right" type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} placeholder="e.g. 75000" />
                         {errors.items?.[index]?.price && <p className="text-xs text-destructive mt-1">{errors.items[index]?.price?.message}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 ? remove(index) : toast({ title: "Cannot Remove", description: "At least one item is required.", variant: "destructive"})} disabled={fields.length <=1}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && errors.items.message && <p className="text-sm text-destructive mt-1">{errors.items.message}</p>}
            {Array.isArray(errors.items) && errors.items.length === 0 && (errors.items as any).message &&  <p className="text-sm text-destructive mt-1">{(errors.items as any).message}</p>}
          </div>
        </div>
      </ScrollArea>
      <div className="flex justify-end space-x-3 pt-4 border-t mt-auto">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{purchaseData ? 'Update Purchase' : 'Save Purchase'}</Button>
      </div>
    </form>
  );
});

