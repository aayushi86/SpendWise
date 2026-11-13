import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  formatINR,
  formatIndianDate,
  getMonthYearString,
} from '../utils/formatters';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getMonthYearString());
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  const handleDownloadCSV = async () => {
    try {
      setDownloadingCsv(true);
      const token = localStorage.getItem('spendwise_token');
      const res = await fetch(api.exportCSVUrl(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to generate CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpendWise_All_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setReportSuccess('CSV transaction report downloaded successfully.');
    } catch (err) {
      alert(err.message || 'Error exporting CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true);
      setReportSuccess('');

      // Fetch transactions for selected month
      const [year, m] = selectedMonth.split('-').map(Number);
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const endDate = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await api.getTransactions({ startDate, endDate, limit: 500 });
      const transactions = res.data || [];

      // Fetch summary and budgets
      const budgetRes = await api.getBudgets(selectedMonth);
      const budgets = budgetRes.data || [];

      // Calculate monthly stats
      let totalIncome = 0;
      let totalExpenses = 0;
      const categoryTotals = {};

      transactions.forEach((t) => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpenses += t.amount;
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
      });

      const netSurplus = totalIncome - totalExpenses;

      // Initialize jsPDF doc
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(30, 27, 75); // Navy 950
      doc.rect(0, 0, 210, 36, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('SpendWise Financial Report', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(199, 210, 254);
      doc.setFont('helvetica', 'normal');
      doc.text(`Monthly Statement: ${selectedMonth} | Generated for: ${user?.name || 'User'}`, 14, 28);
      doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 28);

      // Section 1: Executive Summary
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Financial Executive Summary', 14, 48);

      const summaryRows = [
        ['Total Monthly Inflow (Income)', `Rs. ${totalIncome.toLocaleString('en-IN')}`],
        ['Total Monthly Outflow (Expenses)', `Rs. ${totalExpenses.toLocaleString('en-IN')}`],
        ['Net Monthly Surplus / Balance', `Rs. ${netSurplus.toLocaleString('en-IN')}`],
        ['Total Records in Period', `${transactions.length} transactions`],
      ];

      autoTable(doc, {
        startY: 52,
        head: [['Metric', 'Amount (INR)']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      // Section 2: Category Breakdown
      let nextY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Expense Category Breakdown', 14, nextY);

      const categoryRows = Object.entries(categoryTotals).map(([cat, amt]) => {
        const percentage = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
        return [cat, `Rs. ${amt.toLocaleString('en-IN')}`, `${percentage}%`];
      });

      if (categoryRows.length === 0) {
        categoryRows.push(['No expenses recorded', 'Rs. 0', '0%']);
      }

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Category', 'Total Spent (INR)', 'Percentage of Outflow']],
        body: categoryRows,
        theme: 'grid',
        headStyles: { fillColor: [67, 56, 202] },
        styles: { fontSize: 9, cellPadding: 3.5 },
      });

      // Section 3: Transaction Ledger
      nextY = doc.lastAutoTable.finalY + 12;
      if (nextY > 240) {
        doc.addPage();
        nextY = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Detailed Transaction Ledger', 14, nextY);

      const ledgerRows = transactions.map((t) => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.type.toUpperCase(),
        t.category,
        t.description || '-',
        t.paymentMethod || 'UPI',
        `${t.type === 'expense' ? '-' : '+'} Rs. ${t.amount.toLocaleString('en-IN')}`,
      ]);

      if (ledgerRows.length === 0) {
        ledgerRows.push(['-', '-', 'No records', '-', '-', 'Rs. 0']);
      }

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Date', 'Type', 'Category', 'Description', 'Method', 'Amount']],
        body: ledgerRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // Save PDF
      doc.save(`SpendWise_Statement_${selectedMonth}.pdf`);
      setReportSuccess(`PDF statement for ${selectedMonth} downloaded successfully.`);
    } catch (err) {
      alert(err.message || 'Error generating PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="px-4 md:px-8 space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-brand-500" />
          <span>Financial Reports & Data Exports</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generate audit-ready monthly PDF statements and CSV exports
        </p>
      </div>

      {reportSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* Reports Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Monthly Statement Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              Monthly PDF Financial Statement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Comprehensive report containing executive cashflow summary, category-wise breakdowns, and ledger of all transactions.
            </p>

            <div className="space-y-2 mb-6">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Select Statement Month:
              </label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold">
                <Calendar className="w-4 h-4 text-brand-500" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={generatingPdf}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generatingPdf ? 'Generating PDF...' : 'Download Monthly PDF'}</span>
          </button>
        </div>

        {/* CSV Data Export Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              Export All Transactions (CSV)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Export your entire financial transaction ledger into an Excel-compatible CSV file with Indian Rupee amounts, categories, and payment channels.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Compatible with Microsoft Excel, Google Sheets & Apple Numbers</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Includes all historical expenses & income entries</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadCSV}
            disabled={downloadingCsv}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingCsv ? 'Preparing CSV...' : 'Download CSV Spreadsheet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
