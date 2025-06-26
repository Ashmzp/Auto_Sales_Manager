
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { CustomerList } from '@/components/modules/customer/customer-list';
import { CustomerForm } from '@/components/modules/customer/customer-form';
import { type Customer, type CompanyProfile } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_COMPANY_PROFILE } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const MemoizedCustomerList = React.memo(CustomerList);
const MemoizedCustomerForm = React.memo(CustomerForm);

export default function CustomersPage() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const [companyProfile] = useLocalStorage<CompanyProfile | null>(
    LOCAL_STORAGE_KEYS.COMPANY_PROFILE,
    DEFAULT_COMPANY_PROFILE
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveCustomer = useCallback((customer: Customer) => {
    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    } else {
      setCustomers(prev => [...prev, customer]);
    }
    setSelectedCustomer(null);
    setIsFormOpen(false);
  }, [selectedCustomer, setCustomers]);

  const handleEditCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  }, []);

  const handleDeleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, [setCustomers]);
  
  const openFormForNew = useCallback(() => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setSelectedCustomer(null);
    setIsFormOpen(false);
  }, []);

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customers" description="Manage your customer records.">
           <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        </PageHeader>
        <p>Loading customers...</p> {/* Or a Skeleton Loader component */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage your customer records.">
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) { // Reset selected customer when dialog is closed
                setSelectedCustomer(null);
            }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openFormForNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <MemoizedCustomerForm
              customerData={selectedCustomer}
              onSave={handleSaveCustomer}
              onCancel={handleCancelForm}
              defaultStateFromCompany={companyProfile?.state}
              defaultDistrictFromCompany={companyProfile?.district}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <MemoizedCustomerList
        customers={customers}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />
    </div>
  );
}
