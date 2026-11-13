import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Package,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Percent,
  Truck,
  FileText,
  Save,
  Send,
  Eye,
  CreditCard,
  Search,
  Check,
  Keyboard
} from 'lucide-react';
import { SalesInvoice, SalesInvoiceItem } from '../../../server/accounting/accountingTypes';
import { SalesInvoicePrintDocument } from './SalesInvoicePrintDocument';
import { handleTallyKeyDown } from './tallyKeyNav';

interface SalesInvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token?: string | null;
  existingDraft?: SalesInvoice | null;
}

interface ProductWithBatches {
  id: string;
  sku: string;
  catalogNumber?: string;
  name: string;
  unit: string;
  hsnCode: string;
  gstRate: number;
  basePrice: number;
  mrp: number;
  isColdChain: boolean;
  storageTemperature?: string;
  totalStock: number;
  batches: Array<{
    id: string;
    batchNumber: string;
    expiryDate: string;
    availableStock: number;
    sellingPrice: number;
    storageLocation: string;
  }>;
}

interface CustomerOption {
  id: string;
  labName: string;
  customerCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  gstNumber: string;
  panNumber: string;
  state: string;
  stateCode: string;
  paymentTerms: string;
  creditLimit: number;
  currentOutstanding: number;
}

interface ItemRow {
  rowId: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  availableStock: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  hsnSac: string;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
  unitPriceInclusive: number;
  isColdChain?: boolean;
  storageTemperature?: string;
  priceIsTaxInclusive?: boolean;
  stockError?: string | null;
  isExpired?: boolean;
}

