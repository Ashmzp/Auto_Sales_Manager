import PrintDocument from "@/components/print/PrintDocument";
import { useRef } from "react";
import ReactToPrint from "react-to-print";


"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { type Invoice, type GeneralSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Search, Printer, FileText as FileTextIconLucide, ArrowUpDown, ColumnsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
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

interface InvoiceReportProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onPrint: (invoiceId: string, type: 'tax' | 'challan') => void;
}

const ALL_INVOICE_COLUMNS = [
  { id: 'serialNo', label: 'Inv. No.', defaultVisible: true, sortable: true, className: "w-[10%] min-w-[100px]" },
  { id: 'invoiceDate', label: 'Date', defaultVisible: true, sortable: true, className: "w-[10%] min-w-[100px]" },
  { id: 'customerName', label: 'Customer', defaultVisible: true, sortable: true, className: "w-[20%] min-w-[180px]" },
  { id: 'chassisNo', label: 'Chassis No.', defaultVisible: false, sortable: false, className: "w-[15%] min-w-[150px]" },
  { id: 'mobileNo', label: 'Mobile', defaultVisible: false, sortable: false, className: "w-[10%] min-w-[100px]" },
  { id: 'partyType', label: 'Party Type', defaultVisible: true, sortable: false, className: "w-[10%] min-w-[110px]" },
  { id: 'totalItems', label: 'Items', defaultVisible: true, sortable: false, className: "w-[5%] min-w-[60px] text-center" },
  { id: 'totalAmount', label: 'Amount (₹)', defaultVisible: true, sortable: true, className: "w-[10%] min-w-[120px] text-right" },
  { id: 'paymentMode', label: 'Payment Mode', defaultVisible: false, sortable: false, className: "w-[10%] min-w-[120px]" },
  { id: 'salesPerson', label: 'Sales Person', defaultVisible: false, sortable: false, className: "w-[10%] min-w-[120px]" },
] as const;

type InvoiceColumnId = typeof ALL_INVOICE_COLUMNS[number]['id'];
type SortableInvoiceColumnId = Extract<InvoiceColumnId, 'serialNo' | 'invoiceDate' | 'customerName' | 'totalAmount'>;


