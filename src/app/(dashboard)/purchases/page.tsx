
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PurchaseList } from '@/components/modules/purchase/purchase-list';
import { PurchaseForm } from '@/components/modules/purchase/purchase-form';
import { type PurchaseEntry, type Customer, type StockItem } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

const MemoizedPurchaseList = React.memo(PurchaseList);
const MemoizedPurchaseForm = React.memo(PurchaseForm);

export default function PurchasesPage() {
  const [allPurchases, setAllPurchases] = useLocalStorage<PurchaseEntry[]>(LOCAL_STORAGE_KEYS.PURCHASES, []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const [stock, setStock] = useLocalStorage<StockItem[]>(LOCAL_STORAGE_KEYS.STOCK, []);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const generateSerialNumber = useCallback(() => {
    const lastPurchase = allPurchases.length > 0 ? allPurchases[allPurchases.length -1] : null;
    let nextNum = 1;
    if(lastPurchase && lastPurchase.serialNo.startsWith('PUR-')) {
      const numPart = parseInt(lastPurchase.serialNo.substring(4), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }
    return `PUR-${String(nextNum).padStart(5, '0')}`;
  }, [allPurchases]);

  const updateStock = useCallback((purchaseEntry: PurchaseEntry) => {
    setStock(prevStock => {
      const stockWithoutOldItems = prevStock.filter(item => item.purchaseEntryId !== purchaseEntry.id);
      const newStockItems: StockItem[] = purchaseEntry.items.map(item => ({
        id: uuidv4(),
        purchaseEntryId: purchaseEntry.id,
        purchaseItemId: item.id,
        modelName: item.modelName,
        chassisNo: item.chassisNo,
        engineNo: item.engineNo,
        colour: item.colour,
        gst: item.gst,
        price: item.price,
        purchaseDate: purchaseEntry.invoiceDate, 
        sold: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return [...stockWithoutOldItems, ...newStockItems];
    });
  }, [setStock]);

  const handleSavePurchase = useCallback((purchaseData: PurchaseEntry) => {
    const now = new Date().toISOString();
    let savedPurchase: PurchaseEntry;

    if (selectedPurchase) {
      savedPurchase = { ...purchaseData, id: selectedPurchase.id, updatedAt: now };
      setAllPurchases(prev => prev.map(p => p.id === savedPurchase.id ? savedPurchase : p));
      toast({ title: "Purchase Updated", description: `Purchase ${savedPurchase.serialNo} has been updated.` });
    } else {
      const purchaseId = uuidv4();
      savedPurchase = {
        ...purchaseData,
        id: purchaseId,
        serialNo: purchaseData.serialNo || generateSerialNumber(),
        createdAt: now,
        updatedAt: now,
      };
      setAllPurchases(prev => [...prev, savedPurchase]);
      toast({ title: "Purchase Saved", description: `Purchase ${savedPurchase.serialNo} has been saved.` });
    }
    updateStock(savedPurchase);
    setSelectedPurchase(null);
    setIsFormOpen(false);
  }, [selectedPurchase, setAllPurchases, toast, generateSerialNumber, updateStock]);

  const handleEditPurchase = useCallback((purchase: PurchaseEntry) => {
    setSelectedPurchase(purchase);
    setIsFormOpen(true);
  }, []);

  const handleDeletePurchase = useCallback((purchaseId: string) => {
    setStock(prevStock => prevStock.filter(item => item.purchaseEntryId !== purchaseId));
    setAllPurchases(prev => prev.filter(p => p.id !== purchaseId));
    toast({ title: "Purchase Deleted", description: "The purchase entry and associated stock items have been deleted.", variant: "destructive" });
  }, [setStock, setAllPurchases, toast]);

  const openFormForNew = useCallback(() => {
    setSelectedPurchase(null);
    setIsFormOpen(true);
  }, []);
  
  const handleCancelForm = useCallback(() => {
    setSelectedPurchase(null);
    setIsFormOpen(false);
  }, []);

  const handleExcelImport = useCallback(async () => {
    toast({
      title: 'Excel Import (WIP)',
      description: 'This feature is under construction. Please add items manually for now.',
    });
  }, [toast]);

  const displayedPurchases = useMemo(() => {
    if (!isMounted) return [];

    let filtered = [...allPurchases];

    if (filterStartDate) {
      const startDate = startOfDay(parseISO(filterStartDate));
      if (isValid(startDate)) {
        filtered = filtered.filter(item => {
          const itemInvoiceDate = parseISO(item.invoiceDate);
          return isValid(itemInvoiceDate) && itemInvoiceDate >= startDate;
        });
      }
    }

    if (filterEndDate) {
      const endDate = endOfDay(parseISO(filterEndDate));
      if (isValid(endDate)) {
        filtered = filtered.filter(item => {
          const itemInvoiceDate = parseISO(item.invoiceDate);
          return isValid(itemInvoiceDate) && itemInvoiceDate <= endDate;
        });
      }
    }
    return filtered;
  }, [allPurchases, isMounted, filterStartDate, filterEndDate]);


  if (!isMounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchases" description="Manage your purchase entries.">
           <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Purchase
          </Button>
        </PageHeader>
        <p>Loading purchase data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" description="Manage vehicle purchase entries and inventory additions.">
        <div className="flex items-end space-x-2">
           <div>
            <Label htmlFor="filterStartDatePurchase" className="text-xs">Invoice Date From:</Label>
            <Input 
              type="date" 
              id="filterStartDatePurchase"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="filterEndDatePurchase" className="text-xs">Invoice Date To:</Label>
            <Input 
              type="date" 
              id="filterEndDatePurchase"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-9"
            />
          </div>
          <Button onClick={handleExcelImport} variant="outline" disabled className="h-9">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Import (WIP)
          </Button>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) {
                setSelectedPurchase(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openFormForNew} className="h-9">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full h-full max-w-none max-h-none sm:w-[90vw] md:w-[85vw] lg:w-[75vw] xl:w-[70vw] sm:max-h-[90vh] flex flex-col p-0 sm:p-2 md:p-4 sm:rounded-lg overflow-hidden">
              <DialogHeader className="p-4 sm:p-2 md:p-2 border-b">
                <DialogTitle>{selectedPurchase ? `Edit Purchase Entry - ${selectedPurchase.serialNo}` : 'Add New Purchase Entry'}</DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-hidden">
                <MemoizedPurchaseForm
                  purchaseData={selectedPurchase}
                  customers={customers}
                  onSave={handleSavePurchase}
                  onCancel={handleCancelForm}
                  generateSerialNumber={generateSerialNumber}
                  existingPurchases={allPurchases}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <MemoizedPurchaseList
        purchases={displayedPurchases}
        onEdit={handleEditPurchase}
        onDelete={handleDeletePurchase}
      />
    </div>
  );
}

