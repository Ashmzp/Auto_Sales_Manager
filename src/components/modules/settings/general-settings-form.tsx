
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneralSettingsSchema, type GeneralSettingsFormData } from '@/lib/schemas';
import type { GeneralSettings } from '@/types';
import { DEFAULT_GENERAL_SETTINGS } from '@/lib/constants';
import { Sun, Moon, Laptop } from 'lucide-react';

interface GeneralSettingsFormProps {
  settings: GeneralSettings;
  onSave: (settings: GeneralSettings) => void;
}

export function GeneralSettingsForm({ settings, onSave }: GeneralSettingsFormProps) {
  const { handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: settings || DEFAULT_GENERAL_SETTINGS,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = (data: GeneralSettingsFormData) => {
    onSave(data);
    reset(data); 
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="theme">Application Theme</Label>
          <Controller
            name="theme"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Laptop className="mr-2 h-4 w-4" /> System
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="mr-2 h-4 w-4" /> Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" /> Dark
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.theme && <p className="text-sm text-destructive mt-1">{errors.theme.message}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Choose how the application looks. &apos;System&apos; will follow your OS preference.
          </p>
        </div>
        
        <div>
          <Label htmlFor="defaultItemsPerPage">Default Items Per Page</Label>
          <Controller
            name="defaultItemsPerPage"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} defaultValue={String(field.value)}>
                <SelectTrigger id="defaultItemsPerPage">
                  <SelectValue placeholder="Select default count" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 25, 30, 50, 100].map(num => (
                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.defaultItemsPerPage && <p className="text-sm text-destructive mt-1">{errors.defaultItemsPerPage.message}</p>}
           <p className="text-xs text-muted-foreground mt-1">
            Set the default number of items shown in paginated lists.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty}>Save General Settings</Button>
      </div>
    </form>
  );
}
