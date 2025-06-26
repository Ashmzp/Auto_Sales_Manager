
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InvoiceSettingsSchema, type InvoiceSettingsFormData } from '@/lib/schemas';
import type { InvoiceSettings } from '@/types';
import { DEFAULT_INVOICE_SETTINGS } from '@/lib/constants';

interface InvoiceSettingsFormProps {
  settings: InvoiceSettings;
  onSave: (settings: InvoiceSettings) => void;
}

export function InvoiceSettingsForm({ settings, onSave }: InvoiceSettingsFormProps) {
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(InvoiceSettingsSchema),
    defaultValues: settings || DEFAULT_INVOICE_SETTINGS,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = (data: InvoiceSettingsFormData) => {
    onSave(data);
    reset(data); 
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="registeredPrefix">Registered Party Invoice Prefix</Label>
          <Input id="registeredPrefix" {...register('registeredPrefix')} />
          {errors.registeredPrefix && <p className="text-sm text-destructive mt-1">{errors.registeredPrefix.message}</p>}
        </div>
        <div>
          <Label htmlFor="nextRegisteredSerialNo">Next Registered Serial No.</Label>
          <Input id="nextRegisteredSerialNo" type="number" {...register('nextRegisteredSerialNo', { valueAsNumber: true })} />
          {errors.nextRegisteredSerialNo && <p className="text-sm text-destructive mt-1">{errors.nextRegisteredSerialNo.message}</p>}
        </div>
        <div>
          <Label htmlFor="nonRegisteredPrefix">Non-Registered Party Invoice Prefix</Label>
          <Input id="nonRegisteredPrefix" {...register('nonRegisteredPrefix')} />
          {errors.nonRegisteredPrefix && <p className="text-sm text-destructive mt-1">{errors.nonRegisteredPrefix.message}</p>}
        </div>
        <div>
          <Label htmlFor="nextNonRegisteredSerialNo">Next Non-Registered Serial No.</Label>
          <Input id="nextNonRegisteredSerialNo" type="number" {...register('nextNonRegisteredSerialNo', { valueAsNumber: true })} />
          {errors.nextNonRegisteredSerialNo && <p className="text-sm text-destructive mt-1">{errors.nextNonRegisteredSerialNo.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-medium">Optional Fields in Invoice Form / Display on Invoice</h3>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableCashOrHypothecation"
            control={control}
            render={({ field }) => <Switch id="enableCashOrHypothecation" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableCashOrHypothecation">Enable Cash/Hypothecation Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableOnRoadPrice"
            control={control}
            render={({ field }) => <Switch id="enableOnRoadPrice" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableOnRoadPrice">Enable On Road Price Field (Invoice Form)</Label>
        </div>
         <div className="flex items-center space-x-2">
          <Controller
            name="enableScheme"
            control={control}
            render={({ field }) => <Switch id="enableScheme" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableScheme">Enable Scheme Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableInsurance"
            control={control}
            render={({ field }) => <Switch id="enableInsurance" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableInsurance">Enable Insurance Amount Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableRegistration"
            control={control}
            render={({ field }) => <Switch id="enableRegistration" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableRegistration">Enable Registration Amount Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableAccessories"
            control={control}
            render={({ field }) => <Switch id="enableAccessories" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableAccessories">Enable Accessories Amount Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableSalesPerson"
            control={control}
            render={({ field }) => <Switch id="enableSalesPerson" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableSalesPerson">Enable Sales Person Name Field (Invoice Form)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableAadharNo"
            control={control}
            render={({ field }) => <Switch id="enableAadharNo" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableAadharNo">Enable Aadhar No. Field (Invoice Form & PDF)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableNomineeName"
            control={control}
            render={({ field }) => <Switch id="enableNomineeName" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableNomineeName">Enable Nominee Name Field (Invoice Form & PDF)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableRTO"
            control={control}
            render={({ field }) => <Switch id="enableRTO" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableRTO">Enable RTO Field (Invoice Form & PDF)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="enableCustomerDOBDisplay"
            control={control}
            render={({ field }) => <Switch id="enableCustomerDOBDisplay" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="enableCustomerDOBDisplay">Enable Customer DOB Display (PDF & Excel)</Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty}>Save Invoice Settings</Button>
      </div>
    </form>
  );
}

