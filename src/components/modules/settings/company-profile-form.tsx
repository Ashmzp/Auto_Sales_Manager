
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompanyProfileSchema, type CompanyProfileFormData } from '@/lib/schemas';
import type { CompanyProfile } from '@/types';
import { INDIAN_STATES, DEFAULT_COMPANY_PROFILE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, parseISO } from "date-fns";
import { CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompanyProfileFormProps {
  profile: CompanyProfile | null;
  onSave: (profile: CompanyProfileFormData) => void;
}

export function CompanyProfileForm({ profile, onSave }: CompanyProfileFormProps) {
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: profile ? {
      ...profile,
      financialYearStart: profile.financialYearStart ? parseISO(profile.financialYearStart as unknown as string) : null,
      financialYearEnd: profile.financialYearEnd ? parseISO(profile.financialYearEnd as unknown as string) : null,
      termsAndConditions: profile.termsAndConditions || DEFAULT_COMPANY_PROFILE.termsAndConditions,
    } : {
      ...DEFAULT_COMPANY_PROFILE,
      district: DEFAULT_COMPANY_PROFILE.district, // ensure district is included
      financialYearStart: null,
      financialYearEnd: null,
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        ...profile,
        financialYearStart: profile.financialYearStart ? parseISO(profile.financialYearStart as unknown as string) : null,
        financialYearEnd: profile.financialYearEnd ? parseISO(profile.financialYearEnd as unknown as string) : null,
        termsAndConditions: profile.termsAndConditions || DEFAULT_COMPANY_PROFILE.termsAndConditions,
      });
    } else {
       reset({
        ...DEFAULT_COMPANY_PROFILE,
        district: DEFAULT_COMPANY_PROFILE.district, // ensure district is included
        financialYearStart: null,
        financialYearEnd: null,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: CompanyProfileFormData) => {
    const dataToSave = {
        ...data,
        financialYearStart: data.financialYearStart ? data.financialYearStart.toISOString() : null,
        financialYearEnd: data.financialYearEnd ? data.financialYearEnd.toISOString() : null,
    };
    onSave(dataToSave as unknown as CompanyProfileFormData);
    reset({
        ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 flex flex-col h-full">
      <ScrollArea className="flex-grow pr-4"> {/* Changed from max-h-[65vh] */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
          <div>
            <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
            <Input id="companyName" {...register('companyName')} />
            {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>}
          </div>
          <div>
            <Label htmlFor="legalName">Legal Name <span className="text-destructive">*</span></Label>
            <Input id="legalName" {...register('legalName')} />
            {errors.legalName && <p className="text-sm text-destructive mt-1">{errors.legalName.message}</p>}
          </div>
          <div>
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input id="gstNumber" {...register('gstNumber')} />
            {errors.gstNumber && <p className="text-sm text-destructive mt-1">{errors.gstNumber.message}</p>}
          </div>
          <div>
            <Label htmlFor="panNumber">PAN Number <span className="text-destructive">*</span></Label>
            <Input id="panNumber" {...register('panNumber')} />
            {errors.panNumber && <p className="text-sm text-destructive mt-1">{errors.panNumber.message}</p>}
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="address">Company Address <span className="text-destructive">*</span></Label>
            <Textarea id="address" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="state"><SelectValue placeholder="Select State" /></SelectTrigger>
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
            <Input id="district" {...register('district')} />
            {errors.district && <p className="text-sm text-destructive mt-1">{errors.district.message}</p>}
          </div>
          <div>
            <Label htmlFor="pincode">Pincode / ZIP Code <span className="text-destructive">*</span></Label>
            <Input id="pincode" {...register('pincode')} />
            {errors.pincode && <p className="text-sm text-destructive mt-1">{errors.pincode.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Company Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <Label htmlFor="website">Company Website (Optional)</Label>
            <Input id="website" {...register('website')} placeholder="https://example.com" />
            {errors.website && <p className="text-sm text-destructive mt-1">{errors.website.message}</p>}
          </div>
          <div>
            <Label htmlFor="logoUrl">Company Logo URL (Optional)</Label>
            <Input id="logoUrl" {...register('logoUrl')} placeholder="https://example.com/logo.png" />
            {errors.logoUrl && <p className="text-sm text-destructive mt-1">{errors.logoUrl.message}</p>}
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="bankDetails">Bank Details (for invoice footer) <span className="text-destructive">*</span></Label>
            <Textarea id="bankDetails" {...register('bankDetails')} />
            {errors.bankDetails && <p className="text-sm text-destructive mt-1">{errors.bankDetails.message}</p>}
          </div>
          <div>
            <Label htmlFor="signatureUrl">Authorized Signature URL (Optional)</Label>
            <Input id="signatureUrl" {...register('signatureUrl')} placeholder="https://example.com/signature.png" />
            {errors.signatureUrl && <p className="text-sm text-destructive mt-1">{errors.signatureUrl.message}</p>}
          </div>
          <div>
            <Label htmlFor="financialYearStart">Financial Year Start Date <span className="text-destructive">*</span></Label>
            <Controller name="financialYearStart" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
            )} />
            {errors.financialYearStart && <p className="text-sm text-destructive mt-1">{errors.financialYearStart.message}</p>}
          </div>
          <div>
            <Label htmlFor="financialYearEnd">Financial Year End Date <span className="text-destructive">*</span></Label>
            <Controller name="financialYearEnd" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
            )} />
            {errors.financialYearEnd && <p className="text-sm text-destructive mt-1">{errors.financialYearEnd.message}</p>}
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="termsAndConditions">Terms &amp; Conditions (one per line)</Label>
            <Textarea id="termsAndConditions" {...register('termsAndConditions')} rows={5} />
            {errors.termsAndConditions && <p className="text-sm text-destructive mt-1">{errors.termsAndConditions.message}</p>}
          </div>
        </div>
      </ScrollArea>
      <div className="flex justify-end pt-4 border-t mt-auto">
        <Button type="submit" disabled={!isDirty}>Save Company Profile</Button>
      </div>
    </form>
  );
}
