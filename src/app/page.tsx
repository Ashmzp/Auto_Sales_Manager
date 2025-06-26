
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { Users, ShoppingCart, FileText, TrendingUp, DollarSign, ArrowRight, PlusCircle, Download } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { Customer, Invoice, PurchaseEntry } from '@/types';
import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO } from 'date-fns';

interface KpiData {
  totalSalesLast30Days: number;
  totalPurchasesLast30Days: number;
  newCustomersLast30Days: number;
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [invoicesData] = useLocalStorage<Invoice[]>(LOCAL_STORAGE_KEYS.INVOICES, []);
  const [purchasesData] = useLocalStorage<PurchaseEntry[]>(LOCAL_STORAGE_KEYS.PURCHASES, []);
  const [customersData] = useLocalStorage<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);

  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (isMounted && currentDate) {
      const thirtyDaysAgo = subDays(currentDate, 30);

      const salesLast30 = invoicesData
        .filter(inv => inv.invoiceDate && isAfter(parseISO(inv.invoiceDate), thirtyDaysAgo))
        .reduce((sum, inv) => sum + (inv.onRoadPrice || 0), 0);

      const purchasesLast30 = purchasesData
        .filter(pur => pur.invoiceDate && isAfter(parseISO(pur.invoiceDate), thirtyDaysAgo))
        .reduce((sum, pur) => sum + pur.items.reduce((itemSum, item) => itemSum + item.price, 0), 0);

      const newCustomersLast30 = customersData
        .filter(cust => cust.createdAt && isAfter(parseISO(cust.createdAt), thirtyDaysAgo))
        .length;

      setKpiData({
        totalSalesLast30Days: salesLast30,
        totalPurchasesLast30Days: purchasesLast30,
        newCustomersLast30Days: newCustomersLast30,
      });

      const sortedInvoices = [...invoicesData].sort((a, b) => 
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
      setRecentInvoices(sortedInvoices.slice(0, 5));
    }
  }, [isMounted, invoicesData, purchasesData, customersData, currentDate]);

  const quickActions = [
    { label: "New Invoice", href: "/invoices", icon: PlusCircle },
    { label: "New Purchase", href: "/purchases", icon: ShoppingCart },
    { label: "New Customer", href: "/customers", icon: Users },
    { label: "Backup Data", href: "/settings", icon: Download },
  ];

  if (!isMounted || !kpiData) {
    return (
      <div className="space-y-6 p-4 md:p-6 animate-pulse">
        <div className="h-10 w-3/4 bg-muted rounded mb-2"></div> {/* PageHeader Skeleton */}
        <div className="h-6 w-1/2 bg-muted rounded mb-6"></div>

        {/* Quick Actions Skeleton */}
        <Card className="h-32 mb-6"><CardHeader><div className="h-6 w-1/4 bg-muted rounded"></div></CardHeader><CardContent><div className="h-12 bg-muted rounded"></div></CardContent></Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-64"><CardHeader><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader><CardContent><div className="h-32 bg-muted rounded"></div></CardContent></Card>
            <Card className="h-80"><CardHeader><div className="h-6 w-1/3 bg-muted rounded"></div></CardHeader><CardContent><div className="h-48 bg-muted rounded"></div></CardContent></Card>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => ( <Card key={i} className="h-40"><CardHeader><div className="h-5 w-2/5 bg-muted rounded"></div></CardHeader><CardContent><div className="h-16 bg-muted rounded"></div></CardContent></Card> ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Dashboard Overview" description="Welcome to your 2-Wheeler Sales Command Center." />

      {/* Quick Actions Section - Moved to top */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          <CardDescription>Access common tasks quickly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 sm:gap-4">
          {quickActions.map(action => (
            <Link href={action.href} key={action.label}>
              <Button variant="outline" className="w-full sm:w-auto text-sm py-2 px-4 h-auto sm:h-10">
                <action.icon className="mr-2 h-4 w-4" /> {action.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (Left/Center) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome/Hero Card */}
          <Card className="shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 items-center">
              <CardHeader className="p-6 md:p-8">
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary font-headline">
                  Elevate Your 2-Wheeler Business
                </CardTitle>
                <CardDescription className="mt-2 text-base text-muted-foreground">
                  Streamline operations, track sales, manage inventory, and drive growth with powerful tools at your fingertips.
                </CardDescription>
                <div className="mt-6">
                  <Link href="/invoices">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Create New Invoice <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <div className="hidden md:flex justify-center items-center p-6 bg-muted/30 h-full">
                 <img
                  src="https://placehold.co/600x400.png"
                  alt="Two-wheeler sales illustration"
                  className="rounded-lg object-cover max-h-[250px] shadow-md"
                  data-ai-hint="scooter showroom motorcycles"
                />
              </div>
            </div>
          </Card>

          {/* Recent Sales Activity Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold">Recent Sales Activity</CardTitle>
                  <CardDescription>Showing the last 5 invoices.</CardDescription>
                </div>
                <Link href="/invoices">
                   <Button variant="outline" size="sm">View All Invoices <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.length > 0 ? recentInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.serialNo}</TableCell>
                      <TableCell>{invoice.customerDetails.customerName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{invoice.invoiceDate ? format(parseISO(invoice.invoiceDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-right">₹{invoice.onRoadPrice?.toLocaleString('en-IN') || '0'}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow><TableCell colSpan={4} className="text-center h-24">No recent invoices.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Area (KPIs) */}
        <div className="space-y-6">
          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (Last 30d)</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{kpiData.totalSalesLast30Days.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground pt-1">Total sales from invoices.</p>
               <img src="https://placehold.co/300x80.png" data-ai-hint="green finance graph" alt="Sales trend placeholder" className="mt-3 rounded opacity-70" />
               <Link href="/invoices" className="text-sm font-medium text-primary hover:underline mt-3 block">
                View Invoices <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchases (Last 30d)</CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{kpiData.totalPurchasesLast30Days.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground pt-1">Total cost of vehicles purchased.</p>
              <img src="https://placehold.co/300x80.png" data-ai-hint="blue finance graph" alt="Purchases trend placeholder" className="mt-3 rounded opacity-70" />
              <Link href="/purchases" className="text-sm font-medium text-primary hover:underline mt-3 block">
                View Purchases <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers (Last 30d)</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData.newCustomersLast30Days}</div>
              <p className="text-xs text-muted-foreground pt-1">Customers added in the last 30 days.</p>
              <img src="https://placehold.co/300x80.png" data-ai-hint="purple user graph" alt="Customers trend placeholder" className="mt-3 rounded opacity-70" />
               <Link href="/customers" className="text-sm font-medium text-primary hover:underline mt-3 block">
                View Customers <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    