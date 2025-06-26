
"use client";

import React, { useEffect, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomerSchema, type CustomerFormData as CustomerFormSchemaType } from '@/lib/schemas';
import { type Customer } from '@/types';
import { INDIAN_STATES } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, parseISO } from "date-fns";
import { CalendarIcon } from 'lucide-react';

interface CustomerFormProps {
  customerData?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  defaultStateFromCompany?: string | null;
  defaultDistrictFromCompany?: string | null;
}

export const CustomerForm = memo(function CustomerForm({ 
  customerData, 
  onSave, 
  onCancel,
  defaultStateFromCompany,
  defaultDistrictFromCompany 
}: CustomerFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<CustomerFormSchemaType>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: customerData ? {
      ...customerData,
      gstNo: customerData.gstNo || '', 
      pincode: customerData.pincode || '',
      dob: customerData.dob ? parseISO(customerData.dob) : null,
    } : {
      customerName: '',
      fatherName: '',
      mobileNo: '',
      address: '',
      state: defaultStateFromCompany || '',
      district: defaultDistrictFromCompany || '',
      gstNo: '',
      pincode: '',
      dob: null,
    },
  });

  useEffect(() => {
    if (customerData) {
      reset({
        ...customerData,
        gstNo: customerData.gstNo || '',
        pincode: customerData.pincode || '',
        dob: customerData.dob ? parseISO(customerData.dob) : null,
      });
    } else {
      reset({
        customerName: '',
        fatherName: '',
        mobileNo: '',
        address: '',
        state: defaultStateFromCompany || '',
        district: defaultDistrictFromCompany || '',
        gstNo: '',
        pincode: '',
        dob: null,
      });
    }
  }, [customerData, reset, defaultStateFromCompany, defaultDistrictFromCompany]);

  const onSubmit = (data: CustomerFormSchemaType) => {
    const now = new Date().toISOString();
    const isRegistered = !!data.gstNo && data.gstNo.trim() !== '';
    
    const finalData: Customer = {
      ...data,
      id: customerData?.id || uuidv4(),
      isRegistered,
      gstNo: data.gstNo?.trim() === '' ? undefined : data.gstNo,
      pincode: data.pincode?.trim() === '' ? undefined : data.pincode,
      dob: data.dob ? format(data.dob, 'yyyy-MM-dd') : undefined,
      createdAt: customerData?.createdAt || now,
      updatedAt: now,
    };
    onSave(finalData);
    toast({
      title: `Customer ${customerData ? 'updated' : 'saved'} successfully!`,
      description: `${finalData.customerName} has been ${customerData ? 'updated' : 'added'}.`,
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ScrollArea className="max-h-[70vh] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div>
            <Label htmlFor="customerName">Customer Name <span className="text-destructive">*</span></Label>
            <Input id="customerName" {...register('customerName')} placeholder="e.g. John Doe" />
            {errors.customerName && <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>}
          </div>

          <div>
            <Label htmlFor="fatherName">Father Name (Optional)</Label>
            <Input id="fatherName" {...register('fatherName')} placeholder="e.g. Richard Doe" />
            {errors.fatherName && <p className="text-sm text-destructive mt-1">{errors.fatherName.message}</p>}
          </div>

          <div>
            <Label htmlFor="mobileNo">Mobile No. <span className="text-destructive">*</span></Label>
            <Input id="mobileNo" {...register('mobileNo')} type="tel" placeholder="e.g. 9876543210" />
            {errors.mobileNo && <p className="text-sm text-destructive mt-1">{errors.mobileNo.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="dob">Date of Birth (Optional)</Label>
            <Controller
                name="dob"
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
                                selected={field.value}
                                onSelect={field.onChange}
                                captionLayout="dropdown-buttons"
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )}
            />
            {errors.dob && <p className="text-sm text-destructive mt-1">{errors.dob.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
            <Input id="address" {...register('address')} placeholder="e.g. 123 Main St, Anytown" />
            {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
          </div>

          <div>
            <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
            <Input id="district" {...register('district')} placeholder="e.g. Anytown District" />
            {errors.district && <p className="text-sm text-destructive mt-1">{errors.district.message}</p>}
          </div>

          <div>
            <Label htmlFor="pincode">Pincode (Optional)</Label>
            <Input id="pincode" {...register('pincode')} placeholder="e.g. 123456" />
            {errors.pincode && <p className="text-sm text-destructive mt-1">{errors.pincode.message}</p>}
          </div>

          <div>
            <Label htmlFor="gstNo">GST No. (Optional - marks as Registered Party)</Label>
            <Input id="gstNo" {...register('gstNo')} placeholder="e.g. 29AABBCCDDE1ZZA (15 chars)" />
            {errors.gstNo && <p className="text-sm text-destructive mt-1">{errors.gstNo.message}</p>}
          </div>
        </div>
      </ScrollArea>
      <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{customerData ? 'Update Customer' : 'Save Customer'}</Button>
      </div>
    </form>
  );
});

