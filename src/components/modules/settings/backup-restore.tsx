
"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LOCAL_STORAGE_KEYS, DEFAULT_COMPANY_PROFILE, DEFAULT_INVOICE_SETTINGS } from '@/lib/constants';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DATA_KEYS_TO_BACKUP = [
  LOCAL_STORAGE_KEYS.CUSTOMERS,
  LOCAL_STORAGE_KEYS.PURCHASES,
  LOCAL_STORAGE_KEYS.STOCK,
  LOCAL_STORAGE_KEYS.INVOICES,
  LOCAL_STORAGE_KEYS.SETTINGS,
  LOCAL_STORAGE_KEYS.COMPANY_PROFILE,
];

// Helper to get default values for each key in case they are not set in localStorage
const getDefaultValueForKey = (key: string) => {
  switch (key) {
    case LOCAL_STORAGE_KEYS.CUSTOMERS:
    case LOCAL_STORAGE_KEYS.PURCHASES:
    case LOCAL_STORAGE_KEYS.STOCK:
    case LOCAL_STORAGE_KEYS.INVOICES:
      return [];
    case LOCAL_STORAGE_KEYS.SETTINGS:
      return DEFAULT_INVOICE_SETTINGS;
    case LOCAL_STORAGE_KEYS.COMPANY_PROFILE:
      return DEFAULT_COMPANY_PROFILE;
    default:
      return null;
  }
};


export function BackupRestore() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);

  const handleBackup = () => {
    try {
      const backupData: { [key: string]: any } = {};
      DATA_KEYS_TO_BACKUP.forEach(key => {
        const item = localStorage.getItem(key);
        backupData[key] = item ? JSON.parse(item) : getDefaultValueForKey(key);
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const formattedDate = format(new Date(), 'yyyyMMdd_HHmmss');
      link.download = `auto_sales_backup_${formattedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Successful',
        description: 'All application data has been downloaded.',
      });
    } catch (error) {
      console.error("Backup failed:", error);
      toast({
        title: 'Backup Failed',
        description: 'Could not generate backup file. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a .json backup file.',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setBackupFileContent(text);
        setIsRestoreConfirmOpen(true); // Open confirmation dialog
      };
      reader.readAsText(file);
    }
  };

  const proceedWithRestore = () => {
    if (!backupFileContent) {
      toast({ title: 'Restore Error', description: 'No backup file content to restore.', variant: 'destructive' });
      return;
    }

    try {
      const parsedData = JSON.parse(backupFileContent);
      
      // Basic validation: check if all expected keys are present
      const missingKeys = DATA_KEYS_TO_BACKUP.filter(key => !(key in parsedData));
      if (missingKeys.length > 0) {
        toast({
          title: 'Invalid Backup File',
          description: `The backup file is missing data for: ${missingKeys.join(', ')}. Restore aborted.`,
          variant: 'destructive',
          duration: 7000,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setBackupFileContent(null);
        return;
      }

      // Clear existing data and restore
      DATA_KEYS_TO_BACKUP.forEach(key => {
        localStorage.setItem(key, JSON.stringify(parsedData[key]));
      });

      toast({
        title: 'Restore Successful',
        description: 'Data has been restored. Please RELOAD the application for changes to take full effect.',
        duration: 10000, // Keep message longer to ensure user sees reload instruction
      });
    } catch (error) {
      console.error("Restore failed:", error);
      toast({
        title: 'Restore Failed',
        description: 'Could not restore data from file. Ensure it is a valid backup. Check console for details.',
        variant: 'destructive',
      });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input in all cases
        setBackupFileContent(null); // Clear stored content
        setIsRestoreConfirmOpen(false); // Close dialog
    }
  };


  return (
    <div className="space-y-6">
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800">Important Information</h4>
          <p className="text-sm text-yellow-700">
            Backups include all your application data (Customers, Purchases, Stock, Invoices, Settings, and Company Profile).
            Restoring from a backup file will <strong className="font-bold">overwrite all existing data</strong> in the application.
            It is recommended to download a fresh backup before restoring.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Download className="mr-2 h-5 w-5" /> Download Full Backup</CardTitle>
            <CardDescription>Download all your application data as a single JSON file.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} className="w-full">
              Download Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Upload className="mr-2 h-5 w-5" /> Restore from Backup</CardTitle>
            <CardDescription>Restore application data from a previously downloaded JSON backup file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="backupFile" className="sr-only">Select backup file</Label>
            <Input
              id="backupFile"
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
             <p className="text-xs text-muted-foreground">
              Select the .json backup file from your computer.
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore data from the selected backup file? 
              <strong className="font-bold text-destructive"> This action will overwrite all current application data and cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input on cancel
              setBackupFileContent(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithRestore} className="bg-destructive hover:bg-destructive/90">
              Yes, Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