export const InvoiceReport = React.memo(function InvoiceReport({ invoices, onEdit, onDelete, onPrint }: InvoiceReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortableInvoiceColumnId>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [generalSettings] = useLocalStorage<GeneralSettings>(LOCAL_STORAGE_KEYS.GENERAL_SETTINGS, DEFAULT_GENERAL_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(generalSettings.defaultItemsPerPage);

  const [columnVisibility, setColumnVisibility] = useState<Record<InvoiceColumnId, boolean>>(
    ALL_INVOICE_COLUMNS.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<InvoiceColumnId, boolean>)
  );
  
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setItemsPerPage(generalSettings.defaultItemsPerPage);
    }
  }, [generalSettings.defaultItemsPerPage, mounted]);

  const visibleColumns = useMemo(() => {
    return ALL_INVOICE_COLUMNS.filter(col => columnVisibility[col.id]);
  }, [columnVisibility]);

  const processedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      totalItems: inv.items.length,
      totalAmount: inv.onRoadPrice ?? inv.items.reduce((sum, item) => sum + item.price + (item.price * item.gst / 100), 0) + (inv.insuranceAmount || 0) + (inv.registrationAmount || 0) + (inv.accessoriesAmount || 0),
    }));
  }, [invoices]);

  const sortedAndFilteredInvoices = useMemo(() => {
    if (!mounted) return [];
    let items = [...processedInvoices];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      items = items.filter(inv =>
        inv.serialNo.toLowerCase().includes(lowerSearchTerm) ||
        inv.customerDetails.customerName.toLowerCase().includes(lowerSearchTerm) ||
        inv.customerDetails.mobileNo.includes(lowerSearchTerm) ||
        (inv.customerDetails.gstNo && inv.customerDetails.gstNo.toLowerCase().includes(lowerSearchTerm)) ||
        inv.items.some(item => item.chassisNo.toLowerCase().includes(lowerSearchTerm) || item.modelName.toLowerCase().includes(lowerSearchTerm)) ||
        (inv.salesPersonName && inv.salesPersonName.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    items.sort((a, b) => {
      let valA = a[sortKey as keyof typeof a];
      let valB = b[sortKey as keyof typeof b];

      if (sortKey === 'invoiceDate') {
        const dateA = parseISO(a.invoiceDate as string); 
        const dateB = parseISO(b.invoiceDate as string); 
        valA = isValidDate(dateA) ? dateA.getTime() : 0;
        valB = isValidDate(dateB) ? dateB.getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      let comparison = 0;
      if (valA! > valB!) comparison = 1;
      else if (valA! < valB!) comparison = -1;
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return items;
  }, [processedInvoices, searchTerm, sortKey, sortOrder, mounted]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey, sortOrder, itemsPerPage, invoices]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredInvoices.slice(startIndex, endIndex);
  }, [sortedAndFilteredInvoices, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (sortedAndFilteredInvoices.length === 0) return 1;
    return Math.ceil(sortedAndFilteredInvoices.length / itemsPerPage);
  }, [sortedAndFilteredInvoices.length, itemsPerPage]);

  const handleSort = useCallback((key: SortableInvoiceColumnId) => {
    if (sortKey === key) {
      setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  const renderSortIcon = useCallback((key: SortableInvoiceColumnId) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 inline-block" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 inline-block" /> : 
      <ArrowUpDown className="ml-1 h-3 w-3 inline-block" />;
  }, [sortKey, sortOrder]);

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  
  if (!mounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Invoice Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-headline">Invoice Records</CardTitle>
            <CardDescription>
             Displaying {paginatedInvoices.length} of {sortedAndFilteredInvoices.length} invoices.
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
              {ALL_INVOICE_COLUMNS.map((column) => (
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
            placeholder="Search invoices by No, Customer, Mobile, Chassis, Model, Sales Person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-2/3 lg:w-1/2"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(col => (
                  <TableHead 
                    key={col.id}
                    onClick={() => col.sortable && handleSort(col.id as SortableInvoiceColumnId)}
                    className={cn(col.sortable ? "cursor-pointer hover:bg-muted/50" : "", col.className)}
                  >
                    {col.label} {col.sortable && renderSortIcon(col.id as SortableInvoiceColumnId)}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[15%] min-w-[180px] sticky right-0 bg-card z-30">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} onDoubleClick={() => onEdit(invoices.find(i => i.id === invoice.id)!)}>
                    {visibleColumns.map(col => (
                       <TableCell key={col.id} className={cn(col.className, 'py-3')}>
                        {col.id === 'serialNo' && invoice.serialNo}
                        {col.id === 'invoiceDate' && (isValidDate(parseISO(invoice.invoiceDate as string)) ? format(parseISO(invoice.invoiceDate as string), 'dd MMM yyyy') : 'Invalid Date')}
                        {col.id === 'customerName' && invoice.customerDetails.customerName}
                        {col.id === 'chassisNo' && invoice.items.map(item => item.chassisNo).join(', ')}
                        {col.id === 'mobileNo' && invoice.customerDetails.mobileNo}
                        {col.id === 'partyType' && (
                           invoice.customerDetails.isRegistered ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 whitespace-nowrap">Registered</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 whitespace-nowrap">Non-Reg</Badge>
                          )
                        )}
                        {col.id === 'totalItems' && <Badge variant="outline">{invoice.totalItems}</Badge>}
                        {col.id === 'totalAmount' && invoice.totalAmount.toLocaleString('en-IN')}
                        {col.id === 'paymentMode' && (invoice.cashOrHypothecation || 'N/A')}
                        {col.id === 'salesPerson' && (invoice.salesPersonName || 'N/A')}
                       </TableCell>
                    ))}
                    <TableCell className="text-right space-x-1 sticky right-0 bg-card z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
                                    <Printer className="h-4 w-4" />
                                    <span className="sr-only">Print Options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuLabel>Print Invoice</DropdownMenuLabel>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={() => onPrint(invoice.id, 'tax')}>
                                    <FileTextIconLucide className="mr-2 h-4 w-4"/> Tax Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPrint(invoice.id, 'challan')}>
                                    <FileTextIconLucide className="mr-2 h-4 w-4"/> Delivery Challan
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(invoices.find(i => i.id === invoice.id)!)} aria-label="Edit Invoice" title="Edit Invoice">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" aria-label="Delete Invoice" title="Delete Invoice">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the invoice {invoice.serialNo} and update stock status.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(invoice.id)}
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
                    No invoices found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4 pr-1 mt-2 border-t flex-shrink-0">
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