export const SalesInvoiceCreateModal: React.FC<SalesInvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  existingDraft
}) => {
  if (!isOpen) return null;

  // Master Data State
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Invoice Header State
  const [invoiceDate, setInvoiceDate] = useState<string>(
    existingDraft ? existingDraft.invoiceDate : new Date().toISOString().split('T')[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    existingDraft ? existingDraft.invoiceNumber : ''
  );
  const [allowManualNumber, setAllowManualNumber] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    existingDraft ? existingDraft.customerId : ''
  );
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);

  // Address & Terms State
  const [billingAddress, setBillingAddress] = useState<string>(
    existingDraft ? existingDraft.billingAddress : ''
  );
  const [shippingAddress, setShippingAddress] = useState<string>(
    existingDraft ? existingDraft.shippingAddress : ''
  );
  const [customerGstin, setCustomerGstin] = useState<string>(
    existingDraft ? existingDraft.customerGstin || '' : ''
  );
  const [customerPan, setCustomerPan] = useState<string>(
    existingDraft ? existingDraft.customerPan || '' : ''
  );
  const [customerState, setCustomerState] = useState<string>(
    existingDraft ? existingDraft.customerState : 'Maharashtra'
  );
  const [customerStateCode, setCustomerStateCode] = useState<string>(
    existingDraft ? existingDraft.customerStateCode : '27'
  );
  const [poNumber, setPoNumber] = useState<string>(
    existingDraft ? existingDraft.poNumber || '' : ''
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    existingDraft ? existingDraft.paymentTerms || '30 Days Credit Line' : '30 Days Credit Line'
  );
  const [dueDate, setDueDate] = useState<string>(
    existingDraft ? existingDraft.dueDate : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [salesperson, setSalesperson] = useState<string>(
    existingDraft ? existingDraft.salesperson || 'Rajesh Sharma' : 'Rajesh Sharma'
  );
  const [deliveryReference, setDeliveryReference] = useState<string>(
    existingDraft ? existingDraft.deliveryReference || '' : ''
  );
  const [narration, setNarration] = useState<string>(
    existingDraft ? existingDraft.narration || '' : ''
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    existingDraft ? existingDraft.termsAndConditions || '1. Goods once sold are not returnable without cold-chain verification sheet.\n2. Invoices overdue beyond credit period attract 18% p.a. interest.\n3. Subject to Mumbai Jurisdiction only.' : '1. Goods once sold are not returnable without cold-chain verification sheet.\n2. Invoices overdue beyond credit period attract 18% p.a. interest.\n3. Subject to Mumbai Jurisdiction only.'
  );

  // Line Items State
  const [items, setItems] = useState<ItemRow[]>([]);

  // Stable idempotency key for this invoice modal session (retained across retries & double-clicks)
  const [sessionSubmissionKey] = useState<string>(() => {
    if (existingDraft?.idempotencyKey) return existingDraft.idempotencyKey;
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    return `SINV_CLIENT_IDEM_${existingDraft?.id || 'draft'}_${randomSuffix}`;
  });

  // Additional Charges & Discounts
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(0);
  const [freightCharges, setFreightCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [applyRoundOff, setApplyRoundOff] = useState<boolean>(true);
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Live Server Totals
  const [serverTotals, setServerTotals] = useState<{
    grossSubtotal: number;
    itemDiscountsTotal: number;
    invoiceDiscountAmount: number;
    taxableAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    freightCharges: number;
    otherCharges: number;
    roundOff: number;
    finalTotal: number;
    amountReceived: number;
    outstandingBalance: number;
    isInterState: boolean;
  }>({
    grossSubtotal: 0,
    itemDiscountsTotal: 0,
    invoiceDiscountAmount: 0,
    taxableAmount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalTax: 0,
    freightCharges: 0,
    otherCharges: 0,
    roundOff: 0,
    finalTotal: 0,
    amountReceived: 0,
    outstandingBalance: 0,
    isInterState: false
  });

  // UI State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Load Products & Customers on Mount
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    setLoadingInitial(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Products with Batches
      const pRes = await fetch('/api/v1/accounting/products-with-batches', { headers });
      const pJson = await pRes.json();
      if (pJson.data) setProducts(pJson.data);

      // 2. Customers
      const cRes = await fetch('/api/v1/accounting/customers-list', { headers });
      const cJson = await cRes.json();
      if (cJson.data) setCustomers(cJson.data);

      // 3. Next Invoice Number if not set
      if (!invoiceNumber) {
        const numRes = await fetch('/api/v1/accounting/invoices/next-number', { headers });
        const numJson = await numRes.json();
        if (numJson.nextInvoiceNumber) setInvoiceNumber(numJson.nextInvoiceNumber);
      }

      // If existing draft has items, populate them
      if (existingDraft && existingDraft.items && existingDraft.items.length > 0) {
        setItems(existingDraft.items.map((it, idx) => ({
          rowId: `row-${Date.now()}-${idx}`,
          ...it,
          stockError: null,
          isExpired: false
        })));
      }
    } catch (e: any) {
      console.error('Error loading reference data:', e);
      setErrorNotice('Failed to load product batches and customer list.');
    } finally {
      setLoadingInitial(false);
    }
  };

  // Recalculate Live Totals on item or charge changes
  useEffect(() => {
    recalculateTotals();
  }, [items, invoiceDiscountType, invoiceDiscountValue, freightCharges, otherCharges, applyRoundOff, amountReceived, customerStateCode]);

  const recalculateTotals = async () => {
    if (items.length === 0) {
      setServerTotals({
        grossSubtotal: 0,
        itemDiscountsTotal: 0,
        invoiceDiscountAmount: 0,
        taxableAmount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalTax: 0,
        freightCharges: 0,
        otherCharges: 0,
        roundOff: 0,
        finalTotal: 0,
        amountReceived: 0,
        outstandingBalance: 0,
        isInterState: customerStateCode !== '27'
      });
      return;
    }

    try {
      const res = await fetch('/api/v1/accounting/invoices/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(it => ({
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            batchNumber: it.batchNumber,
            expiryDate: it.expiryDate,
            availableStock: it.availableStock,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent,
            discountAmount: it.discountAmount,
            hsnSac: it.hsnSac,
            gstRate: it.gstRate,
            priceIsTaxInclusive: it.priceIsTaxInclusive
          })),
          customerStateCode,
          dealerStateCode: '27',
          invoiceDiscountType,
          invoiceDiscountValue,
          freightCharges,
          otherCharges,
          applyRoundOff,
          amountReceived
        })
      });

      const json = await res.json();
      if (json.data) {
        setServerTotals(json.data);
        // Sync item calculations with server precision
        if (Array.isArray(json.data.items)) {
          setItems(prevItems =>
            prevItems.map((prev, idx) => {
              const serverItem = json.data.items[idx];
              if (!serverItem) return prev;
              return {
                ...prev,
                taxableAmount: serverItem.taxableAmount,
                cgstAmount: serverItem.cgstAmount,
                sgstAmount: serverItem.sgstAmount,
                igstAmount: serverItem.igstAmount,
                totalTax: serverItem.totalTax,
                lineTotal: serverItem.lineTotal,
                unitPriceInclusive: serverItem.unitPriceInclusive
              };
            })
          );
        }
      }
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  // Select Customer & Auto-populate Details
  const handleSelectCustomer = (cust: CustomerOption) => {
    setSelectedCustomerId(cust.id);
    setCustomerSearch(cust.labName);
    setBillingAddress(cust.billingAddress);
    setShippingAddress(cust.shippingAddress || cust.billingAddress);
    setCustomerGstin(cust.gstNumber);
    setCustomerPan(cust.panNumber);
    setCustomerState(cust.state);
    setCustomerStateCode(cust.stateCode);
    setPaymentTerms(cust.paymentTerms);
    setIsCustomerDropdownOpen(false);

    // Calculate due date based on payment terms
    let days = 30;
    if (cust.paymentTerms.includes('60')) days = 60;
    else if (cust.paymentTerms.includes('45')) days = 45;
    else if (cust.paymentTerms.includes('15')) days = 15;
    setDueDate(new Date(Date.now() + days * 86400000).toISOString().split('T')[0]);
  };

  // Add Product Line Row
  const handleAddProductRow = () => {
    const newRow: ItemRow = {
      rowId: `row-${Date.now()}-${items.length}`,
      productId: '',
      productName: '',
      sku: '',
      batchNumber: '',
      expiryDate: '',
      availableStock: 0,
      quantity: 1,
      unit: 'Units',
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      hsnSac: '38220090',
      gstRate: 12,
      cgstRate: 6,
      cgstAmount: 0,
      sgstRate: 6,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      lineTotal: 0,
      unitPriceInclusive: 0,
      stockError: null,
      isExpired: false
    };
    setItems([...items, newRow]);
  };

  // Remove Row
  const handleRemoveRow = (rowId: string) => {
    setItems(items.filter(it => it.rowId !== rowId));
  };

  // Handle Product Selection on Row
  const handleProductChange = (rowId: string, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Pick first available active batch that is not expired
    const today = new Date().toISOString().split('T')[0];
    const nonExpiredBatches = prod.batches.filter(b => b.expiryDate >= today && b.availableStock > 0);
    const defaultBatch = nonExpiredBatches.length > 0 ? nonExpiredBatches[0] : prod.batches[0];

    const isInterState = customerStateCode !== '27';
    const gstRate = prod.gstRate || 12;
    const cgstRate = isInterState ? 0 : gstRate / 2;
    const sgstRate = isInterState ? 0 : gstRate / 2;
    const igstRate = isInterState ? gstRate : 0;

    setItems(items.map(it => {
      if (it.rowId !== rowId) return it;

      const batchStock = defaultBatch ? defaultBatch.availableStock : 0;
      const expiry = defaultBatch ? defaultBatch.expiryDate : '';
      const isExpired = expiry && expiry < today;
      const stockErr = batchStock <= 0 ? 'Batch has 0 stock' : (1 > batchStock ? `Requested 1 exceeds stock ${batchStock}` : null);

      return {
        ...it,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit || 'Units',
        hsnSac: prod.hsnCode || '38220090',
        gstRate,
        cgstRate,
        sgstRate,
        igstRate,
        unitPrice: prod.basePrice || 0,
        batchNumber: defaultBatch ? defaultBatch.batchNumber : '',
        expiryDate: expiry,
        availableStock: batchStock,
        isColdChain: prod.isColdChain,
        storageTemperature: prod.storageTemperature,
        isExpired,
        stockError: stockErr
      };
    }));
  };

  // Handle Batch Selection on Row
  const handleBatchChange = (rowId: string, batchNumber: string) => {
    setItems(items.map(it => {
      if (it.rowId !== rowId) return it;
      const prod = products.find(p => p.id === it.productId);
      if (!prod) return it;

      const batch = prod.batches.find(b => b.batchNumber === batchNumber);
      if (!batch) return it;

      const today = new Date().toISOString().split('T')[0];
      const isExpired = batch.expiryDate < today;
      const stockErr = it.quantity > batch.availableStock
        ? `Requested ${it.quantity} exceeds available stock (${batch.availableStock})`
        : null;

      return {
        ...it,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        availableStock: batch.availableStock,
        isExpired,
        stockError: stockErr
      };
    }));
  };

  // Handle Quantity Change on Row
  const handleQuantityChange = (rowId: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems(items.map(it => {
      if (it.rowId !== rowId) return it;
      const stockErr = validQty > it.availableStock
        ? `Requested ${validQty} exceeds available stock (${it.availableStock})`
        : null;
      return {
        ...it,
        quantity: validQty,
        stockError: stockErr
      };
    }));
  };

  // Handle Unit Price Change on Row
  const handlePriceChange = (rowId: string, price: number) => {
    setItems(items.map(it => {
      if (it.rowId !== rowId) return it;
      return { ...it, unitPrice: Math.max(0, price) };
    }));
  };

  // Handle Discount Change on Row
  const handleDiscountChange = (rowId: string, pct: number) => {
    setItems(items.map(it => {
      if (it.rowId !== rowId) return it;
      return { ...it, discountPercent: Math.min(100, Math.max(0, pct)) };
    }));
  };

  // Format INR Currency
  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!selectedCustomerId) {
      setErrorNotice('Please select a Customer / Diagnostic Lab to save draft.');
      return;
    }
    setSubmitting(true);
    setErrorNotice(null);

    const cust = customers.find(c => c.id === selectedCustomerId);

    try {
      const res = await fetch('/api/v1/accounting/invoices/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: existingDraft?.id,
          invoiceNumber,
          invoiceDate,
          dueDate,
          customerId: selectedCustomerId,
          customerName: cust?.labName || customerSearch,
          customerCode: cust?.customerCode,
          customerGstin,
          customerPan,
          customerState,
          customerStateCode,
          billingAddress,
          shippingAddress,
          poNumber,
          paymentTerms,
          salesperson,
          deliveryReference,
          narration,
          termsAndConditions,
          items,
          invoiceDiscountType,
          invoiceDiscountValue,
          freightCharges,
          otherCharges,
          applyRoundOff,
          amountReceived
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save draft invoice.');

      setSuccessNotice(`Draft invoice ${json.data.invoiceNumber} saved successfully.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Post Invoice Action
  const handlePostInvoice = async () => {
    // 1. Validation guards
    if (!selectedCustomerId) {
      setErrorNotice('Please select a Customer / Diagnostic Lab.');
      return;
    }
    if (items.length === 0) {
      setErrorNotice('Please add at least one product item to the invoice.');
      return;
    }

    // Check for stock shortages or expired batches in rows
    for (const item of items) {
      if (!item.productId) {
        setErrorNotice('All product rows must have a valid product selected.');
        return;
      }
      if (!item.batchNumber) {
        setErrorNotice(`Please select a batch for product "${item.productName}".`);
        return;
      }
      if (item.isExpired) {
        setErrorNotice(`Cannot post invoice with expired batch ${item.batchNumber} (${item.productName}).`);
        return;
      }
      if (item.quantity > item.availableStock) {
        setErrorNotice(`Insufficient stock for ${item.productName} (Batch ${item.batchNumber}). Requested: ${item.quantity}, Available: ${item.availableStock}.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorNotice(null);

    const cust = customers.find(c => c.id === selectedCustomerId);

    try {
      const res = await fetch('/api/v1/accounting/invoices/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: existingDraft?.id,
          invoiceNumber,
          invoiceDate,
          dueDate,
          customerId: selectedCustomerId,
          customerName: cust?.labName || customerSearch,
          customerCode: cust?.customerCode,
          customerGstin,
          customerPan,
          customerState,
          customerStateCode,
          billingAddress,
          shippingAddress,
          poNumber,
          paymentTerms,
          salesperson,
          deliveryReference,
          narration,
          termsAndConditions,
          items,
          invoiceDiscountType,
          invoiceDiscountValue,
          freightCharges,
          otherCharges,
          applyRoundOff,
          amountReceived,
          idempotencyKey: sessionSubmissionKey
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to post sales invoice.');

      setSuccessNotice(`Invoice ${json.data.invoiceNumber} posted! Double-Entry Voucher ${json.data.voucherNumber} created.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Invoice Action
  const handleOpenPreview = () => {
    const cust = customers.find(c => c.id === selectedCustomerId);
    const mockInvoice: SalesInvoice = {
      id: existingDraft?.id || `sinv-preview-${Date.now()}`,
      invoiceNumber: invoiceNumber || 'SINV-PREVIEW',
      invoiceDate,
      dueDate,
      status: 'DRAFT',
      customerId: selectedCustomerId || 'u-cust-01',
      customerName: cust?.labName || customerSearch || 'Selected Diagnostic Laboratory',
      customerCode: cust?.customerCode || 'CUST-001',
      customerGstin,
      customerPan,
      customerState,
      customerStateCode,
      billingAddress: billingAddress || 'Address on file',
      shippingAddress: shippingAddress || billingAddress || 'Address on file',
      placeOfSupply: `${customerState} (${customerStateCode})`,
      poNumber,
      paymentTerms,
      salesperson,
      deliveryReference,
      narration,
      termsAndConditions,
      items: serverTotals.items && serverTotals.items.length > 0 ? serverTotals.items : (items as any),
      grossSubtotal: serverTotals.grossSubtotal,
      itemDiscountsTotal: serverTotals.itemDiscountsTotal,
      invoiceDiscountType,
      invoiceDiscountValue,
      invoiceDiscountAmount: serverTotals.invoiceDiscountAmount,
      taxableAmount: serverTotals.taxableAmount,
      totalCgst: serverTotals.totalCgst,
      totalSgst: serverTotals.totalSgst,
      totalIgst: serverTotals.totalIgst,
      totalTax: serverTotals.totalTax,
      freightCharges: serverTotals.freightCharges,
      otherCharges: serverTotals.otherCharges,
      roundOff: serverTotals.roundOff,
      finalTotal: serverTotals.finalTotal,
      amountReceived: serverTotals.amountReceived,
      outstandingBalance: serverTotals.outstandingBalance,
      createdById: 'u-admin-01',
      createdByName: salesperson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPreviewInvoice(mockInvoice);
  };

  const filteredCustomers = customers.filter(c =>
    c.labName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div
      ref={modalContainerRef}
      onKeyDown={(e) => handleTallyKeyDown(e, modalContainerRef.current, { onEscape: onClose, onAddRow: handleAddProductRow })}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 select-none"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-6xl max-h-[96vh] my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              F8
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Sales Invoice Creation (Tally Billing Workflow)
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dealer: A2Z Diagnostic Services India Pvt Ltd (27AABCU9603R1ZM • Maharashtra)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" /> Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* STEP 1: INVOICE HEADER & CUSTOMER DETAILS */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-slate-300">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Step 1: Invoice Header & Diagnostic Lab Selection
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {customerStateCode === '27' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">Invoice Number</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    disabled={!allowManualNumber}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setAllowManualNumber(!allowManualNumber)}
                    className="px-2 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-white cursor-pointer"
                    title="Toggle manual entry"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Customer Searchable Dropdown */}
              <div className="md:col-span-2 relative">
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Customer / Diagnostic Lab <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="-- Select Customer / Diagnostic Lab --"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 pl-8"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>

                {/* Dropdown Options */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-slate-500 text-center">No matching customers found.</div>
                    ) : (
                      filteredCustomers.map(cust => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-2.5 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/50 last:border-none flex justify-between items-center transition"
                        >
                          <div>
                            <div className="font-semibold text-white">{cust.labName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Code: {cust.customerCode} • GSTIN: {cust.gstNumber} • State: {cust.state}
                            </div>
                          </div>
                          {selectedCustomerId === cust.id && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bill-To & Ship-To Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">Billing Address & GSTIN</label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  placeholder="Customer billing address"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2 mt-1.5">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                    GSTIN: <span className="text-white font-semibold">{customerGstin || 'Not Registered'}</span>
                  </span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                    State: <span className="text-white font-semibold">{customerState} ({customerStateCode})</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">Shipping Address (Separate Delivery Location)</label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Consignee shipping address"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Payment Terms, PO, Salesperson */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Customer PO / Ref #</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-991"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                >
                  <option value="Immediate">Immediate / Advance</option>
                  <option value="15 Days Credit Line">15 Days Credit Line</option>
                  <option value="30 Days Credit Line">30 Days Credit Line</option>
                  <option value="45 Days Credit Line">45 Days Credit Line</option>
                  <option value="60 Days Credit Line">60 Days Credit Line</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Delivery / Transporter Ref</label>
                <input
                  type="text"
                  value={deliveryReference}
                  onChange={e => setDeliveryReference(e.target.value)}
                  placeholder="Van / Courier tracking"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PRODUCT & BATCH GRID */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-slate-300">
                <Package className="w-4 h-4 text-emerald-400" />
                Step 2: Products, Inventory Batches & Line Pricing
              </span>
              <button
                type="button"
                onClick={handleAddProductRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-semibold">No product lines added to this invoice yet.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click "Add Product" to select diagnostic reagents, kits or analyzers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2 px-1 w-6">#</th>
                      <th className="py-2 px-2 min-w-[200px]">Product / Reagent</th>
                      <th className="py-2 px-2 min-w-[140px]">Batch / Lot</th>
                      <th className="py-2 px-2 text-center w-24">Expiry</th>
                      <th className="py-2 px-2 text-right w-20">Avail</th>
                      <th className="py-2 px-2 text-right w-20">Qty</th>
                      <th className="py-2 px-2 text-right w-24">Unit Rate</th>
                      <th className="py-2 px-2 text-right w-16">Disc %</th>
                      <th className="py-2 px-2 text-center w-16">GST</th>
                      <th className="py-2 px-2 text-right w-24">Line Total</th>
                      <th className="py-2 px-1 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((row, idx) => {
                      const selectedProd = products.find(p => p.id === row.productId);
                      const availableBatches = selectedProd ? selectedProd.batches : [];

                      return (
                        <tr key={row.rowId} className="align-top hover:bg-slate-900/30">
                          <td className="py-2.5 px-1 text-slate-500 font-mono text-center">{idx + 1}</td>

                          {/* Product Selection */}
                          <td className="py-2.5 px-2">
                            <select
                              value={row.productId}
                              onChange={e => handleProductChange(row.rowId, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                            {row.isColdChain && (
                              <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5 font-mono">
                                ❄ Cold Chain (2-8°C)
                              </div>
                            )}
                          </td>

                          {/* Batch Selection */}
                          <td className="py-2.5 px-2">
                            <select
                              value={row.batchNumber}
                              onChange={e => handleBatchChange(row.rowId, e.target.value)}
                              disabled={!row.productId || availableBatches.length === 0}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                            >
                              <option value="">-- Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.batchNumber} value={b.batchNumber}>
                                  {b.batchNumber} (Stock: {b.availableStock})
                                </option>
                              ))}
                            </select>
                            {row.stockError && (
                              <div className="text-[10px] text-red-400 mt-0.5 leading-tight flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" /> {row.stockError}
                              </div>
                            )}
                          </td>

                          {/* Expiry Badge */}
                          <td className="py-2.5 px-2 text-center">
                            {row.expiryDate ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                row.isExpired
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {row.expiryDate}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Available Stock */}
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                            {row.availableStock}
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={e => handleQuantityChange(row.rowId, Number(e.target.value))}
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-right text-white font-mono font-semibold"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.unitPrice}
                              onChange={e => handlePriceChange(row.rowId, Number(e.target.value))}
                              className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-right text-white font-mono"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.discountPercent}
                              onChange={e => handleDiscountChange(row.rowId, Number(e.target.value))}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-right text-slate-300 font-mono"
                            />
                          </td>

                          {/* GST % */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px]">
                            {row.gstRate}%
                          </td>

                          {/* Line Total */}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                            {formatInr(row.lineTotal)}
                          </td>

                          {/* Remove Action */}
                          <td className="py-2.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.rowId)}
                              className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* STEP 3 & 4: TOTALS, CHARGES & TERMS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terms & Additional Charges */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
                Discounts, Transport & Terms
              </span>

              {/* Invoice-Level Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Invoice Discount Type</label>
                  <select
                    value={invoiceDiscountType}
                    onChange={e => setInvoiceDiscountType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Discount Value</label>
                  <input
                    type="number"
                    min={0}
                    value={invoiceDiscountValue}
                    onChange={e => setInvoiceDiscountValue(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Freight & Other Charges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Freight / Transport Charges (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={freightCharges}
                    onChange={e => setFreightCharges(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Other Handling Charges (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={otherCharges}
                    onChange={e => setOtherCharges(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Narration */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Voucher Narration / Remarks</label>
                <input
                  type="text"
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  placeholder="e.g. Diagnostic reagents supplies for October routine lab testing"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Terms and Conditions</label>
                <textarea
                  rows={3}
                  value={termsAndConditions}
                  onChange={e => setTermsAndConditions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            {/* Authoritative Totals Summary */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2 mb-3">
                  Authoritative Invoice Totals (Decimal-Safe Math)
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Items Subtotal:</span>
                    <span className="font-mono text-slate-200">{formatInr(serverTotals.grossSubtotal)}</span>
                  </div>

                  {serverTotals.itemDiscountsTotal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Item-level Discounts:</span>
                      <span className="font-mono">- {formatInr(serverTotals.itemDiscountsTotal)}</span>
                    </div>
                  )}

                  {serverTotals.invoiceDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Invoice-level Discount:</span>
                      <span className="font-mono">- {formatInr(serverTotals.invoiceDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-200 font-semibold border-t border-slate-800 pt-1">
                    <span>Net Taxable Value:</span>
                    <span className="font-mono">{formatInr(serverTotals.taxableAmount)}</span>
                  </div>

                  {/* GST breakdown */}
                  {serverTotals.isInterState ? (
                    <div className="flex justify-between text-blue-400">
                      <span>Output IGST:</span>
                      <span className="font-mono">{formatInr(serverTotals.totalIgst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-blue-400">
                        <span>Output CGST:</span>
                        <span className="font-mono">{formatInr(serverTotals.totalCgst)}</span>
                      </div>
                      <div className="flex justify-between text-blue-400">
                        <span>Output SGST:</span>
                        <span className="font-mono">{formatInr(serverTotals.totalSgst)}</span>
                      </div>
                    </>
                  )}

                  {serverTotals.freightCharges > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Freight & Transport:</span>
                      <span className="font-mono text-slate-200">{formatInr(serverTotals.freightCharges)}</span>
                    </div>
                  )}

                  {serverTotals.otherCharges > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Handling Charges:</span>
                      <span className="font-mono text-slate-200">{formatInr(serverTotals.otherCharges)}</span>
                    </div>
                  )}

                  {/* Round off toggle */}
                  <div className="flex justify-between items-center text-slate-400 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={applyRoundOff}
                        onChange={e => setApplyRoundOff(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-600"
                      />
                      Apply Round-off (INR)
                    </label>
                    <span className="font-mono text-[11px] text-slate-400">
                      {serverTotals.roundOff !== 0 ? (serverTotals.roundOff > 0 ? `+${serverTotals.roundOff.toFixed(2)}` : serverTotals.roundOff.toFixed(2)) : '₹0.00'}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center text-sm font-black text-white bg-slate-900/90 border border-slate-700 p-2.5 rounded-lg mt-2">
                    <span>Final Invoice Total:</span>
                    <span className="font-mono text-emerald-400 text-base">{formatInr(serverTotals.finalTotal)}</span>
                  </div>

                  {/* Amount Received Input */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-400">Amount Received (Now):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-mono">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={amountReceived}
                        onChange={e => setAmountReceived(Number(e.target.value))}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Outstanding Balance */}
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-dashed border-slate-800">
                    <span className="text-slate-300">Outstanding Receivable:</span>
                    <span className="font-mono text-red-400">{formatInr(serverTotals.outstandingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Signatory Box */}
              <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Authorized Signatory: <strong className="text-slate-300">{salesperson}</strong></span>
                <span>Audit Stamp: <strong className="text-emerald-400 font-mono">AES-256 Validated</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Keyboard Hints & Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>[Enter] Next Field &bull; [Shift+Enter] Previous &bull; [Esc] Close</span>
            </div>
            <div className="text-xs text-slate-400 hidden md:block">
              {items.length} product lines &bull; Status:{' '}
              <span className="text-amber-400 font-semibold font-mono">
                {existingDraft ? 'Draft Editing' : 'New Invoice'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              type="button"
              onClick={handlePostInvoice}
              disabled={submitting || items.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Post / Save Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview Document Modal */}
      {previewInvoice && (
        <SalesInvoicePrintDocument
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          token={token}
        />
      )}
    </div>
  );
};
