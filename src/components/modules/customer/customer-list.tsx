
"use client";

import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { type Customer, type GeneralSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Search, UserCheck, UserX, ArrowUpDown, ChevronLeft, ChevronRight, ColumnsIcon } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_GENERAL_SETTINGS } from '@/lib/constants';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const ALL_CUSTOMER_COLUMNS = [
  { id: 'customerName', label: 'Name', defaultVisible: true, sortable: true, className: "min-w-[180px] w-[20%]" },
  { id: 'fatherName', label: 'S/o, W/o', defaultVisible: false, sortable: true, className: "min-w-[150px] w-[15%]" },
  { id: 'mobileNo', label: 'Mobile', defaultVisible: true, sortable: true, className: "min-w-[120px] w-[15%]" },
  { id: 'dob', label: 'DOB', defaultVisible: false, sortable: false, className: "min-w-[120px] w-[10%]" },
  { id: 'address', label: 'Address', defaultVisible: false, sortable: false, className: "min-w-[250px] w-[25%]" },
  { id: 'state', label: 'State', defaultVisible: true, sortable: true, className: "min-w-[120px] w-[10%]" },
  { id: 'district', label: 'District', defaultVisible: true, sortable: true, className: "min-w-[120px] w-[10%]" },
  { id: 'pincode', label: 'Pincode', defaultVisible: false, sortable: false, className: "min-w-[100px] w-[10%]" },
  { id: 'gstNo', label: 'GST No.', defaultVisible: false, sortable: true, className: "min-w-[150px] w-[15%]" },
  { id: 'isRegistered', label: 'Type', defaultVisible: true, sortable: true, className: "min-w-[130px] w-[10%]" },
] as const;

type CustomerColumnId = typeof ALL_CUSTOMER_COLUMNS[number]['id'];
type SortableCustomerColumnId = Extract<CustomerColumnId, 'customerName' | 'fatherName' | 'mobileNo' | 'state' | 'district' | 'gstNo' | 'isRegistered'>;

export const CustomerList = memo(function CustomerList({ customers, onEdit, onDelete }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sortKey, setSortKey] = useState<SortableCustomerColumnId>('customerName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [generalSettings] = useLocalStorage<GeneralSettings>(LOCAL_STORAGE_KEYS.GENERAL_SETTINGS, DEFAULT_GENERAL_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(generalSettings.defaultItemsPerPage);

  const [columnVisibility, setColumnVisibility] = useState<Record<CustomerColumnId, boolean>>(
    ALL_CUSTOMER_COLUMNS.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<CustomerColumnId, boolean>)
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
    return ALL_CUSTOMER_COLUMNS.filter(col => columnVisibility[col.id]);
  }, [columnVisibility]);

  const sortedAndFilteredCustomers = useMemo(() => {
    if (!mounted) return []; 
    
    let items = [...customers];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(customer =>
        customer.customerName.toLowerCase().includes(lowerSearchTerm) ||
        customer.mobileNo.includes(lowerSearchTerm) ||
        (customer.fatherName && customer.fatherName.toLowerCase().includes(lowerSearchTerm)) ||
        customer.address.toLowerCase().includes(lowerSearchTerm) ||
        customer.state.toLowerCase().includes(lowerSearchTerm) ||
        customer.district.toLowerCase().includes(lowerSearchTerm) ||
        (customer.gstNo && customer.gstNo.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.pincode && customer.pincode.includes(lowerSearchTerm)) ||
        (customer.dob && isValidDate(parseISO(customer.dob)) ? format(parseISO(customer.dob), 'dd MMM yyyy').toLowerCase().includes(lowerSearchTerm) : false)
      );
    }
    
    items.sort((a, b) => {
      let valA = a[sortKey as keyof Customer];
      let valB = b[sortKey as keyof Customer];

      if (sortKey === 'isRegistered') {
        valA = a.isRegistered ? 1 : 0;
        valB = b.isRegistered ? 1 : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else if (valA === undefined || valA === null) {
        valA = ''; 
      } else if (valB === undefined || valB === null) {
        valB = '';
      }

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return items;
  }, [customers, searchTerm, mounted, sortKey, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey, sortOrder, customers, itemsPerPage]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredCustomers.slice(startIndex, endIndex);
  }, [sortedAndFilteredCustomers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
     if (sortedAndFilteredCustomers.length === 0) return 1;
     return Math.ceil(sortedAndFilteredCustomers.length / itemsPerPage);
  },[sortedAndFilteredCustomers.length, itemsPerPage]);


  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleSort = useCallback((key: SortableCustomerColumnId) => {
    if (sortKey === key) {
      setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  const renderSortIcon = useCallback((key: SortableCustomerColumnId) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 inline-block" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 inline-block" /> : 
      <ArrowUpDown className="ml-1 h-3 w-3 inline-block" />;
  }, [sortKey, sortOrder]);

  if (!mounted) {
     return <Card><CardHeader><CardTitle>Customer Records</CardTitle></CardHeader><CardContent><p>Loading customer data...</p></CardContent></Card>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-headline">Customer Records</CardTitle>
            <CardDescription>
              Displaying {paginatedCustomers.length} of {sortedAndFilteredCustomers.length} customers.
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
              {ALL_CUSTOMER_COLUMNS.map((column) => (
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
            placeholder="Search customers by any field..."
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
                    onClick={() => col.sortable && handleSort(col.id as SortableCustomerColumnId)}
                    className={cn(col.sortable ? "cursor-pointer hover:bg-muted/50" : "", col.className)}
                  >
                    {col.label} {col.sortable && renderSortIcon(col.id as SortableCustomerColumnId)}
                  </TableHead>
                ))}
                <TableHead className="text-right w-[100px] min-w-[100px] sticky right-0 bg-card z-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    {visibleColumns.map(col => (
                       <TableCell key={col.id} className={cn(col.className, 'py-3')}>
                        {col.id === 'customerName' && customer.customerName}
                        {col.id === 'fatherName' && (customer.fatherName || 'N/A')}
                        {col.id === 'mobileNo' && customer.mobileNo}
                        {col.id === 'dob' && (customer.dob && isValidDate(parseISO(customer.dob)) ? format(parseISO(customer.dob), 'dd MMM yyyy') : 'N/A')}
                        {col.id === 'address' && <span className="truncate block max-w-xs">{customer.address}</span>}
                        {col.id === 'state' && customer.state}
                        {col.id === 'district' && customer.district}
                        {col.id === 'pincode' && (customer.pincode || 'N/A')}
                        {col.id === 'gstNo' && (customer.gstNo || 'N/A')}
                        {col.id === 'isRegistered' && (
                           customer.isRegistered ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 whitespace-nowrap">
                              <UserCheck className="mr-1 h-3 w-3" /> Registered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 whitespace-nowrap">
                              <UserX className="mr-1 h-3 w-3" /> Non-Reg
                            </Badge>
                          )
                        )}
                       </TableCell>
                    ))}
                    <TableCell className="text-right space-x-1 sticky right-0 bg-card z-10">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(customer)} aria-label="Edit Customer" title="Edit Customer">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" aria-label="Delete Customer" title="Delete Customer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the customer record for {customer.customerName}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(customer.id)}
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
                    No customers found matching your criteria.
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

    
