import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Banknote,
  Receipt as ReceiptIcon
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function OfficialReceiptModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null;

  // Normalize receipt fields to handle any format gracefully
  const invoiceNumber = receipt.invoice_number || receipt.receipt_number || `OR-${receipt.id || '0000'}`;
  const transactionId = receipt.transaction_id || receipt.id || 'N/A';
  const cashierName = receipt.cashier || receipt.cashier_name || 'Cashier';
  const customerName = receipt.customer_name || 'Walk-in Customer';
  
  // Format Date and Time
  let formattedDate = 'Recently';
  const rawDate = receipt.created_at || receipt.transaction_date;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } else {
        formattedDate = String(rawDate);
      }
    } catch {
      formattedDate = String(rawDate);
    }
  }

  // Items normalization
  const items = receipt.items || [];

  // Financial calculations
  const totalAmount = Number(receipt.total_amount || 0);
  const discountAmount = Number(receipt.discount_amount || 0);
  const discountPct = Number(receipt.discount_pct || 0);
  
  // Gross Total (Subtotal before discount)
  const grossTotal = Number(receipt.gross_total || receipt.gross_subtotal || 0) || 
    (items.length > 0 
      ? items.reduce((sum, item) => sum + Number(item.total_price || (Number(item.quantity || 1) * Number(item.unit_price || 0))), 0)
      : (totalAmount + discountAmount));
  
  // Subtotal Net of VAT (12%)
  const subtotalNet = receipt.subtotal != null 
    ? Number(receipt.subtotal) 
    : +(totalAmount / 1.12).toFixed(2);
    
  // 12% Output VAT
  const vatAmount = receipt.vat_amount != null 
    ? Number(receipt.vat_amount) 
    : +(totalAmount - subtotalNet).toFixed(2);
    
  const amountTendered = Number(receipt.amount_tendered || totalAmount);
  const changeAmount = Number(receipt.change_amount || Math.max(0, amountTendered - totalAmount));

  // Open formatted print / PDF window
  const handlePrintOrPdf = (isPdfDownload = false) => {
    const printWindow = window.open('', '_blank', 'width=480,height=720');
    if (!printWindow) {
      alert('Please allow popups to print or download the official receipt.');
      return;
    }

    const itemsRowsHtml = items.map(item => {
      const itemName = item.name || item.product_name || 'Product Item';
      const itemSku = item.sku || '';
      const itemQty = Number(item.quantity || 1);
      const itemPrice = Number(item.unit_price || 0);
      const itemTotal = Number(item.total_price || (itemQty * itemPrice));

      return `
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px dotted #ccc;">
            <div style="font-weight: 700; color: #111;">${itemName}</div>
            <div style="font-size: 9px; color: #666; font-family: monospace;">SKU: ${itemSku}</div>
          </td>
          <td style="padding: 5px 0; text-align: center; border-bottom: 1px dotted #ccc; font-weight: 600;">
            ${itemQty}
          </td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px dotted #ccc; font-family: monospace;">
            ₱${itemPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px dotted #ccc; font-weight: 700; font-family: monospace;">
            ₱${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join('');

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>receipt_${invoiceNumber}.pdf</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            font-size: 11px;
            color: #111827;
            margin: 0;
            padding: 8px;
            width: 74mm;
            background: #ffffff;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .font-mono { font-family: monospace; }
          .border-b-dashed { border-bottom: 1px dashed #9ca3af; padding-bottom: 8px; margin-bottom: 8px; }
          .border-t-dashed { border-top: 1px dashed #9ca3af; padding-top: 8px; margin-top: 8px; }
          .border-double { border-top: 2px solid #111827; border-bottom: 2px solid #111827; padding: 6px 0; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { border-bottom: 1px solid #374151; padding-bottom: 4px; font-size: 9px; text-transform: uppercase; color: #374151; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10.5px; }
          .total-highlight {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 900;
            color: #065f46;
            margin: 4px 0;
          }
          .change-highlight {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 800;
            color: #065f46;
          }
          .footer { text-align: center; font-size: 9px; color: #4b5563; margin-top: 12px; }
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="text-center border-b-dashed">
          <div style="font-size: 16px; font-weight: 900; letter-spacing: 1px; color: #0f172a;">TECH AVENUE</div>
          <div style="font-size: 9.5px; font-weight: 700; color: #334155; margin-top: 1px;">COMPUTER & ACCESSORIES STORE MANAGEMENT</div>
          <div style="font-size: 8.5px; color: #475569; margin-top: 2px;">Unit 402, Cyberzone Tech Plaza, Metro Manila, Philippines</div>
          <div style="font-size: 8.5px; color: #475569;">Tel: (02) 8821-4920 • VAT Reg TIN: 401-889-223-000</div>
          <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; padding: 3px 0; background: #f1f5f9; border-radius: 4px;">
            Official Transaction Receipt
          </div>
        </div>

        <div class="border-b-dashed" style="font-size: 10px;">
          <div class="row"><span>Receipt / OR No:</span><span class="bold font-mono">${invoiceNumber}</span></div>
          <div class="row"><span>Transaction ID:</span><span class="font-mono">#${transactionId}</span></div>
          <div class="row"><span>Date & Time:</span><span>${formattedDate}</span></div>
          <div class="row"><span>Cashier Name:</span><span class="bold">${cashierName}</span></div>
          <div class="row"><span>Customer Name:</span><span>${customerName}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Product Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <div class="border-t-dashed" style="font-size: 10.5px;">
          <div class="row">
            <span>Subtotal (Before Discount):</span>
            <span class="font-mono">₱${grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="row">
            <span>Subtotal (Net of VAT):</span>
            <span class="font-mono">₱${subtotalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="row">
            <span>Output VAT (12%):</span>
            <span class="font-mono">₱${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="row" style="color: #b45309; font-weight: 600;">
              <span>Discount (${discountPct}%):</span>
              <span class="font-mono">-₱${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ` : ''}

          <div class="total-highlight border-double">
            <span>TOTAL AMOUNT DUE:</span>
            <span class="font-mono">₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div class="row">
            <span>Payment Method:</span>
            <span class="bold">CASH</span>
          </div>
          <div class="row">
            <span>Amount Tendered:</span>
            <span class="font-mono">₱${amountTendered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="change-highlight">
            <span>Change:</span>
            <span class="font-mono">₱${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="footer">
          <div class="bold" style="color: #0f172a; font-size: 9.5px;">THANK YOU FOR YOUR PURCHASE!</div>
          <div style="margin-top: 2px;">Items eligible for 7-day replacement with this receipt.</div>
          <div style="font-size: 8px; font-weight: 700; margin-top: 4px; letter-spacing: 0.5px;">*** THIS SERVES AS AN OFFICIAL RECEIPT ***</div>
        </div>

        <script>
          window.onload = function() {
            window.document.title = "receipt_" + "${invoiceNumber}" + ".pdf";
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0F172A] text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)' }}
      >
        {/* Top Bar with Status Badge & Close button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#090D16] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Official Transaction Receipt
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {invoiceNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Receipt Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Dark Navy Theme) */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
          
          {/* 1. Store Information Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-700 space-y-1">
            <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-slate-700/60 shadow-inner">
              <img 
                src={logoImg} 
                alt="Tech Avenue" 
                className="max-h-full max-w-full object-contain filter drop-shadow"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h2 className="text-lg font-black tracking-wider uppercase text-white font-mono">
              TECH AVENUE
            </h2>
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              Computer & Accessories Store Management
            </p>
            <p className="text-[10px] text-slate-400">
              Unit 402, Cyberzone Tech Plaza, Metro Manila, Philippines
            </p>
            <p className="text-[10px] text-slate-400">
              Tel: (02) 8821-4920 • VAT Reg TIN: 401-889-223-000
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Official Transaction Receipt
              </span>
            </div>
          </div>

          {/* 2. Transaction Information */}
          <div className="py-2 border-b border-dashed border-slate-700 text-xs space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Receipt / OR Number:</span>
              <span className="font-mono font-bold text-white tracking-wide bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Transaction ID:</span>
              <span className="font-mono text-slate-300">#{transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Date and Time:</span>
              <span className="text-slate-200">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cashier Name:</span>
              <span className="font-semibold text-slate-200">{cashierName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-semibold text-white">{customerName}</span>
            </div>
          </div>

          {/* 3. Purchased Products Table */}
          <div className="py-1 border-b border-dashed border-slate-700">
            <div className="text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-wider flex items-center justify-between">
              <span>Purchased Products</span>
              <span className="text-[10px] text-slate-500 font-mono">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-2 text-left">Product Description</th>
                  <th className="pb-2 text-center w-12">Qty</th>
                  <th className="pb-2 text-right w-24">Unit Price</th>
                  <th className="pb-2 text-right w-24">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-500">
                      No products listed in this receipt.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const itemName = item.name || item.product_name || 'Product Item';
                    const itemSku = item.sku || '';
                    const itemQty = Number(item.quantity || 1);
                    const itemPrice = Number(item.unit_price || 0);
                    const itemTotal = Number(item.total_price || (itemQty * itemPrice));

                    return (
                      <tr key={idx} className="group hover:bg-slate-800/30 transition">
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-white text-xs leading-snug">
                            {itemName}
                          </p>
                          {itemSku && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {itemSku}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-slate-300 font-semibold">
                          {itemQty}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-300 text-xs">
                          ₱{itemPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-white text-xs">
                          ₱{itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Payment Summary Breakdown */}
          <div className="py-3 border-b border-dashed border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span>Subtotal (Before Discount):</span>
              <span className="font-mono text-white">
                ₱{grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Subtotal (Net of VAT):</span>
              <span className="font-mono text-slate-200">
                ₱{subtotalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Output VAT (12%):</span>
              <span className="font-mono text-slate-200">
                ₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-amber-400 font-semibold">
                <span>Discount ({discountPct}%):</span>
                <span className="font-mono">
                  -₱{discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Total Amount Due with Vibrant Green Highlighting */}
            <div className="pt-2 pb-1 border-t border-slate-700/80">
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  TOTAL AMOUNT DUE:
                </span>
                <span className="text-lg font-black font-mono text-emerald-400 tracking-tight">
                  ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method - Cash Only */}
            <div className="flex justify-between items-center pt-1 text-slate-300">
              <span>Payment Method:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-bold border border-slate-700 text-xs">
                <Banknote className="w-3.5 h-3.5" />
                CASH
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>Amount Tendered:</span>
              <span className="font-mono font-bold text-white text-xs">
                ₱{amountTendered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Change with Vibrant Green Highlighting */}
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex justify-between items-center">
              <span className="font-bold text-emerald-300 text-xs">
                Change:
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                ₱{changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 5. Receipt Footer */}
          <div className="text-center pt-2 space-y-1 text-slate-400">
            <p className="font-bold text-slate-200 text-xs">
              Thank you for your purchase!
            </p>
            <p className="text-[10px] text-slate-400">
              Items eligible for 7-day replacement with this receipt.
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 pt-1">
              *** THIS SERVES AS AN OFFICIAL RECEIPT ***
            </p>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 bg-[#090D16] border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintOrPdf(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              title="Save Receipt as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintOrPdf(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 shadow-md transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

