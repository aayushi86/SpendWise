import { createWorker } from 'tesseract.js';
import { EXPENSE_CATEGORIES } from './formatters';

/**
 * Intelligent client-side OCR & receipt data parser
 * Extracts:
 * - Merchant Name
 * - Total Amount
 * - Date
 * - Suggested Category
 */
export const scanReceiptImage = async (imageFile, onProgress = () => {}) => {
  let worker = null;
  try {
    onProgress('Initializing OCR engine...');
    worker = await createWorker('eng');
    
    onProgress('Analyzing receipt image...');
    const ret = await worker.recognize(imageFile);
    const text = ret.data.text || '';

    onProgress('Extracting financial details...');
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let merchant = '';
    let amount = 0;
    let date = '';
    let suggestedCategory = 'Shopping';

    // 1. Merchant Detection: First non-empty, prominent line that isn't a date or numbers
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        line.length > 2 &&
        !/\d{2}[\/\-\.]\d{2}/.test(line) &&
        !/tax invoice|bill|receipt|cash memo|welcome/i.test(line) &&
        /[a-zA-Z]/.test(line)
      ) {
        // Clean merchant name
        merchant = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
        break;
      }
    }

    // 2. Amount Detection: Look for Total, Grand Total, Net, Amount Paid, or largest number with currency
    const amountPatterns = [
      /(?:total|grand\s*total|net\s*amount|amt\s*paid|bill\s*amount|balance\s*due)[\s:\-=₹Rs\.]*([0-9]+[.,][0-9]{2})/i,
      /(?:total|grand\s*total|net\s*amount)[\s:\-=₹Rs\.]*([0-9]+)/i,
      /(?:₹|Rs\.?|INR)[\s]*([0-9]+[.,][0-9]{2})/i,
      /(?:₹|Rs\.?|INR)[\s]*([0-9]+)/i,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanAmt = parseFloat(match[1].replace(',', ''));
        if (!isNaN(cleanAmt) && cleanAmt > 0 && cleanAmt < 10000000) {
          amount = cleanAmt;
          break;
        }
      }
    }

    // Fallback: search all monetary numbers on lines with "total" or find largest plausible price
    if (!amount) {
      let maxFound = 0;
      const numMatches = text.match(/\b\d{2,6}(?:\.\d{2})?\b/g);
      if (numMatches) {
        for (const num of numMatches) {
          const val = parseFloat(num);
          // Avoid 4-digit years like 2026, 2025, 2024
          if (val >= 2020 && val <= 2030 && !num.includes('.')) continue;
          if (val > maxFound && val < 500000) {
            maxFound = val;
          }
        }
      }
      if (maxFound > 0) amount = maxFound;
    }

    // 3. Date Detection: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or DD Mon YYYY
    const dateMatch =
      text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/) ||
      text.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);

    if (dateMatch) {
      if (dateMatch[3] && dateMatch[3].length === 4) {
        // DD/MM/YYYY
        const d = dateMatch[1].padStart(2, '0');
        const m = dateMatch[2].padStart(2, '0');
        const y = dateMatch[3];
        // Validate month
        if (parseInt(m) <= 12) {
          date = `${y}-${m}-${d}`;
        }
      } else if (dateMatch[1] && dateMatch[1].length === 4) {
        // YYYY-MM-DD
        date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
      }
    }

    // 4. Category Prediction based on keywords
    const lower = text.toLowerCase();
    if (/restaurant|cafe|coffee|food|swiggy|zomato|burger|pizza|kitchen|bakery|bar|dining|bistro|dhaba/i.test(lower)) {
      suggestedCategory = 'Food';
    } else if (/fuel|petrol|diesel|uber|ola|metro|flight|airways|irctc|railway|toll|parking|taxi|cabs/i.test(lower)) {
      suggestedCategory = 'Travel';
    } else if (/hospital|pharmacy|chemist|medical|clinic|doctor|health|diagnostics|medplus|apollo/i.test(lower)) {
      suggestedCategory = 'Healthcare';
    } else if (/electricity|water|broadband|wifi|jio|airtel|gas|bescom|utility|recharge|dth/i.test(lower)) {
      suggestedCategory = 'Bills';
    } else if (/cinema|pvr|inox|movie|entertainment|theatre|game|concert|amusement/i.test(lower)) {
      suggestedCategory = 'Entertainment';
    } else if (/school|college|university|books|education|academy|course|tuition|exam/i.test(lower)) {
      suggestedCategory = 'Education';
    } else if (/mart|supermarket|retail|store|mall|amazon|flipkart|zara|h&m|apparel|clothing/i.test(lower)) {
      suggestedCategory = 'Shopping';
    }

    return {
      rawText: text,
      merchant: merchant || 'Unknown Merchant',
      amount: amount || '',
      date: date || new Date().toISOString().split('T')[0],
      category: suggestedCategory,
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};
