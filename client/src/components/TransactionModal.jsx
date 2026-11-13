import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertCircle, Camera, Upload, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../utils/formatters';
import { scanReceiptImage } from '../utils/receiptScanner';

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(
        initialData.category ||
          (initialData.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
      );
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPaymentMethod(initialData.paymentMethod || 'UPI');
      setDescription(initialData.description || '');
    } else {
      setType(defaultType);
      setAmount('');
      setCategory(defaultType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setDescription('');
    }
    setError('');
    setScannedResult(null);
    setScanStatus('');
  }, [initialData, defaultType, isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'expense') {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    } else {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    }
  };

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setError('');
      setScanStatus('Reading image...');

      const result = await scanReceiptImage(file, (status) => setScanStatus(status));
      setScannedResult(result);

      // Populate form fields so user can review & edit
      if (result.amount) setAmount(String(result.amount));
      if (result.date) setDate(result.date);
      if (result.merchant && result.merchant !== 'Unknown Merchant') {
        setDescription(result.merchant);
      }
      if (result.category && EXPENSE_CATEGORIES.includes(result.category)) {
        setCategory(result.category);
      }
      setType('expense');
    } catch (err) {
      console.error('Scan error:', err);
      setError('Could not scan receipt. Please enter the details manually.');
    } finally {
      setIsScanning(false);
      setScanStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        amount: parsedAmount,
        category,
        date,
        paymentMethod,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-navy-850 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {initialData ? 'Edit Entry' : 'Quick Add Entry'}
            </h3>
            <p className="text-xs text-slate-500">Record financial inflow or outflow</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Receipt Scanning Button / Review Banner */}
          {!initialData && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleReceiptFileChange}
                className="hidden"
              />

              {isScanning ? (
                <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{scanStatus || 'Scanning receipt image...'}</span>
                </div>
              ) : scannedResult ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Receipt Extracted (Review Below)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-emerald-700 dark:text-emerald-300 underline"
                    >
                      Rescan
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90">
                    Auto-filled from receipt. Please verify amount and details before saving.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand-300 dark:border-brand-700/60 bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Receipt with Camera / Image</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </button>
              )}
            </div>
          )}

          {/* Type Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Description / Merchant
              </label>
              <input
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Swiggy, Reliance Fresh, Petrol"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="transaction-form"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Save Entry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
