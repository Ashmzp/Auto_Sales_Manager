
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StockList } from '@/components/modules/stock/stock-list';
import { type StockItem } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays, isValid, startOfDay, endOfDay } from 'date-fns';

const MemoizedStockList = React.memo(StockList);

export default function StockPage() {
  const [stockItemsFromStorage] = useLocalStorage<StockItem[]>(LOCAL_STORAGE_KEYS.STOCK, []);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [currentClientDate, setCurrentClientDate] = useState<Date | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  const [listFilteredStockItems, setListFilteredStockItems] = useState<(StockItem & { stockInDays: number })[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setCurrentClientDate(new Date());
  }, []);

  const calculateStockInDays = useCallback((purchaseDateString: string): number => {
    if (!currentClientDate) return 0;
    const purchaseDate = parseISO(purchaseDateString);
    if (!isValid(purchaseDate)) return 0;
    return differenceInDays(currentClientDate, purchaseDate);
  },[currentClientDate]);
  
  const dateFilteredStockItems = useMemo(() => {
    if (!isMounted || !currentClientDate) return [];

    let filtered = stockItemsFromStorage.filter(item => !item.sold);

    if (filterStartDate) {
      const startDate = startOfDay(parseISO(filterStartDate));
      if (isValid(startDate)) {
        filtered = filtered.filter(item => {
          const itemPurchaseDate = parseISO(item.purchaseDate);
          return isValid(itemPurchaseDate) && itemPurchaseDate >= startDate;
        });
      }
    }

    if (filterEndDate) {
      const endDate = endOfDay(parseISO(filterEndDate));
      if (isValid(endDate)) {
        filtered = filtered.filter(item => {
          const itemPurchaseDate = parseISO(item.purchaseDate);
          return isValid(itemPurchaseDate) && itemPurchaseDate <= endDate;
        });
      }
    }
    
    return filtered.map(item => ({
        ...item,
        stockInDays: calculateStockInDays(item.purchaseDate),
      }));
  }, [stockItemsFromStorage, isMounted, currentClientDate, calculateStockInDays, filterStartDate, filterEndDate]);

  const handleFilteredItemsChange = useCallback((items: (StockItem & { stockInDays: number })[]) => {
    setListFilteredStockItems(items);
  }, []);

  const handleStockExcelExport = useCallback(async () => {
    if (!listFilteredStockItems || listFilteredStockItems.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no stock items currently displayed to export.',
        variant: 'destructive',
      });
      return;
    }
    
    const XLSX = await import('xlsx');
    const dataForExcel = listFilteredStockItems.map(item => ({
      'Model Name': item.modelName,
      'Chassis Number': item.chassisNo,
      'Engine Number': item.engineNo,
      'Colour': item.colour,
      'GST (%)': item.gst,
      'Price (INR)': item.price,
      'Purchase Date': isValid(parseISO(item.purchaseDate)) ? format(parseISO(item.purchaseDate), 'yyyy-MM-dd') : 'Invalid Date',
      'Stock in Days': item.stockInDays,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AvailableStock');
    
    const columnWidths = Object.keys(dataForExcel[0] || {}).map(key => ({
        wch: Math.max(...dataForExcel.map(row => String(row[key as keyof typeof row] ?? '').length), key.length) + 2 
    }));
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `Available_Stock_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    toast({
        title: 'Export Successful',
        description: 'Filtered stock report has been downloaded as an Excel file.',
    });
  }, [listFilteredStockItems, toast]);


  if (!isMounted) {
    return (
       <div className="space-y-6">
        <PageHeader title="Stock" description="View and manage your current vehicle inventory." />
        <Card>
          <CardHeader>
            <CardTitle>Stock List</CardTitle>
            <CardDescription>Loading stock data...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while stock data is being loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description="View and manage your current available vehicle inventory.">
        <div className="flex items-end space-x-2">
          <div>
            <Label htmlFor="filterStartDate" className="text-xs">Purchase Date From:</Label>
            <Input 
              type="date" 
              id="filterStartDate"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="filterEndDate" className="text-xs">Purchase Date To:</Label>
            <Input 
              type="date" 
              id="filterEndDate"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-9"
            />
          </div>
          <Button onClick={handleStockExcelExport} variant="outline" className="h-9">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
        </div>
      </PageHeader>
      <MemoizedStockList 
        stockItems={dateFilteredStockItems} 
        totalAvailableItemsCount={dateFilteredStockItems.length}
        onFilteredItemsChange={handleFilteredItemsChange} 
      />
    </div>
  );
}

