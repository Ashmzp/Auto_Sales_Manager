import React from 'react';
import { Invoice } from '@/types';
import { format } from 'date-fns';

interface PrintDocumentProps {
  invoice: Invoice;
  type: 'tax' | 'challan';
}

const PrintDocument: React.FC<PrintDocumentProps> = ({ invoice, type }) => {
  const isTaxInvoice = type === 'tax';
  const companyDetails = {
    gstin: '09ABICS4308K1Z0',
    name: 'Shukla Automotive Pvt Ltd',
    address: 'Natwa Chauki, Jangi Road, Mirzapur, Uttar Pradesh - 231001, India',
    phone: '9151060432',
    email: 'shuklatvsmzp2022@gmail.com',
    stateCode: '09',
  };

  return (
    <div
      className="p-6 font-sans text-[13px] print:p-0 print:text-xs w-[820px] mx-auto bg-white flex flex-col"
      style={{ minHeight: '1122px' }} // A4 height in px at 96dpi
    >
      {/* Header and Customer Details */}
      <div className="border-b-2 pb-2 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">{companyDetails.name}</h1>
            <p>{companyDetails.address}</p>
            <p>GSTIN: {companyDetails.gstin}</p>
            <p>Phone: {companyDetails.phone} | Email: {companyDetails.email}</p>
            <p>State Code: {companyDetails.stateCode}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Original For Recipient</p>
            <h2 className="text-xl font-bold">
              {isTaxInvoice ? 'TAX INVOICE' : 'DELIVERY CHALLAN'}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        {/* Invoice Details */}
        <div className="w-1/3">
          <p>
            <span className="font-semibold">Invoice No.:</span> {invoice.serialNo}
          </p>
          <p>
            <span className="font-semibold">Invoice Date:</span>{' '}
            {invoice.invoiceDate
              ? format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')
              : 'N/A'}
          </p>
        </div>
        {/* Customer Details */}
        <div className="w-2/3">
          <p>
            <span className="font-semibold">Name:</span>{' '}
            {invoice.customerDetails.customerName}
          </p>
          <p>
            <span className="font-semibold">Address:</span>{' '}
            {invoice.customerDetails.address || 'N/A'}
          </p>
          {invoice.customerDetails.gstNo && (
            <p>
              <span className="font-semibold">GSTIN:</span>{' '}
              {invoice.customerDetails.gstNo}
            </p>
          )}
          <p>
            <span className="font-semibold">Contact No.:</span>{' '}
            {invoice.customerDetails.mobileNo || 'N/A'}
          </p>
          <p>
            <span className="font-semibold">Email:</span>{' '}
            {invoice.customerDetails.email || 'N/A'}
          </p>
          {invoice.aadhaar && (
            <p>
              <span className="font-semibold">Aadhaar:</span> {invoice.aadhaar}
            </p>
          )}
          {invoice.cashOrHypothecation && (
            <p>
              <span className="font-semibold">Party PAN:</span>{' '}
              {invoice.cashOrHypothecation}
            </p>
          )}
          {invoice.dob && (
            <p>
              <span className="font-semibold">DOB:</span> {invoice.dob}
            </p>
          )}
          {invoice.nominee && (
            <p>
              <span className="font-semibold">Nominee:</span> {invoice.nominee}
            </p>
          )}
          {invoice.rto && (
            <p>
              <span className="font-semibold">RTO:</span> {invoice.rto}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 flex flex-col">
        <table className="w-full border border-black mb-0 text-xs flex-1" style={{ height: '100%' }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">S No</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">HSN/SAC</th>
              <th className="border p-2 text-center">Qty</th>
              <th className="border p-2 text-left">Remarks</th>
              {isTaxInvoice && (
                <>
                  <th className="border p-2 text-right">Rate (₹)</th>
                  <th className="border p-2 text-right">GST (%)</th>
                  <th className="border p-2 text-right">Total (₹)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.chassisNo}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">
                  {item.modelName}
                  <br />
                  Chassis No.: {item.chassisNo}
                  <br />
                  Engine No.: {item.engineNo || 'N/A'}
                </td>
                <td className="border p-2">{item.hsnSac || '87112019'}</td>
                <td className="border p-2 text-center">{item.quantity || 1}</td>
                <td className="border p-2">{item.remarks || 'N/A'}</td>
                {isTaxInvoice && (
                  <>
                    <td className="border p-2 text-right">
                      {item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="border p-2 text-right">{item.gst || 0}</td>
                    <td className="border p-2 text-right">
                      {(item.price + (item.price * (item.gst || 0) / 100)).toLocaleString('en-IN')}
                    </td>
                  </>
                )}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="border p-2"></td>
              <td className="border p-2">Total</td>
              <td className="border p-2"></td>
              <td className="border p-2 text-center">
                {invoice.items.reduce((sum, item) => sum + (item.quantity || 1), 0)}
              </td>
              <td className="border p-2"></td>
              {isTaxInvoice && (
                <>
                  <td className="border p-2"></td>
                  <td className="border p-2"></td>
                  <td className="border p-2 text-right">
                    {invoice.totalAmount?.toLocaleString('en-IN') || 'N/A'}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
        {/* Footer */}
        <table className="w-full border border-black border-t-0 text-xs" style={{ minHeight: 80 }}>
          <tbody>
            <tr>
              <td className="border-0 p-2" colSpan={3}>
                <p className="font-semibold">For {companyDetails.name}</p>
                <p className="mt-8">Authorised Signatory</p>
              </td>
              <td className="border-0 p-2 text-right" colSpan={3}>
                <p className="font-semibold">Receiver's Signature</p>
                <p className="mt-8">____________________</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-xs text-right mt-1">Page : 1/1</div>
    </div>
  );
};

export default PrintDocument;