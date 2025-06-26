
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceSettingsForm } from '@/components/modules/settings/invoice-settings-form';
import { CompanyProfileForm } from '@/components/modules/settings/company-profile-form';
import { BackupRestore } from '@/components/modules/settings/backup-restore';
import { GeneralSettingsForm } from '@/components/modules/settings/general-settings-form';
import type { InvoiceSettings, CompanyProfile, GeneralSettings } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_INVOICE_SETTINGS, DEFAULT_COMPANY_PROFILE, DEFAULT_GENERAL_SETTINGS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [invoiceSettings, setInvoiceSettings] = useLocalStorage<InvoiceSettings>(
    LOCAL_STORAGE_KEYS.SETTINGS,
    DEFAULT_INVOICE_SETTINGS
  );
  const [companyProfile, setCompanyProfile] = useLocalStorage<CompanyProfile | null>(
    LOCAL_STORAGE_KEYS.COMPANY_PROFILE,
    DEFAULT_COMPANY_PROFILE 
  );
  const [generalSettings, setGeneralSettings] = useLocalStorage<GeneralSettings>(
    LOCAL_STORAGE_KEYS.GENERAL_SETTINGS,
    DEFAULT_GENERAL_SETTINGS
  );
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      applyTheme(generalSettings.theme);
    }
  }, [generalSettings.theme, isMounted]);

  const applyTheme = (theme: 'system' | 'light' | 'dark') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const handleSaveInvoiceSettings = (settings: InvoiceSettings) => {
    setInvoiceSettings(settings);
    toast({
      title: "Invoice Settings Saved",
      description: "Your invoice numbering and optional field preferences have been updated.",
    });
  };

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    toast({
      title: "Company Profile Saved",
      description: "Your company details have been updated.",
    });
  };

  const handleSaveGeneralSettings = (settings: GeneralSettings) => {
    setGeneralSettings(settings);
    applyTheme(settings.theme);
    toast({
      title: "General Settings Saved",
      description: "Your application preferences have been updated.",
    });
  };

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Configure application settings and preferences." />
        <Card>
          <CardHeader>
            <CardTitle>Loading Settings...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while settings are being loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure application settings and preferences." />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="backup_restore">Backup &amp; Restore</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <Card>
                <CardHeader>
                    <CardTitle>General Application Settings</CardTitle>
                    <CardDescription>
                        Manage theme preferences and default list sizes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GeneralSettingsForm
                        settings={generalSettings}
                        onSave={handleSaveGeneralSettings}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>
                Customize invoice numbering, optional fields, and other invoice-related behaviors here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InvoiceSettingsForm
                settings={invoiceSettings}
                onSave={handleSaveInvoiceSettings}
              />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="company">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Manage your company's details, address, and financial year information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-grow">
              <CompanyProfileForm
                profile={companyProfile}
                onSave={handleSaveCompanyProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup_restore">
          <Card>
            <CardHeader>
              <CardTitle>Data Backup &amp; Restore</CardTitle>
              <CardDescription>
                Manage your application data backups. Download all data or restore from a backup file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BackupRestore />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

