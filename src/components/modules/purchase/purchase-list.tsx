
"use client";

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { type PurchaseEntry, type GeneralSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Search, ArrowUpDown, ColumnsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isValid } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_GENERAL_SETTINGS } from '@/lib/constants';

interface PurchaseListProps {
  purchases: PurchaseEntry[];
  onEdit: (purchase: PurchaseEntry) => void;
  onDelete: (purchaseId: string) => void;
}

const ALL_PURCHASE_COLUMNS = [
  { id: 'serialNo', label: 'Serial No.', defaultVisible: true, sortable: true, className: "w-[12%] min-w-[100px]" },
  { id: 'partyName', label: 'Party Name', defaultVisible: true, sortable: true, className: "w-[18%] min-w-[150px]" },
  { id: 'invoiceDate', label: 'Inv. Date', defaultVisible: true, sortable: true, className: "w-[12%] min-w-[100px]" },
  { id: 'invoiceNo', label: 'Inv. No.', defaultVisible: true, sortable: true, className: "w-[12%] min-w-[100px]" },
  { id: 'itemsCount', label: 'Items', defaultVisible: true, sortable: false, className: "w-[8%] min-w-[60px] text-center" },
  { id: 'totalValue', label: 'Total Value (₹)', defaultVisible: true, sortable: true, className: "w-[15%] min-w-[120px] text-right" },
] as const;

type PurchaseColumnId = typeof ALL_PURCHASE_COLUMNS[number]['id'];
type SortablePurchaseColumnId = Extract<PurchaseColumnId, 'serialNo' | 'partyName' | 'invoiceDate' | 'invoiceNo' | 'totalValue'>;


export const PurchaseList = memo(function PurchaseList({ purchases, onEdit, onDelete }: PurchaseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sortKey, setSortKey] = useState<SortablePurchaseColumnId>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [generalSettings] = useLocalStorage<GeneralSettings>(LOCAL_STORAGE_KEYS.GENERAL_SETTINGS, DEFAULT_GENERAL_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(generalSettings.defaultItemsPerPage);

  const [columnVisibility, setColumnVisibility] = useState<Record<PurchaseColumnId, boolean>>(
    ALL_PURCHASE_COLUMNS.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<PurchaseColumnId, boolean>)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setItemsPerPage(generalSettings.defaultItemsPerPage);
    }
  }, [generalSettings.defaultItemsPerPage, mounted]);
  
  const visibleColumns = useMemo(() => {
    return ALL_PURCHASE_COLUMNS.filter(col => columnVisibility[col.id]);
  }, [columnVisibility]);

  const processedPurchases = useMemo(() => {
    return purchases.map(p => ({
      ...p,
      itemsCount: p.items.length,
      totalValue: p.items.reduce((sum, item) => sum + item.price, 0),
    }));
  }, [purchases]);

  const sortedAndFilteredPurchases = useMemo(() => {
    if (!mounted) return [];
    
    let items = [...processedPurchases];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(purchase =>
        purchase.items.some(item => 
          item.chassisNo.toLowerCase().includes(lowerSearchTerm) ||
          item.engineNo.toLowerCase().includes(lowerSearchTerm) ||
          item.modelName.toLowerCase().includes(lowerSearchTerm)
        ) ||
        purchase.serialNo.toLowerCase().includes(lowerSearchTerm) ||
        (purchase.partyName && purchase.partyName.toLowerCase().includes(lowerSearchTerm)) ||
        purchase.invoiceNo.toLowerCase().includes(lowerSearchTerm)
      );
    }

    items.sort((a, b) => {
      let valA = a[sortKey as keyof typeof a];
      let valB = b[sortKey as keyof typeof b];

      if (sortKey === 'invoiceDate') {
        const dateA = parseISO(a.invoiceDate);
        const dateB = parseISO(b.invoiceDate);
        valA = isValid(dateA) ? dateA.getTime() : 0;
        valB = isValid(dateB) ? dateB.getTime() : 0;
      } else if (sortKey === 'totalValue') {
        // Already numbers from processedPurchases
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA! > valB!) {
        comparison = 1;
      } else if (valA! < valB!) {
        comparison = -1;
      }
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return items;
  }, [processedPurchases, searchTerm, mounted, sortKey, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey, sortOrder, itemsPerPage, purchases]);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredPurchases.slice(startIndex, endIndex);
  }, [sortedAndFilteredPurchases, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
     if (sortedAndFilteredPurchases.length === 0) return 1;
     return Math.ceil(sortedAndFilteredPurchases.length / itemsPerPage);
  },[sortedAndFilteredPurchases.length, itemsPerPage]);

  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const handleSort = useCallback((key: SortablePurchaseColumnId) => {
    if (sortKey === key) {
      setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  const renderSortIcon = useCallback((key: SortablePurchaseColumnId) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 inline-block" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 inline-block" /> : 
      <ArrowUpDown className="ml-1 h-3 w-3 inline-block" />;
  }, [sortKey, sortOrder]);

  if (!mounted) {
     return <Card><CardHeader><CardTitle>Purchase Records</CardTitle></CardHeader><CardContent><p>Loading purchase data...</p></CardContent></Card>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-headline">Purchase Records</CardTitle>
            <CardDescription>
              Displaying {paginatedPurchases.length} of {sortedAndFilteredPurchases.length} purchases.
            </CardDescription>
          </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 self-start sm:self-center">
                <ColumnsIcon className="mr-2 h-4 w-4" />
                View Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_PURCHASE_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={columnVisibility[column.id]}
                  onCheckedChange={(value) => {
                    const currentVisibleCount = visibleColumns.length;
                    if (!value && currentVisibleCount <= 1 && columnVisibility[column.id]) {
                        return;
                    }
                    setColumnVisibility((prev) => ({ ...prev, [column.id]: !!value }))
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-2/3 lg:w-1/2"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[60vh] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(col => (
                  <TableHead 
                    key={col.id}
                    onClick={() => col.sortable && handleSort(col.id as SortablePurchaseColumnId)}
                    className={cn(col.sortable ? "cursor-pointer hover:bg-muted/50" : "", col.className)}
                  >
                    {col.label} {col.sortable && renderSortIcon(col.id as SortablePurchaseColumnId)}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[10%] min-w-[100px] sticky right-0 bg-card z-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    {visibleColumns.map(col => (
                       <TableCell key={col.id} className={cn(col.className, 'py-3')}>
                        {col.id === 'serialNo' && purchase.serialNo}
                        {col.id === 'partyName' && (purchase.partyName || 'N/A')}
                        {col.id === 'invoiceDate' && (isValid(parseISO(purchase.invoiceDate)) ? format(parseISO(purchase.invoiceDate), 'dd MMM yyyy') : 'Invalid Date')}
                        {col.id === 'invoiceNo' && purchase.invoiceNo}
                        {col.id === 'itemsCount' && <Badge variant="secondary">{purchase.itemsCount}</Badge>}
                        {col.id === 'totalValue' && purchase.totalValue.toLocaleString('en-IN')}
                       </TableCell>
                    ))}
                    <TableCell className="text-right space-x-1 sticky right-0 bg-card z-10">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(purchases.find(p => p.id === purchase.id)!)} aria-label="Edit Purchase">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" aria-label="Delete Purchase">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the purchase entry {purchase.serialNo} and associated stock items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(purchase.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center h-24">
                    No purchase records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4 pr-1 mt-2 border-t">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">Rows per page</p>
              <Select
                value={`${itemsPerPage}`}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                }}
              >
                <SelectTrigger className="h-9 w-[75px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 15, 20, 25, 30, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                </span>
                <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="h-9"
                >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-9"
                >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
