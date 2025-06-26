
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, FileSpreadsheet, Printer, FileText as FileTextIconLucide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { InvoiceForm } from '@/components/modules/invoice/invoice-form';
import { CustomerForm } from '@/components/modules/customer/customer-form';
import { InvoiceReport } from '@/components/modules/invoice/invoice-report';
import { type Invoice, type Customer, type StockItem, type InvoiceSettings, type InvoiceFormData, type CompanyProfile } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_INVOICE_SETTINGS, DEFAULT_COMPANY_PROFILE } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isValid, startOfDay, endOfDay, isValid as isValidDate } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


const MemoizedInvoiceForm = React.memo(InvoiceForm);
const MemoizedInvoiceReport = React.memo(InvoiceReport);
const MemoizedCustomerForm = React.memo(CustomerForm);

export default function InvoicesPage() {
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>(LOCAL_STORAGE_KEYS.INVOICES, []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const [stockItems, setStockItems] = useLocalStorage<StockItem[]>(LOCAL_STORAGE_KEYS.STOCK, []);
  const [invoiceSettings, setInvoiceSettings] = useLocalStorage<InvoiceSettings>(
    LOCAL_STORAGE_KEYS.SETTINGS,
    DEFAULT_INVOICE_SETTINGS
  );
  const [companyProfile, setCompanyProfile] = useLocalStorage<CompanyProfile>(
    LOCAL_STORAGE_KEYS.COMPANY_PROFILE,
    DEFAULT_COMPANY_PROFILE
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const generateNewSerialNumber = useCallback((isRegisteredParty: boolean): string => {
    let prefix: string;
    let nextNumber: number;

    if (isRegisteredParty) {
      prefix = invoiceSettings.registeredPrefix;
      nextNumber = invoiceSettings.nextRegisteredSerialNo;
    } else {
      prefix = invoiceSettings.nonRegisteredPrefix;
      nextNumber = invoiceSettings.nextNonRegisteredSerialNo;
    }

    prefix = prefix || "INV-";
    nextNumber = Number(nextNumber) || Number(invoiceSettings.nextSerialNo) || 1;


    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }, [invoiceSettings]);

  const updateNextSerialNumber = useCallback((isRegisteredParty: boolean) => {
    setInvoiceSettings(prevSettings => {
      const getNumericValue = (value: any, fallback: number = 0): number => {
        const num = Number(value);
        return isNaN(num) ? fallback : num;
      };

      let updatedSettings = { ...prevSettings };
      const generalNextSerialNo = getNumericValue(prevSettings.nextSerialNo, 0);

      if (isRegisteredParty) {
        const currentNextRegistered = getNumericValue(prevSettings.nextRegisteredSerialNo, generalNextSerialNo);
        updatedSettings.nextRegisteredSerialNo = currentNextRegistered + 1;
      } else {
        const currentNextNonRegistered = getNumericValue(prevSettings.nextNonRegisteredSerialNo, generalNextSerialNo);
        updatedSettings.nextNonRegisteredSerialNo = currentNextNonRegistered + 1;
      }
      
      updatedSettings.nextSerialNo = Math.max(
        getNumericValue(updatedSettings.nextRegisteredSerialNo, 1),
        getNumericValue(updatedSettings.nextNonRegisteredSerialNo, 1),
        generalNextSerialNo > 0 ? generalNextSerialNo : 1 
      );
       if (updatedSettings.nextRegisteredSerialNo && updatedSettings.nextSerialNo < updatedSettings.nextRegisteredSerialNo) {
        updatedSettings.nextSerialNo = updatedSettings.nextRegisteredSerialNo;
      }
      if (updatedSettings.nextNonRegisteredSerialNo && updatedSettings.nextSerialNo < updatedSettings.nextNonRegisteredSerialNo) {
        updatedSettings.nextSerialNo = updatedSettings.nextNonRegisteredSerialNo;
      }


      return updatedSettings;
    });
  }, [setInvoiceSettings]);

  const handleAddNewCustomerToList = useCallback((newCustomer: Customer): Customer => {
    setCustomers(prev => {
        const existing = prev.find(c => c.id === newCustomer.id);
        if (existing) {
            return prev.map(c => c.id === newCustomer.id ? newCustomer : c);
        }
        return [...prev, newCustomer];
    });
    return newCustomer;
  }, [setCustomers]);

  const handleSaveInvoice = useCallback((invoiceFormData: InvoiceFormData, associatedCustomer: Customer) => {
    const now = new Date().toISOString();
    let savedInvoice: Invoice;
    const isNewInvoice = !selectedInvoice;

    const customerDetailsForInvoice: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      customerName: associatedCustomer.customerName,
      fatherName: associatedCustomer.fatherName,
      mobileNo: associatedCustomer.mobileNo,
      address: associatedCustomer.address,
      state: associatedCustomer.state,
      district: associatedCustomer.district,
      gstNo: associatedCustomer.gstNo,
      isRegistered: associatedCustomer.isRegistered,
      pincode: associatedCustomer.pincode,
      dob: associatedCustomer.dob,
    };

    const formattedInvoiceDate = invoiceFormData.invoiceDate instanceof Date 
                                  ? format(invoiceFormData.invoiceDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
                                  : invoiceFormData.invoiceDate; // Assume it's already a string if not a Date


    if (selectedInvoice) { 
      savedInvoice = {
        ...selectedInvoice, 
        ...invoiceFormData, 
        invoiceDate: formattedInvoiceDate, 
        customerDetails: customerDetailsForInvoice, 
        updatedAt: now,
      };
      setAllInvoices(prev => prev.map(inv => inv.id === savedInvoice.id ? savedInvoice : inv));
      toast({ title: "Invoice Updated", description: `Invoice ${savedInvoice.serialNo} has been updated.` });
    } else { 
      const newSerialNo = generateNewSerialNumber(associatedCustomer.isRegistered);
      savedInvoice = {
        ...invoiceFormData,
        id: uuidv4(),
        serialNo: newSerialNo, 
        invoiceDate: formattedInvoiceDate, 
        customerDetails: customerDetailsForInvoice,
        createdAt: now,
        updatedAt: now,
      };
      setAllInvoices(prev => [...prev, savedInvoice]);
      updateNextSerialNumber(associatedCustomer.isRegistered);
      toast({ title: "Invoice Saved", description: `Invoice ${savedInvoice.serialNo} has been saved.` });
    }

    const itemsToUpdateInStock = invoiceFormData.items.map(item => item.stockItemId);
    setStockItems(prevStock =>
      prevStock.map(stockItem => {
        if (itemsToUpdateInStock.includes(stockItem.id)) {
          return { ...stockItem, sold: true, invoiceId: savedInvoice.id, updatedAt: now };
        }
        return stockItem;
      })
    );

    if (!isNewInvoice && selectedInvoice) { 
        const itemsInOriginalInvoice = selectedInvoice.items.map(i => i.stockItemId);
        const itemsInUpdatedInvoice = invoiceFormData.items.map(i => i.stockItemId);
        const removedItems = itemsInOriginalInvoice.filter(id => !itemsInUpdatedInvoice.includes(id));

        if (removedItems.length > 0) {
            setStockItems(prevStock =>
                prevStock.map(stockItem => {
                    if (removedItems.includes(stockItem.id) && stockItem.invoiceId === selectedInvoice.id) {
                        return { ...stockItem, sold: false, invoiceId: undefined, updatedAt: now };
                    }
                    return stockItem;
                })
            );
        }
    }

    setSelectedInvoice(null);
    setIsFormOpen(false);
  }, [selectedInvoice, invoiceSettings, setAllInvoices, toast, generateNewSerialNumber, updateNextSerialNumber, setStockItems]);


  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  }, []);

  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoiceToDelete) return;

    const itemsToUnsellInStock = invoiceToDelete.items.map(item => item.stockItemId);
    setStockItems(prevStock =>
      prevStock.map(stockItem => {
        if (itemsToUnsellInStock.includes(stockItem.id) && stockItem.invoiceId === invoiceId) {
          return { ...stockItem, sold: false, invoiceId: undefined, updatedAt: new Date().toISOString() };
        }
        return stockItem;
      })
    );

    setAllInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    toast({ title: "Invoice Deleted", description: `Invoice ${invoiceToDelete.serialNo} and its stock associations have been reverted.`, variant: "destructive" });
  }, [allInvoices, setStockItems, setAllInvoices, toast]);

  const openFormForNew = useCallback(() => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setSelectedInvoice(null);
    setIsFormOpen(false);
  }, []);

  const displayedInvoices = useMemo(() => {
    if (!isMounted) return [];

    let filtered = [...allInvoices];

    if (filterStartDate) {
      const startDate = startOfDay(parseISO(filterStartDate));
      if (isValid(startDate)) {
        filtered = filtered.filter(item => {
          const itemInvoiceDate = parseISO(item.invoiceDate as string); 
          return isValid(itemInvoiceDate) && itemInvoiceDate >= startDate;
        });
      }
    }

    if (filterEndDate) {
      const endDate = endOfDay(parseISO(filterEndDate));
      if (isValid(endDate)) {
        filtered = filtered.filter(item => {
          const itemInvoiceDate = parseISO(item.invoiceDate as string); 
          return isValid(itemInvoiceDate) && itemInvoiceDate <= endDate;
        });
      }
    }
    return filtered.sort((a,b) => new Date(b.invoiceDate as string).getTime() - new Date(a.invoiceDate as string).getTime());
  }, [allInvoices, isMounted, filterStartDate, filterEndDate]);

  const handleExcelExport = useCallback(async () => {
    const XLSX = await import('xlsx');
    if (!displayedInvoices || displayedInvoices.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no invoices matching the current filters to export.',
        variant: 'destructive',
      });
      return;
    }

    const dataForExcel: any[] = [];
    const headers = [
      'Invoice No.', 'Invoice Date', 'Customer Name', 'Father Name', 'Mobile No.',
      'Customer DOB', 
      'Address', 'Customer GST No.', 'Party Type',
      'Aadhar No.', 'Nominee Name', 'RTO',
      'Sales Person Name', 'Cash/Hypothecation', 'On Road Price', 'Scheme',
      'Insurance Amount', 'Registration Amount', 'Accessories Amount',
      'Item - Model Name', 'Item - Chassis No', 'Item - Engine No', 'Item - Colour', 'Item - Qty',
      'Item - Price', 'Item - GST (%)', 'Item - GST Amount', 'Item - Total Price (incl. GST)'
    ];

    displayedInvoices.forEach(invoice => {
      invoice.items.forEach((item, itemIndex) => {
        const gstAmount = (item.price * item.gst) / 100;
        const totalPriceInclGst = item.price + gstAmount;

        const row: any = {};
        if (itemIndex === 0) { // Main invoice details only for the first item row
          row['Invoice No.'] = invoice.serialNo;
          row['Invoice Date'] = isValidDate(parseISO(invoice.invoiceDate as string)) ? format(parseISO(invoice.invoiceDate as string), 'yyyy-MM-dd') : 'Invalid Date';
          row['Customer Name'] = invoice.customerDetails.customerName;
          row['Father Name'] = invoice.customerDetails.fatherName || '';
          row['Mobile No.'] = invoice.customerDetails.mobileNo;
          row['Customer DOB'] = invoiceSettings.enableCustomerDOBDisplay && invoice.customerDetails.dob && isValidDate(parseISO(invoice.customerDetails.dob)) ? format(parseISO(invoice.customerDetails.dob), 'yyyy-MM-dd') : '';
          row['Address'] = `${invoice.customerDetails.address}, ${invoice.customerDetails.district}, ${invoice.customerDetails.state}${invoice.customerDetails.pincode ? ' - ' + invoice.customerDetails.pincode : ''}`;
          row['Customer GST No.'] = invoice.customerDetails.gstNo || '';
          row['Party Type'] = invoice.customerDetails.isRegistered ? 'Registered' : 'Non-Registered';
          
          row['Aadhar No.'] = invoiceSettings.enableAadharNo && invoice.aadharNo ? invoice.aadharNo : '';
          row['Nominee Name'] = invoiceSettings.enableNomineeName && invoice.nomineeName ? invoice.nomineeName : '';
          row['RTO'] = invoiceSettings.enableRTO && invoice.rto ? invoice.rto : '';
          row['Sales Person Name'] = invoiceSettings.enableSalesPerson && invoice.salesPersonName ? invoice.salesPersonName : '';
          row['Cash/Hypothecation'] = invoiceSettings.enableCashOrHypothecation && invoice.cashOrHypothecation ? invoice.cashOrHypothecation : '';
          row['On Road Price'] = invoiceSettings.enableOnRoadPrice && invoice.onRoadPrice !== undefined ? invoice.onRoadPrice : '';
          row['Scheme'] = invoiceSettings.enableScheme && invoice.scheme ? invoice.scheme : '';
          row['Insurance Amount'] = invoiceSettings.enableInsurance && invoice.insuranceAmount !== undefined ? invoice.insuranceAmount : '';
          row['Registration Amount'] = invoiceSettings.enableRegistration && invoice.registrationAmount !== undefined ? invoice.registrationAmount : '';
          row['Accessories Amount'] = invoiceSettings.enableAccessories && invoice.accessoriesAmount !== undefined ? invoice.accessoriesAmount : '';
        } else {
          // For subsequent items of the same invoice, leave main invoice details blank
          headers.slice(0, 19).forEach(header => row[header] = ''); 
        }
        
        // Item details for every item row
        row['Item - Model Name'] = item.modelName;
        row['Item - Chassis No'] = item.chassisNo;
        row['Item - Engine No'] = item.engineNo;
        row['Item - Colour'] = item.colour;
        row['Item - Qty'] = item.qty;
        row['Item - Price'] = item.price;
        row['Item - GST (%)'] = item.gst;
        row['Item - GST Amount'] = gstAmount;
        row['Item - Total Price (incl. GST)'] = totalPriceInclGst;

        dataForExcel.push(row);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel, { header: headers, skipHeader: false });
    // Auto-adjust column widths
    const colWidths = headers.map(header => {
        const headerLength = header.length;
        // Find max length of data in this column, including header
        const columnData = dataForExcel.map(row => String(row[header] ?? '').length);
        const maxLength = Math.max(headerLength, ...columnData);
        return { wch: maxLength + 2 }; // Add a little padding
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `Invoice_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);

    toast({
        title: 'Export Successful',
        description: 'Filtered invoice report has been downloaded as an Excel file.',
    });
  }, [displayedInvoices, toast, invoiceSettings]);


  const handlePrintInvoice = useCallback(async (invoiceId: string, type: 'tax' | 'challan') => {
    const invoiceToPrint = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoiceToPrint || !companyProfile) {
      toast({ title: "Invoice or Company Profile not found", variant: "destructive" });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const MARGIN = 30;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
    let yPos = MARGIN;
    const LINE_HEIGHT = 11; 
    const SMALL_LINE_HEIGHT = 9;
    const SECTION_GAP = 10; 
    const HALF_SECTION_GAP = SECTION_GAP / 2;
    const LINE_WEIGHT_NORMAL = 0.75;
    const LINE_WEIGHT_THIN = 0.5;

    const addPageIfNeeded = (neededHeight: number) => {
      if (yPos + neededHeight > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        yPos = MARGIN;
      }
    };
    
    const addWrappedText = (text: string, x: number, y: number, options: { maxWidth?: number, align?: 'left' | 'center' | 'right', fontStyle?: 'bold' | 'normal', fontSize?: number } = {}) => {
        const currentSize = doc.getFontSize();
        const currentStyle = doc.getFont().fontStyle || 'normal';
        if (options.fontSize) doc.setFontSize(options.fontSize);
        if (options.fontStyle) doc.setFont('helvetica', options.fontStyle);

        const lines = doc.splitTextToSize(text, options.maxWidth || CONTENT_WIDTH);
        doc.text(lines, x, y, { align: options.align || 'left' });
        
        doc.setFontSize(currentSize);
        doc.setFont('helvetica', currentStyle);
        return y + lines.length * (options.fontSize ? options.fontSize * 1.1 : LINE_HEIGHT);
    };
    
    doc.setLineWidth(LINE_WEIGHT_NORMAL);

    // Section 1: Company Header
    doc.setFontSize(9);
    if (companyProfile.gstNumber) {
      doc.text(`GSTIN: ${companyProfile.gstNumber}`, MARGIN, yPos);
    }
    if (type === 'tax' && companyProfile.state && companyProfile.stateCode) {
      doc.text(`State: ${companyProfile.state} (Code: ${companyProfile.stateCode})`, PAGE_WIDTH - MARGIN, yPos, {align: 'right'});
    } else if (type === 'challan') {
       doc.text('Original For Recipient', PAGE_WIDTH - MARGIN, yPos, {align: 'right'});
    }
    yPos += LINE_HEIGHT * 0.8;


    doc.setFontSize(type === 'tax' ? 14 : 12); 
    doc.setFont('helvetica', 'bold');
    const invoiceTypeTitle = type === 'tax' ? 'TAX INVOICE' : 'DELIVERY CHALLAN';
    doc.text(invoiceTypeTitle, PAGE_WIDTH / 2, yPos + (LINE_HEIGHT / 2), { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    if (type === 'tax') {
        doc.setFontSize(8);
        doc.text('Original For Recipient', PAGE_WIDTH - MARGIN, yPos + (LINE_HEIGHT / 2) , { align: 'right' });
    }
    yPos += LINE_HEIGHT * 1.5;
    
    doc.setFontSize(18); 
    doc.setFont('helvetica', 'bold');
    yPos = addWrappedText(companyProfile.companyName.toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center', maxWidth: CONTENT_WIDTH }) - LINE_HEIGHT + 8; 
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let companyAddr = `${companyProfile.address || ''}${companyProfile.district ? ', ' + companyProfile.district : ''}${companyProfile.state ? ', ' + companyProfile.state : ''}${companyProfile.pincode ? ' - ' + companyProfile.pincode : ''}`;
    if (companyAddr.endsWith(', ')) companyAddr = companyAddr.slice(0, -2); 
    if (companyAddr) yPos = addWrappedText(companyAddr, PAGE_WIDTH / 2, yPos, { align: 'center', maxWidth: CONTENT_WIDTH, fontSize: SMALL_LINE_HEIGHT }); 
    
    let contactLine = [];
    if (companyProfile.phone) contactLine.push(`Phone No: ${companyProfile.phone}`);
    if (companyProfile.email) contactLine.push(`Email: ${companyProfile.email}`);
    if (contactLine.length > 0) yPos = addWrappedText(contactLine.join(' | '), PAGE_WIDTH / 2, yPos, { align: 'center', maxWidth: CONTENT_WIDTH, fontSize: SMALL_LINE_HEIGHT }); 
    
    if (companyProfile.stateCode && type === 'challan') { 
      yPos = addWrappedText(`State Code : ${companyProfile.stateCode}`, PAGE_WIDTH / 2, yPos, { align: 'center', maxWidth: CONTENT_WIDTH, fontSize: SMALL_LINE_HEIGHT });
    }

    if (type === 'tax' && companyProfile.panNumber) {
      yPos = addWrappedText(`PAN No: ${companyProfile.panNumber}`, PAGE_WIDTH / 2, yPos, { align: 'center', maxWidth: CONTENT_WIDTH, fontSize: SMALL_LINE_HEIGHT }); 
    }
    
    yPos += HALF_SECTION_GAP / (type === 'challan' ? 1 : 2) ; 
    if (type === 'tax') {
       doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos); 
       yPos += HALF_SECTION_GAP;
    } else { 
       const challanTitleWidth = doc.getTextWidth("DELIVERY CHALLAN");
       doc.setLineWidth(0.5);
       const challanTitleY = yPos - (LINE_HEIGHT*1.5) - (LINE_HEIGHT*0.2) ;
       doc.line((PAGE_WIDTH / 2) - (challanTitleWidth / 2) - 2 , challanTitleY , (PAGE_WIDTH / 2) + (challanTitleWidth / 2) + 2, challanTitleY );
       doc.setLineWidth(LINE_WEIGHT_NORMAL);
       yPos += SECTION_GAP * 0.8;
    }


    if (type === 'tax') {
        const col1X = MARGIN;
        const labelWidth = 90; 
        const col1ColonX = col1X + labelWidth + 2;
        const col1ValueX = col1ColonX + 5;

        const col2X = MARGIN + CONTENT_WIDTH * 0.53; 
        const col2ColonX = col2X + labelWidth + 2;
        const col2ValueX = col2ColonX + 5;
        
        const initialY2_1 = yPos;
        doc.setFontSize(9);
        let currentY1 = yPos;

        doc.text(`Invoice No.`, col1X, currentY1); doc.text(`:`, col1ColonX, currentY1); doc.text(`${invoiceToPrint.serialNo}`, col1ValueX, currentY1); currentY1 += LINE_HEIGHT;
        doc.text(`Invoice Date`, col1X, currentY1); doc.text(`:`, col1ColonX, currentY1); doc.text(`${format(parseISO(invoiceToPrint.invoiceDate as string), 'dd/MM/yyyy')}`, col1ValueX, currentY1); currentY1 += LINE_HEIGHT;
        doc.text(`Reverse Charge`, col1X, currentY1); doc.text(`:`, col1ColonX, currentY1); doc.text(`No`, col1ValueX, currentY1); currentY1 += LINE_HEIGHT;
        doc.text(`Eway Bill No & Date`, col1X, currentY1); doc.text(`:`, col1ColonX, currentY1); currentY1 += LINE_HEIGHT; 
        doc.text(`Distance`, col1X, currentY1); doc.text(`:`, col1ColonX, currentY1); 

        let currentY2 = initialY2_1;
        doc.text(`Shipping Company`, col2X, currentY2); doc.text(`:`, col2ColonX, currentY2); currentY2 += LINE_HEIGHT;
        doc.text(`Vehicle No`, col2X, currentY2); doc.text(`:`, col2ColonX, currentY2); currentY2 += LINE_HEIGHT;
        doc.text(`Place of Supply`, col2X, currentY2); doc.text(`:`, col2ColonX, currentY2); doc.text(`${invoiceToPrint.customerDetails.state || ''}`, col2ValueX, currentY2); currentY2 += LINE_HEIGHT;
        doc.text(`GR /RR.No`, col2X, currentY2); doc.text(`:`, col2ColonX, currentY2); currentY2 += LINE_HEIGHT;
        doc.text(`Station`, col2X, currentY2); doc.text(`:`, col2ColonX, currentY2); doc.text(`${invoiceToPrint.customerDetails.district || ''}`, col2ValueX, currentY2);

        yPos = Math.max(currentY1, currentY2) + HALF_SECTION_GAP;
        doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos); 
        yPos += HALF_SECTION_GAP;

        const customerSectionStartY = yPos;
        const addressBlockWidth = (CONTENT_WIDTH / 2) - (HALF_SECTION_GAP / 2); 
        
        let custAddrY = yPos;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(SMALL_LINE_HEIGHT);
        custAddrY = addWrappedText('Customer Name & Billing Address', MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT, fontStyle: 'bold' });
        doc.setFont('helvetica', 'normal');
        custAddrY = addWrappedText(invoiceToPrint.customerDetails.customerName.toUpperCase(), MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        const billingAddr = `${invoiceToPrint.customerDetails.address}, ${invoiceToPrint.customerDetails.district}, ${invoiceToPrint.customerDetails.state}${invoiceToPrint.customerDetails.pincode ? ' - ' + invoiceToPrint.customerDetails.pincode : ''}, India`;
        custAddrY = addWrappedText(billingAddr, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        if (invoiceToPrint.customerDetails.gstNo) {
            custAddrY = addWrappedText(`GSTIN / UIN: ${invoiceToPrint.customerDetails.gstNo}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceToPrint.customerDetails.mobileNo) {
           custAddrY = addWrappedText(`Phone: ${invoiceToPrint.customerDetails.mobileNo}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }

        if (invoiceSettings.enableAadharNo && invoiceToPrint.aadharNo) {
            custAddrY = addWrappedText(`Aadhar No: ${invoiceToPrint.aadharNo}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableNomineeName && invoiceToPrint.nomineeName) {
            custAddrY = addWrappedText(`Nominee: ${invoiceToPrint.nomineeName}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableRTO && invoiceToPrint.rto) {
            custAddrY = addWrappedText(`RTO: ${invoiceToPrint.rto}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableCustomerDOBDisplay && invoiceToPrint.customerDetails.dob && isValidDate(parseISO(invoiceToPrint.customerDetails.dob))) {
            custAddrY = addWrappedText(`DOB: ${format(parseISO(invoiceToPrint.customerDetails.dob), 'dd/MM/yyyy')}`, MARGIN, custAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        
        let shipAddrY = yPos; 
        const col2CustX = MARGIN + CONTENT_WIDTH / 2 + HALF_SECTION_GAP; 
        doc.setFont('helvetica', 'bold');
        shipAddrY = addWrappedText('Shipping Address', col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT, fontStyle: 'bold' });
        doc.setFont('helvetica', 'normal');
        shipAddrY = addWrappedText(invoiceToPrint.customerDetails.customerName.toUpperCase(), col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        const shippingAddressFullText = `${invoiceToPrint.customerDetails.address}, ${invoiceToPrint.customerDetails.district}, ${invoiceToPrint.customerDetails.state}${invoiceToPrint.customerDetails.pincode ? ' - ' + invoiceToPrint.customerDetails.pincode : ''}, India`;
        shipAddrY = addWrappedText(shippingAddressFullText, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        
        if (invoiceToPrint.customerDetails.gstNo) {
            shipAddrY = addWrappedText(`GSTIN / UIN: ${invoiceToPrint.customerDetails.gstNo}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceToPrint.customerDetails.mobileNo) {
           shipAddrY = addWrappedText(`Phone: ${invoiceToPrint.customerDetails.mobileNo}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableAadharNo && invoiceToPrint.aadharNo) {
            shipAddrY = addWrappedText(`Aadhar No: ${invoiceToPrint.aadharNo}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableNomineeName && invoiceToPrint.nomineeName) {
            shipAddrY = addWrappedText(`Nominee: ${invoiceToPrint.nomineeName}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableRTO && invoiceToPrint.rto) {
            shipAddrY = addWrappedText(`RTO: ${invoiceToPrint.rto}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }
        if (invoiceSettings.enableCustomerDOBDisplay && invoiceToPrint.customerDetails.dob && isValidDate(parseISO(invoiceToPrint.customerDetails.dob))) {
            shipAddrY = addWrappedText(`DOB: ${format(parseISO(invoiceToPrint.customerDetails.dob), 'dd/MM/yyyy')}`, col2CustX, shipAddrY, { maxWidth: addressBlockWidth, fontSize: SMALL_LINE_HEIGHT });
        }


        const customerBoxEndY = Math.max(custAddrY, shipAddrY) + HALF_SECTION_GAP;
        doc.line(MARGIN + CONTENT_WIDTH / 2, customerSectionStartY - (SMALL_LINE_HEIGHT * 0.2), MARGIN + CONTENT_WIDTH / 2, customerBoxEndY - (SMALL_LINE_HEIGHT * 0.8)); 
        yPos = customerBoxEndY;
        doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
        yPos += HALF_SECTION_GAP;
        
        doc.setFontSize(9); 
        doc.text(`Bill Type : ${invoiceToPrint.cashOrHypothecation || 'N/A'}`, MARGIN, yPos + LINE_HEIGHT*0.8);
        yPos += LINE_HEIGHT * 1.5;

    } else { // Delivery Challan
        const customerSectionStartY = yPos;
        const leftColX = MARGIN + 5;
        const leftLabelWidth = 65; 
        const leftColValueX = leftColX + leftLabelWidth + 5; 
        const rightColX = MARGIN + CONTENT_WIDTH * 0.63; 
        const rightLabelWidth = 60;
        const rightColValueX = rightColX + rightLabelWidth + 5; 

        let currentY = yPos + SMALL_LINE_HEIGHT + 2;
        doc.setFontSize(SMALL_LINE_HEIGHT);

        doc.setFont('helvetica', 'bold'); doc.text('Name', leftColX, currentY); doc.text(':', leftColX + leftLabelWidth -5, currentY); doc.setFont('helvetica', 'normal');
        let nameSoText = invoiceToPrint.customerDetails.customerName.toUpperCase();
        if (invoiceToPrint.customerDetails.fatherName) nameSoText += ` S/o ${invoiceToPrint.customerDetails.fatherName.toUpperCase()}`;
        currentY = addWrappedText(nameSoText, leftColValueX, currentY, { maxWidth: CONTENT_WIDTH * 0.6 - (leftColValueX - MARGIN) -5 , fontSize: SMALL_LINE_HEIGHT }) + 2;
        
        doc.setFont('helvetica', 'bold'); doc.text('Address', leftColX, currentY); doc.text(':', leftColX + leftLabelWidth -5, currentY); doc.setFont('helvetica', 'normal');
        const fullAddress = `${invoiceToPrint.customerDetails.address}, ${invoiceToPrint.customerDetails.district}, ${invoiceToPrint.customerDetails.state}${invoiceToPrint.customerDetails.pincode ? ' - ' + invoiceToPrint.customerDetails.pincode : ''}, India`;
        currentY = addWrappedText(fullAddress, leftColValueX, currentY, { maxWidth: CONTENT_WIDTH * 0.6 - (leftColValueX - MARGIN) - 5, fontSize: SMALL_LINE_HEIGHT }) + 2;
        
        let optionalY = currentY;
        const addOptionalChallanDetail = (label: string, value?: string | null, labelWidthOverride?: number) => {
            if (value && value.trim() !== '') {
                const currentLabelWidth = labelWidthOverride || leftLabelWidth;
                doc.setFont('helvetica', 'bold');
                doc.text(label, leftColX, optionalY); doc.text(':', leftColX + currentLabelWidth -5, optionalY);
                doc.setFont('helvetica', 'normal');
                optionalY = addWrappedText(value, leftColX + currentLabelWidth + 5, optionalY, {fontSize: SMALL_LINE_HEIGHT, maxWidth: CONTENT_WIDTH * 0.6 - (leftColX + currentLabelWidth + 5 - MARGIN) - 5}) + 2;
            }
        };

        if (invoiceToPrint.customerDetails.gstNo) addOptionalChallanDetail('GSTIN', invoiceToPrint.customerDetails.gstNo);
        addOptionalChallanDetail('Contact No.', invoiceToPrint.customerDetails.mobileNo, 65); 
        if (companyProfile.email) addOptionalChallanDetail('Email :', companyProfile.email); 

        if (invoiceSettings.enableAadharNo && invoiceToPrint.aadharNo) addOptionalChallanDetail('ADHAAR :', invoiceToPrint.aadharNo);
        if (invoiceSettings.enableCashOrHypothecation && invoiceToPrint.cashOrHypothecation) {
             addOptionalChallanDetail('HYP', invoiceToPrint.cashOrHypothecation);
        }
        
        if (invoiceSettings.enableCustomerDOBDisplay && invoiceToPrint.customerDetails.dob && isValidDate(parseISO(invoiceToPrint.customerDetails.dob))) {
            addOptionalChallanDetail('DOB', format(parseISO(invoiceToPrint.customerDetails.dob), 'dd/MM/yyyy'));
        }
        if (invoiceSettings.enableNomineeName && invoiceToPrint.nomineeName) addOptionalChallanDetail('Nomini :', invoiceToPrint.nomineeName);
        if (invoiceSettings.enableRTO && invoiceToPrint.rto) { 
            addOptionalChallanDetail('RTO', invoiceToPrint.rto.toUpperCase());
        }
        
        currentY = optionalY > currentY ? optionalY : currentY;

        let rightColCurrentY = yPos + SMALL_LINE_HEIGHT + 2;
        doc.setFont('helvetica', 'bold');
        doc.text('Invoice No.', rightColX, rightColCurrentY); doc.text(':', rightColX + rightLabelWidth -5, rightColCurrentY);
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceToPrint.serialNo, rightColValueX, rightColCurrentY);
        rightColCurrentY += SMALL_LINE_HEIGHT * 1.2;

        doc.setFont('helvetica', 'bold');
        doc.text('Invoice Date', rightColX, rightColCurrentY); doc.text(':', rightColX + rightLabelWidth -5, rightColCurrentY);
        doc.setFont('helvetica', 'normal');
        doc.text(format(parseISO(invoiceToPrint.invoiceDate as string), 'dd/MM/yyyy'), rightColValueX, rightColCurrentY);
        
        const customerBoxHeight = Math.max(currentY, rightColCurrentY + SMALL_LINE_HEIGHT) - customerSectionStartY + SMALL_LINE_HEIGHT;
        doc.setLineWidth(LINE_WEIGHT_NORMAL);
        doc.rect(MARGIN, customerSectionStartY, CONTENT_WIDTH, customerBoxHeight);
        doc.line(rightColX - 5, customerSectionStartY, rightColX - 5, customerSectionStartY + customerBoxHeight); 

        yPos = customerSectionStartY + customerBoxHeight + SECTION_GAP;
    }

    doc.setLineWidth(LINE_WEIGHT_THIN); 
    const itemTableStartY = yPos;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    const itemTableHeadersTax = ['S No', 'Description', 'HSN / SAC', 'Qty', 'UOM', 'Item Rate', 'Disc%', 'Amount (INR)'];
    const itemColWidthsTax = [ 
        CONTENT_WIDTH * 0.05, CONTENT_WIDTH * 0.28, CONTENT_WIDTH * 0.10, 
        CONTENT_WIDTH * 0.06, CONTENT_WIDTH * 0.07, CONTENT_WIDTH * 0.15, 
        CONTENT_WIDTH * 0.09, CONTENT_WIDTH * 0.20  
    ];
    
    const itemTableHeadersChallan = ['S No', 'Description', 'HSN / SAC', 'Qty', 'Remarks'];
    const itemColWidthsChallan = [
        CONTENT_WIDTH * 0.05, // S No
        CONTENT_WIDTH * 0.45, // Description
        CONTENT_WIDTH * 0.15, // HSN / SAC
        CONTENT_WIDTH * 0.10, // Qty
        CONTENT_WIDTH * 0.25  // Remarks
    ];

    const currentHeaders = type === 'tax' ? itemTableHeadersTax : itemTableHeadersChallan;
    const currentColWidths = type === 'tax' ? itemColWidthsTax : itemColWidthsChallan;

    let currentX = MARGIN;
    const headerTextY = itemTableStartY + LINE_HEIGHT * 0.9;
    doc.line(MARGIN, itemTableStartY, PAGE_WIDTH - MARGIN, itemTableStartY); 
    currentHeaders.forEach((header, i) => {
        doc.text(header, currentX + currentColWidths[i] / 2, headerTextY, {align: 'center'}); 
        doc.line(currentX, itemTableStartY, currentX, itemTableStartY + LINE_HEIGHT * 1.5); 
        currentX += currentColWidths[i];
    });
    doc.line(PAGE_WIDTH - MARGIN, itemTableStartY, PAGE_WIDTH - MARGIN, itemTableStartY + LINE_HEIGHT * 1.5); 
    const headerBottomY = itemTableStartY + LINE_HEIGHT * 1.5;
    doc.line(MARGIN, headerBottomY, PAGE_WIDTH - MARGIN, headerBottomY); 
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(SMALL_LINE_HEIGHT -1); 
    let totalQty = 0;
    let totalAmountPreTax = 0;
    let itemContentCurrentY = headerBottomY;

    invoiceToPrint.items.forEach((item, index) => {
        addPageIfNeeded(LINE_HEIGHT * 4); 
        const rowStartY = itemContentCurrentY;
        let maxRowHeight = 0;
        const itemLineHeight = SMALL_LINE_HEIGHT * 1.1;
        
        let cellX = MARGIN;
        let textYForRow = rowStartY + itemLineHeight * 0.9;
        
        // S.No
        doc.text(String(index + 1), cellX + currentColWidths[0] / 2, textYForRow + (type === 'challan' ? itemLineHeight * 1.3 : 0) , { align: 'center'}); 
        cellX += currentColWidths[0];

        // Description
        if (type === 'challan') {
            let descY = rowStartY + itemLineHeight * 0.9;
            const modelColor = `${item.modelName} ${item.colour}`;
            const chassisText = `Chassis No. : ${item.chassisNo}`;
            const engineText = `Engine No. : ${item.engineNo}`;

            doc.text(modelColor, cellX + 3, descY);
            descY += itemLineHeight;
            doc.text(chassisText, cellX + 3, descY);
            descY += itemLineHeight;
            doc.text(engineText, cellX + 3, descY);
            maxRowHeight = itemLineHeight * 3; 
            textYForRow = rowStartY + itemLineHeight * 1.3; 
        } else { // Tax Invoice Description
            let descText = `${item.modelName} ${item.colour}`;
            descText += `\nChassis No.: ${item.chassisNo}`;
            descText += `\nEngine No. : ${item.engineNo}`;
            const descLines = doc.splitTextToSize(descText, currentColWidths[1] - 6); 
            doc.text(descLines, cellX + 3, textYForRow);
            maxRowHeight = Math.max(maxRowHeight, descLines.length * itemLineHeight);
        }
        cellX += currentColWidths[1];


        if (type === 'tax') {
            const itemRate = item.price;
            const discountPerc = item.discountPercentage || 0;
            const itemAmount = itemRate * item.qty; 
            totalQty += item.qty;
            totalAmountPreTax += itemAmount;

            doc.text(item.hsnSac || companyProfile.gstNumber?.substring(2,6) || 'N/A', cellX + currentColWidths[2]/2, textYForRow, {align: 'center'}); cellX += currentColWidths[2];
            doc.text(String(item.qty), cellX + currentColWidths[3]/2, textYForRow, {align: 'center'}); cellX += currentColWidths[3];
            doc.text("NOS", cellX + currentColWidths[4]/2, textYForRow, {align: 'center'}); cellX += currentColWidths[4];
            doc.text(itemRate.toFixed(2), cellX + currentColWidths[5] - 3, textYForRow, {align: 'right'}); cellX += currentColWidths[5];
            doc.text(discountPerc.toFixed(2) + '%', cellX + currentColWidths[6] -3 , textYForRow, {align: 'right'}); cellX += currentColWidths[6];
            doc.text(itemAmount.toFixed(2), cellX + currentColWidths[7] -3, textYForRow, {align: 'right'});
            maxRowHeight = Math.max(maxRowHeight, itemLineHeight); 
        } else { // Delivery Challan - HSN, Qty, Remarks
            const hsnDisplay = item.hsnSac || companyProfile.gstNumber?.substring(2,6) || 'N/A';
            doc.text(hsnDisplay, cellX + currentColWidths[2]/2, textYForRow, {align: 'center'}); cellX += currentColWidths[2];
            doc.text(item.qty.toFixed(2), cellX + currentColWidths[3]/2, textYForRow, {align: 'center'}); cellX += currentColWidths[3];
            doc.text("", cellX + currentColWidths[4]/2, textYForRow, {align: 'center'}); // Remarks left blank
            totalQty += item.qty;
        }
        
        const actualRowHeight = maxRowHeight + (itemLineHeight * 0.4); 
        itemContentCurrentY += actualRowHeight; 
        doc.line(MARGIN, itemContentCurrentY, PAGE_WIDTH - MARGIN, itemContentCurrentY); 
        
        let vLineX = MARGIN;
        for(let i=0; i < currentColWidths.length; i++) {
            doc.line(vLineX, rowStartY, vLineX, itemContentCurrentY); 
            vLineX += currentColWidths[i];
        }
        doc.line(PAGE_WIDTH - MARGIN, rowStartY, PAGE_WIDTH - MARGIN, itemContentCurrentY); 
    });
    
    const itemTableContentEndY = itemContentCurrentY;
    const totalRowHeight = LINE_HEIGHT * 1.5;
    const totalRowY = itemTableContentEndY + totalRowHeight * 0.6; 
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    let totalColX = MARGIN; 
    if (type === 'challan') {
        const totalLabelX = MARGIN + currentColWidths[0] + currentColWidths[1] + (currentColWidths[2] / 2) - doc.getTextWidth("Total")/2 - 5; 
        doc.text('Total', totalLabelX , totalRowY, {align: 'right'}); 
        
        const qtyTotalX = MARGIN + currentColWidths[0] + currentColWidths[1] + currentColWidths[2] + (currentColWidths[3] / 2);
        doc.text(totalQty.toFixed(2), qtyTotalX, totalRowY, {align: 'center'});
    } else { // Tax Invoice Total
        totalColX += currentColWidths[0] + currentColWidths[1] + currentColWidths[2]; // SNo, Desc, HSN
        doc.text('Total', totalColX - currentColWidths[2]/2 -10, totalRowY, {align: 'left'});
        doc.text(totalQty.toFixed(0), totalColX + currentColWidths[3]/2, totalRowY, {align: 'center'}); 
        const amountColIndex = currentColWidths.length -1; 
        totalColX = MARGIN + currentColWidths.slice(0, amountColIndex).reduce((a,b) => a+b, 0); 
        doc.text(totalAmountPreTax.toFixed(2), totalColX + currentColWidths[amountColIndex] - 3, totalRowY, {align: 'right'}); 
    }
        
    doc.setFont('helvetica', 'normal');
    const itemTableFooterEndY = itemTableContentEndY + totalRowHeight;
    doc.line(MARGIN, itemTableFooterEndY, PAGE_WIDTH - MARGIN, itemTableFooterEndY); 

    let vLineTotalX = MARGIN;
    for(let i=0; i < currentColWidths.length; i++) {
        doc.line(vLineTotalX, itemTableContentEndY, vLineTotalX, itemTableFooterEndY);
        vLineTotalX += currentColWidths[i];
    }
    doc.line(PAGE_WIDTH - MARGIN, itemTableContentEndY, PAGE_WIDTH - MARGIN, itemTableFooterEndY);

    yPos = itemTableFooterEndY + SECTION_GAP;
    doc.setLineWidth(LINE_WEIGHT_NORMAL); 


    let taxableValueSum = 0;
    let cgstSum = 0;
    let sgstSum = 0;
    let igstSum = 0;
    
    if (type === 'tax') {
        addPageIfNeeded(LINE_HEIGHT * 12); 
        const narrationLogisticsStartY = yPos;
        let narrationY = yPos;
        doc.setFontSize(9);
        doc.text(`Narration`, MARGIN, narrationY);
        narrationY = addWrappedText(`: Being Goods Sold To ${invoiceToPrint.customerDetails.customerName} Against Dispatch No: ${invoiceToPrint.serialNo}`, MARGIN + 50, yPos, { maxWidth: CONTENT_WIDTH * 0.6 - 55, fontSize: SMALL_LINE_HEIGHT });
        
        let logisticsY = narrationY + HALF_SECTION_GAP;
        doc.setFontSize(8);
        doc.setFont('helvetica','bold');
        doc.text(`Logistics Info`, MARGIN, logisticsY); logisticsY += LINE_HEIGHT;
        doc.setFont('helvetica','normal');
        doc.text(`Charges Paid`, MARGIN, logisticsY); doc.text(`: ${invoiceToPrint.accessoriesAmount?.toFixed(2) || '0.00'}`, MARGIN + 70, logisticsY);
        doc.text(`Mode`, MARGIN + CONTENT_WIDTH * 0.3, logisticsY); doc.text(`: Road`, MARGIN + CONTENT_WIDTH * 0.3 + 30, logisticsY);
        logisticsY += LINE_HEIGHT;
        doc.text(`No of Packets`, MARGIN, logisticsY); doc.text(`: 1`, MARGIN + 70, logisticsY);
        doc.text(`Weight`, MARGIN + CONTENT_WIDTH * 0.3, logisticsY); doc.text(`: 0.00`, MARGIN + CONTENT_WIDTH * 0.3 + 30, logisticsY);
        logisticsY += LINE_HEIGHT;
        doc.text(`Document extra info`, MARGIN, logisticsY); logisticsY += LINE_HEIGHT;
        if (invoiceSettings.enableRTO && invoiceToPrint.rto) {
          doc.text(`RTO`, MARGIN, logisticsY); doc.text(`: ${invoiceToPrint.rto}`, MARGIN + 70, logisticsY);
        } else {
          doc.text(`RTO`, MARGIN, logisticsY); doc.text(`: N/A`, MARGIN + 70, logisticsY);
        }
        
        const totalsXLabel = PAGE_WIDTH - MARGIN - 120; 
        const totalsXValue = PAGE_WIDTH - MARGIN - 3;  
        let totalsY = narrationLogisticsStartY;

        doc.setFontSize(9);
        invoiceToPrint.items.forEach(item => {
            const itemRate = item.price;
            const taxableAmountForItem = itemRate * item.qty;
            taxableValueSum += taxableAmountForItem;

            if (companyProfile.state?.toLowerCase() === invoiceToPrint.customerDetails.state?.toLowerCase()) {
                cgstSum += (taxableAmountForItem * (item.gst / 2)) / 100;
                sgstSum += (taxableAmountForItem * (item.gst / 2)) / 100;
            } else {
                igstSum += (taxableAmountForItem * item.gst) / 100;
            }
        });

        doc.text('Sub Total', totalsXLabel, totalsY); doc.text(taxableValueSum.toFixed(2), totalsXValue, totalsY, { align: 'right' }); totalsY += LINE_HEIGHT;
        doc.text('Round Off', totalsXLabel, totalsY); doc.text('0.00', totalsXValue, totalsY, { align: 'right' }); totalsY += LINE_HEIGHT * 1.2;
        doc.setFont('helvetica', 'bold');
        const billTotal = taxableValueSum + cgstSum + sgstSum + igstSum + (invoiceToPrint.insuranceAmount || 0) + (invoiceToPrint.registrationAmount || 0) + (invoiceToPrint.accessoriesAmount || 0); 
        doc.text('Bill Total', totalsXLabel, totalsY); doc.text(billTotal.toFixed(2), totalsXValue, totalsY, { align: 'right' }); totalsY += LINE_HEIGHT;
        doc.setFont('helvetica', 'normal');

        yPos = Math.max(logisticsY, totalsY) + HALF_SECTION_GAP;
        doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos); 
        yPos += HALF_SECTION_GAP;

        doc.setLineWidth(LINE_WEIGHT_THIN); 
        const taxTableStartY = yPos;
        const taxHeaders = ['Tax Rate', 'Taxable Value', 'CGST Amount', 'SGST Amount', 'IGST Amount', 'Total Tax'];
        const taxColWidths = [ 
            CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.20, CONTENT_WIDTH * 0.16, 
            CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16
        ];
        
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        currentX = MARGIN;
        const taxHeaderTextY = taxTableStartY + LINE_HEIGHT * 0.9; 
        doc.line(MARGIN, taxTableStartY, PAGE_WIDTH - MARGIN, taxTableStartY); 
        taxHeaders.forEach((header, i) => {
            doc.text(header, currentX + taxColWidths[i]/2, taxHeaderTextY, {align: 'center'}); 
            doc.line(currentX, taxTableStartY, currentX, taxTableStartY + LINE_HEIGHT * 2.4);
            currentX += taxColWidths[i];
        });
        doc.line(PAGE_WIDTH-MARGIN, taxTableStartY, PAGE_WIDTH-MARGIN, taxTableStartY + LINE_HEIGHT * 2.4);
        const taxHeaderBottomY = taxTableStartY + LINE_HEIGHT * 1.2;
        doc.line(MARGIN, taxHeaderBottomY, PAGE_WIDTH - MARGIN, taxHeaderBottomY); 

        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        const taxDataY = taxHeaderBottomY + LINE_HEIGHT * 0.9; 
        currentX = MARGIN;
        const gstRateDisplay = invoiceToPrint.items.length > 0 ? `${invoiceToPrint.items[0].gst}%` : '0%'; 
        doc.text(`TAX @ ${gstRateDisplay}`, currentX + taxColWidths[0]/2, taxDataY, {align: 'center'}); currentX += taxColWidths[0];
        doc.text(taxableValueSum.toFixed(2), currentX + taxColWidths[1]/2, taxDataY, {align: 'center'}); currentX += taxColWidths[1];
        doc.text(cgstSum.toFixed(2), currentX + taxColWidths[2]/2, taxDataY, {align: 'center'}); currentX += taxColWidths[2];
        doc.text(sgstSum.toFixed(2), currentX + taxColWidths[3]/2, taxDataY, {align: 'center'}); currentX += taxColWidths[3];
        doc.text(igstSum.toFixed(2), currentX + taxColWidths[4]/2, taxDataY, {align: 'center'}); currentX += taxColWidths[4];
        doc.text((cgstSum + sgstSum + igstSum).toFixed(2), currentX + taxColWidths[5]/2, taxDataY, {align: 'center'});
        
        const taxDataBottomY = taxHeaderBottomY + LINE_HEIGHT * 1.2;
        doc.line(MARGIN, taxDataBottomY, PAGE_WIDTH - MARGIN, taxDataBottomY); 
        
        let vTaxLineX = MARGIN;
        for(let i=0; i < taxColWidths.length; i++) {
            doc.line(vTaxLineX, taxHeaderBottomY, vTaxLineX, taxDataBottomY);
            vTaxLineX += taxColWidths[i];
        }
        doc.line(PAGE_WIDTH-MARGIN, taxHeaderBottomY, PAGE_WIDTH-MARGIN, taxDataBottomY);

        yPos = taxDataBottomY + HALF_SECTION_GAP;
        doc.setLineWidth(LINE_WEIGHT_NORMAL); 

        doc.setFontSize(9);
        doc.text(`Tax Amount : INR --- AMOUNT IN WORDS PLACEHOLDER --- Only`, MARGIN, yPos); yPos += LINE_HEIGHT;
        doc.text(`Bill Amount  : INR --- ${billTotal.toFixed(2)} IN WORDS PLACEHOLDER --- Only`, MARGIN, yPos); yPos += LINE_HEIGHT;
        doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos); 
        yPos += SECTION_GAP;
    }


    addPageIfNeeded(130); 
    let footerStartY = Math.max(yPos, PAGE_HEIGHT - MARGIN - (type === 'challan' ? 80 : 120));
    yPos = footerStartY;
    
    if (type === 'challan') {
         yPos = PAGE_HEIGHT - MARGIN - 80; 
         footerStartY = yPos;
    }
    

    if (type === 'tax') {
        doc.line(MARGIN, footerStartY - HALF_SECTION_GAP, PAGE_WIDTH - MARGIN, footerStartY - HALF_SECTION_GAP); 
    }


    const signatureWidth = CONTENT_WIDTH * 0.40;
    const termsWidth = type === 'tax' ? CONTENT_WIDTH * 0.55 : 0;
    
    if (type === 'tax') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        let termsY = footerStartY;
        doc.text('Terms & Conditions:', MARGIN, termsY);
        doc.setFont('helvetica', 'normal');
        termsY += LINE_HEIGHT * 0.8;
        const terms = (companyProfile.termsAndConditions || DEFAULT_COMPANY_PROFILE.termsAndConditions).split('\n');
        terms.forEach(term => {
            if (termsY > PAGE_HEIGHT - MARGIN - LINE_HEIGHT * 2.5) { 
            }
            const termLines = doc.splitTextToSize(term, termsWidth - 5);
            termLines.forEach((line: string) => {
                if (termsY > PAGE_HEIGHT - MARGIN - LINE_HEIGHT * 2.5) return;
                doc.text(line, MARGIN, termsY, {fontSize: SMALL_LINE_HEIGHT -1});
                termsY += SMALL_LINE_HEIGHT;
            });
        });
    }
    
    let signatureY = footerStartY;
    doc.setFontSize(9);
    
    if (type === 'tax') {
        const receiverSigX = MARGIN;
        const companySigX = MARGIN + termsWidth + (CONTENT_WIDTH * 0.05);

        doc.text(`Receiver's Signature`, receiverSigX + signatureWidth / 2, signatureY + LINE_HEIGHT * 0.8, { align: 'center'});
        doc.rect(receiverSigX, signatureY + LINE_HEIGHT, signatureWidth, LINE_HEIGHT * 3.5); 
        
        let companySigY = signatureY + LINE_HEIGHT * 3.5 + LINE_HEIGHT + SECTION_GAP;
        doc.setFont('helvetica', 'bold');
        doc.text(`For ${companyProfile.companyName}`, companySigX + signatureWidth / 2, companySigY + LINE_HEIGHT * 0.8, { align: 'center'});
        doc.rect(companySigX, companySigY + LINE_HEIGHT, signatureWidth, LINE_HEIGHT * 4.5); 
        companySigY += LINE_HEIGHT * 4.5 + LINE_HEIGHT + HALF_SECTION_GAP;
        doc.setFont('helvetica', 'normal');
        doc.text(`Authorised Signatory`, companySigX + signatureWidth / 2, companySigY, { align: 'center'});

    } else { // Delivery Challan Footer
        const forCompanyText = `For ${companyProfile.companyName.toUpperCase()}`;
        const forCompanyTextWidth = doc.getTextWidth(forCompanyText);
        const forCompanyX = PAGE_WIDTH - MARGIN - signatureWidth + (signatureWidth - forCompanyTextWidth) / 2 ;
        const footerTextY = PAGE_HEIGHT - MARGIN - SMALL_LINE_HEIGHT * 3.5; 


        doc.text(`Receiver's Signature`, MARGIN + signatureWidth / 2, footerTextY, { align: 'center'}); 
        
        doc.setFont('helvetica', 'bold');
        doc.text(forCompanyText, forCompanyX, footerTextY - LINE_HEIGHT * 1.5 , { align: 'left'}); 
        doc.setFont('helvetica', 'normal');
        doc.text(`Authorised Signatory`, PAGE_WIDTH - MARGIN - signatureWidth / 2, footerTextY, { align: 'center'});
    }

    doc.setFontSize(8);
    doc.text(`Page : ${doc.getCurrentPageInfo().pageNumber} / ${doc.getNumberOfPages()}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN + 10, {align: 'right'});

    doc.save(`${type}_${invoiceToPrint.serialNo}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`);
    toast({ title: "PDF Generated", description: `${type === 'tax' ? 'Tax Invoice' : 'Delivery Challan'} PDF has been downloaded.` });

  }, [allInvoices, companyProfile, toast, invoiceSettings]);


  if (!isMounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoices" description="Create, manage, and print sales invoices." className="flex-shrink-0">
           <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </PageHeader>
        <p>Loading invoice data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Invoices" description="Create, manage, and print sales invoices." className="flex-shrink-0">
        <div className="flex items-end space-x-2">
           <div>
            <Label htmlFor="filterStartDateInvoice" className="text-xs">Invoice Date From:</Label>
            <Input
              type="date"
              id="filterStartDateInvoice"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="filterEndDateInvoice" className="text-xs">Invoice Date To:</Label>
            <Input
              type="date"
              id="filterEndDateInvoice"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-9"
            />
          </div>
            <Button onClick={handleExcelExport} variant="outline" className="h-9">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                setIsFormOpen(isOpen);
                if (!isOpen) {
                    setSelectedInvoice(null);
                }
            }}>
                <DialogTrigger asChild>
                <Button onClick={openFormForNew} className="h-9">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
                </Button>
                </DialogTrigger>
                <DialogContent className="w-full h-full max-w-none max-h-none sm:w-[95vw] sm:h-[95vh] sm:max-w-[95vw] sm:max-h-[95vh] flex flex-col p-0 sm:p-2 md:p-4 sm:rounded-lg overflow-hidden">
                  <DialogHeader className="p-4 sm:p-2 md:p-2 border-b">
                      <DialogTitle>{selectedInvoice ? `Edit Invoice ${selectedInvoice.serialNo}` : 'Create New Invoice'}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-grow overflow-hidden">
                    <MemoizedInvoiceForm
                        invoiceData={selectedInvoice}
                        customers={customers}
                        availableStockItems={stockItems.filter(item => !item.sold || (selectedInvoice && selectedInvoice.items.some(invItem => invItem.stockItemId === item.id)))}
                        invoiceSettings={invoiceSettings}
                        onSave={handleSaveInvoice}
                        onCancel={handleCancelForm}
                        generateSerialNumber={generateNewSerialNumber}
                        onPrint={handlePrintInvoice}
                        onAddNewCustomer={handleAddNewCustomerToList}
                        CustomerFormComponent={MemoizedCustomerForm}
                        defaultStateFromCompany={companyProfile?.state}
                        defaultDistrictFromCompany={companyProfile?.district}
                    />
                  </div>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>

      <div className="flex-grow overflow-y-auto">
        <MemoizedInvoiceReport
          invoices={displayedInvoices}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onPrint={handlePrintInvoice}
        />
      </div>
    </div>
  );
}

