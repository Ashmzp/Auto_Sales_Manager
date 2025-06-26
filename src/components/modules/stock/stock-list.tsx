
"use client";

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { type StockItem, type GeneralSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ColumnsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
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

interface StockListProps {
  stockItems: (StockItem & { stockInDays: number })[];
  totalAvailableItemsCount: number; 
  onFilteredItemsChange: (items: (StockItem & { stockInDays: number })[]) => void;
}

const ALL_COLUMNS = [
  { id: 'modelName', label: 'Model Name', defaultVisible: true, sortable: true, className: "min-w-[150px]" },
  { id: 'chassisNo', label: 'Chassis No.', defaultVisible: true, sortable: true, className: "min-w-[150px]" },
  { id: 'engineNo', label: 'Engine No.', defaultVisible: true, sortable: false, className: "min-w-[150px]" },
  { id: 'colour', label: 'Colour', defaultVisible: true, sortable: true, className: "min-w-[100px]" },
  { id: 'gst', label: 'GST (%)', defaultVisible: false, sortable: false, className: "text-right min-w-[80px]" },
  { id: 'price', label: 'Price', defaultVisible: true, sortable: true, className: "text-right min-w-[120px]" },
  { id: 'purchaseDate', label: 'Purchase Date', defaultVisible: false, sortable: true, className: "text-right min-w-[120px]" },
  { id: 'stockInDays', label: 'Stock (Days)', defaultVisible: true, sortable: true, className: "text-right min-w-[100px]" },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]['id'];
type SortableColumnId = Extract<ColumnId, 'modelName' | 'chassisNo' | 'colour' | 'price' | 'purchaseDate' | 'stockInDays'>;


export const StockList = memo(function StockList({ stockItems, totalAvailableItemsCount, onFilteredItemsChange }: StockListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortableColumnId>('purchaseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMounted, setIsMounted] = useState(false);

  const [generalSettings] = useLocalStorage<GeneralSettings>(LOCAL_STORAGE_KEYS.GENERAL_SETTINGS, DEFAULT_GENERAL_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(generalSettings.defaultItemsPerPage);

  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnId, boolean>>(
    ALL_COLUMNS.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnId, boolean>)
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      setItemsPerPage(generalSettings.defaultItemsPerPage);
    }
  }, [generalSettings.defaultItemsPerPage, isMounted]);

  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter(col => columnVisibility[col.id]);
  }, [columnVisibility]);

  const sortedAndFilteredStockItems = useMemo(() => {
    if (!isMounted) return [];

    let items = [...stockItems];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.modelName.toLowerCase().includes(lowerSearchTerm) ||
        item.chassisNo.toLowerCase().includes(lowerSearchTerm) ||
        item.engineNo.toLowerCase().includes(lowerSearchTerm) ||
        item.colour.toLowerCase().includes(lowerSearchTerm)
      );
    }

    items.sort((a, b) => {
      let valA = a[sortKey as keyof typeof a];
      let valB = b[sortKey as keyof typeof b];

      if (sortKey === 'purchaseDate') {
        valA = parseISO(a.purchaseDate).getTime();
        valB = parseISO(b.purchaseDate).getTime();
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return items;
  }, [stockItems, searchTerm, sortKey, sortOrder, isMounted]);

  useEffect(() => {
    onFilteredItemsChange(sortedAndFilteredStockItems);
  }, [sortedAndFilteredStockItems, onFilteredItemsChange]);

  const paginatedStockItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredStockItems.slice(startIndex, endIndex);
  }, [sortedAndFilteredStockItems, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (sortedAndFilteredStockItems.length === 0) return 1;
    return Math.ceil(sortedAndFilteredStockItems.length / itemsPerPage);
  }, [sortedAndFilteredStockItems.length, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm, stockItems]);


  const handleSort = useCallback((key: SortableColumnId) => {
    if (sortKey === key) {
      setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  const renderSortIcon = useCallback((key: SortableColumnId) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 inline-block" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 inline-block" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 inline-block" />;
  }, [sortKey, sortOrder]);

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (!isMounted) {
     return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-xl font-headline">Available Stock</CardTitle></CardHeader>
        <CardContent><p>Loading stock data...</p></CardContent>
      </Card>
     );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
                <CardTitle className="text-xl font-headline">Available Stock</CardTitle>
                <CardDescription>
                    Displaying {paginatedStockItems.length} of {sortedAndFilteredStockItems.length} vehicles (Total {totalAvailableItemsCount} matching date filters).
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
                {ALL_COLUMNS.map((column) => (
                    <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={columnVisibility[column.id]}
                    onCheckedChange={(value) => {
                       // Prevent hiding all columns, ensure at least one is visible
                        const currentVisibleCount = visibleColumns.length;
                        if (!value && currentVisibleCount <= 1 && columnVisibility[column.id]) {
                            // If trying to uncheck the last visible column, do nothing
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
            placeholder="Search by Model, Chassis, Engine, or Colour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-2/3 lg:w-1/2"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(col => (
                  <TableHead
                    key={col.id}
                    onClick={() => col.sortable && handleSort(col.id as SortableColumnId)}
                    className={cn(col.sortable ? "cursor-pointer hover:bg-muted/50" : "", col.className)}
                  >
                    {col.label} {col.sortable && renderSortIcon(col.id as SortableColumnId)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStockItems.length > 0 ? (
                paginatedStockItems.map((item) => (
                  <TableRow key={item.id}>
                     {visibleColumns.map(col => (
                      <TableCell key={col.id} className={cn(col.className, 'py-3')}>
                        {col.id === 'modelName' && item.modelName}
                        {col.id === 'chassisNo' && item.chassisNo}
                        {col.id === 'engineNo' && item.engineNo}
                        {col.id === 'colour' && item.colour}
                        {col.id === 'gst' && item.gst.toFixed(1)}
                        {col.id === 'price' && item.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                        {col.id === 'purchaseDate' && format(parseISO(item.purchaseDate), 'dd MMM yyyy')}
                        {col.id === 'stockInDays' && (
                           <Badge
                            variant={item.stockInDays > 60 ? "destructive" : item.stockInDays > 30 ? "secondary" : "default"}
                            className="font-mono text-xs px-2 py-0.5"
                          >
                            {item.stockInDays} days
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length || 1} className="text-center h-24">
                    No stock items found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        { sortedAndFilteredStockItems.length > 0 && (
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

