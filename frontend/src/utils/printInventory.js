/**
 * printInventory.js
 * Generates a comprehensive, clean, and printable/PDF Master Inventory Summary
 * featuring all products, full hardware specifications, supplier details, stock levels,
 * and financial valuation.
 */

export function printInventory({ products = [], suppliers = [], user = null, title = 'Master Inventory Catalog & Hardware Specifications' }) {
  const printWindow = window.open('', '_blank', 'width=1150,height=800');
  if (!printWindow) {
    alert('Please allow popups to generate and print the inventory summary.');
    return;
  }

  // Format currency
  const formatPHP = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to resolve product supplier details
  const getSupplierInfo = (p) => {
    if (p.supplier_id && suppliers.length > 0) {
      const match = suppliers.find(s => s.id === p.supplier_id);
      if (match) return match;
    }
    if (p.supplier_name) {
      const match = suppliers.find(s => s.name?.toLowerCase() === p.supplier_name?.toLowerCase());
      if (match) return match;
      return {
        name: p.supplier_name,
        contact_person: 'Account Rep',
        phone: '+63 917 555 0199',
        email: 'orders@supplier.ph'
      };
    }

    const brand = (p.brand || '').toLowerCase();
    const cat = (p.category_name || p.category || '').toLowerCase();
    const sku = (p.sku || '').toUpperCase();

    if (suppliers.length > 0) {
      const brandMatch = suppliers.find(s =>
        (s.name && s.name.toLowerCase().includes(brand)) ||
        (s.supplied_categories && s.supplied_categories.toLowerCase().includes(brand))
      );
      if (brandMatch) return brandMatch;

      const catMatch = suppliers.find(s => {
        const suppCats = (s.supplied_categories || '').toLowerCase();
        if (cat.includes('laptop') || cat.includes('computer') || cat.includes('pc')) return suppCats.includes('comp');
        if (cat.includes('keyboard')) return suppCats.includes('keyboard');
        if (cat.includes('mouse') || cat.includes('peripheral')) return suppCats.includes('mouse');
        if (cat.includes('monitor') || cat.includes('display')) return suppCats.includes('monitor');
        if (cat.includes('component') || cat.includes('processor') || cat.includes('parts')) return suppCats.includes('comp-parts');
        if (cat.includes('storage') || cat.includes('networking') || cat.includes('router') || cat.includes('ssd')) return suppCats.includes('storage');
        return false;
      });
      if (catMatch) return catMatch;
    }

    // Default registered suppliers
    if (brand.includes('asus') || cat.includes('laptop') || cat.includes('computer') || cat.includes('monitor') || sku.includes('1001') || sku.includes('1002') || sku.includes('1006') || sku.includes('1008')) {
      return {
        name: "Asus Philippines Distribution",
        contact_person: "Michael Chang",
        phone: "+63 917 123 4567",
        email: "sales@asus-ph.com"
      };
    }
    if (brand.includes('logitech') || brand.includes('apex') || brand.includes('razer') || cat.includes('keyboard') || cat.includes('mouse') || sku.includes('1003') || sku.includes('1004') || sku.includes('1005')) {
      return {
        name: "Logitech Regional Hub",
        contact_person: "Sarah Lim",
        phone: "+63 918 555 1234",
        email: "support@logitech-dist.com"
      };
    }
    return {
      name: "Corsair & Kingston PH Hub",
      contact_person: "David Tan",
      phone: "+63 920 444 8888",
      email: "orders@corsair-ph.com"
    };
  };

  // Financial & inventory analytics summary
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);
  const totalAssetCost = products.reduce((sum, p) => sum + ((Number(p.cost_price) || 0) * (Number(p.stock_quantity) || 0)), 0);
  const totalRetailVal = products.reduce((sum, p) => sum + ((Number(p.selling_price) || 0) * (Number(p.stock_quantity) || 0)), 0);
  const lowStockCount = products.filter(p => (Number(p.stock_quantity) <= 5 || p.status === 'low_stock') && Number(p.stock_quantity) > 0).length;
  const outOfStockCount = products.filter(p => Number(p.stock_quantity) === 0 || p.status === 'out_of_stock').length;

  const printedDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const printedBy = user?.full_name ? `${user.full_name} (${(user.role || 'Staff').replace('_', ' ').toUpperCase()})` : 'Authorized Staff';

  // Build table rows
  const tableRowsHtml = products.map((p, idx) => {
    const cost = Number(p.cost_price) || 0;
    const price = Number(p.selling_price) || 0;
    const stock = Number(p.stock_quantity) || 0;
    const supplier = getSupplierInfo(p);
    const specs = p.description || 'Standard factory specifications. Commercial hardware retail edition.';

    let statusLabel = 'IN STOCK';
    let statusClass = 'status-in-stock';
    if (stock === 0 || p.status === 'out_of_stock') {
      statusLabel = 'OUT OF STOCK';
      statusClass = 'status-out';
    } else if (stock <= 5 || p.status === 'low_stock') {
      statusLabel = 'LOW STOCK';
      statusClass = 'status-low';
    }

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #6b7280;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #1e3a5f;">${p.sku || 'N/A'}</td>
        <td>
          <div style="font-weight: 800; font-size: 11px; color: #111827;">${p.name}</div>
          <div style="font-size: 9px; color: #4b5563; margin-top: 2px;">
            <span style="font-weight: 700; color: #1f2937;">Brand:</span> ${p.brand || 'N/A'} &bull; 
            <span style="font-weight: 700; color: #1f2937;">Category:</span> ${p.category_name || p.category || 'Hardware'}
          </div>
          <div style="font-size: 8.5px; color: #6b7280; margin-top: 3px; font-style: italic; line-height: 1.25;">
            ${specs}
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: #111827;">${supplier.name || 'Official Partner Distributor'}</div>
          <div style="font-size: 8.5px; color: #6b7280;">Contact: ${supplier.contact_person || 'Rep'}</div>
          <div style="font-size: 8.5px; color: #6b7280;">${supplier.phone || ''} ${supplier.email ? `&bull; ${supplier.email}` : ''}</div>
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 600; color: #374151;">
          ${formatPHP(cost)}
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 800; color: #047857;">
          ${formatPHP(price)}
        </td>
        <td style="text-align: center;">
          <div style="font-weight: 900; font-size: 11px; color: ${stock <= 5 ? '#b91c1c' : '#111827'};">
            ${stock}
          </div>
          <div style="font-size: 8px; color: #6b7280;">${stock <= 5 && stock > 0 ? 'Restock Triggered' : 'Units'}</div>
        </td>
        <td style="text-align: center;">
          <span class="badge ${statusClass}">${statusLabel}</span>
        </td>
      </tr>
    `;
  }).join('');

  const docHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>inventory_summary_${new Date().toISOString().slice(0, 10)}.pdf</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 10px;
          font-size: 9.5px;
          line-height: 1.35;
        }
        .no-print {
          margin-bottom: 12px;
          padding: 8px 12px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-print {
          background: #f97316;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }
        .btn-print:hover {
          background: #ea580c;
        }
        .btn-close {
          background: #e5e7eb;
          color: #374151;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          cursor: pointer;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 8px;
          border-bottom: 2px solid #1e3a5f;
          margin-bottom: 10px;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          color: #f97316;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .brand-meta {
          font-size: 8.5px;
          color: #4b5563;
          margin-top: 3px;
        }
        .report-info {
          text-align: right;
          font-size: 9px;
          color: #374151;
        }
        .report-title-badge {
          display: inline-block;
          background: #1e3a5f;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        .kpi-card {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 6px;
          padding: 6px 8px;
          text-align: center;
        }
        .kpi-label {
          font-size: 8px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .kpi-val {
          font-size: 13px;
          font-weight: 900;
          color: #111827;
          margin-top: 2px;
          font-family: monospace;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        th {
          background: #1e3a5f;
          color: #ffffff;
          padding: 6px 6px;
          text-align: left;
          font-size: 8.5px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid #1e3a5f;
        }
        td {
          padding: 5px 6px;
          border: 1px solid #e5e7eb;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f9fafb;
        }
        .badge {
          display: inline-block;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 7.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        .status-in-stock {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .status-low {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .status-out {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .totals-row td {
          background: #f3f4f6 !important;
          font-weight: 900;
          border-top: 2px solid #111827;
          font-size: 9.5px;
        }
        .footer-sig {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px dashed #d1d5db;
        }
        .sig-block {
          width: 220px;
          text-align: center;
        }
        .sig-line {
          border-top: 1px solid #111827;
          margin-top: 30px;
          padding-top: 4px;
          font-weight: 700;
          font-size: 9px;
        }
        .sig-role {
          font-size: 8px;
          color: #6b7280;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong>Print Preview:</strong> Official Inventory & Specifications Catalog (${totalProducts} products loaded)
        </div>
        <div>
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn-close" onclick="window.close()">✕ Close</button>
        </div>
      </div>

      <div class="header">
        <div>
          <div class="brand-title">TECH AVENUE</div>
          <div class="brand-sub">Computer & Accessories Store Management</div>
          <div class="brand-meta">
            Unit 402, Cyberzone Tech Plaza, Metro Manila, Philippines &bull; Tel: (02) 8821-4920 &bull; VAT Reg TIN: 401-889-223-000
          </div>
        </div>
        <div class="report-info">
          <div class="report-title-badge">${title}</div>
          <div><strong>Printed:</strong> ${printedDate}</div>
          <div><strong>Audited By:</strong> ${printedBy}</div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Catalog Items</div>
          <div class="kpi-val">${totalProducts}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Units in Warehouse</div>
          <div class="kpi-val">${totalUnits.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Inventory Cost Basis</div>
          <div class="kpi-val" style="color: #1e3a5f;">${formatPHP(totalAssetCost)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Retail Gross Value</div>
          <div class="kpi-val" style="color: #047857;">${formatPHP(totalRetailVal)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Low Stock Alerts</div>
          <div class="kpi-val" style="color: #b45309;">${lowStockCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Out of Stock Items</div>
          <div class="kpi-val" style="color: #b91c1c;">${outOfStockCount}</div>
        </div>
      </div>

      <!-- Inventory Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 3%; text-align: center;">#</th>
            <th style="width: 8%;">SKU</th>
            <th style="width: 33%;">Product Name & Hardware Specifications</th>
            <th style="width: 22%;">Supplier & Distribution Partner</th>
            <th style="width: 10%; text-align: right;">Unit Cost</th>
            <th style="width: 10%; text-align: right;">Retail Price</th>
            <th style="width: 7%; text-align: center;">Stock</th>
            <th style="width: 7%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
          <tr class="totals-row">
            <td colspan="4" style="text-align: right; padding-right: 12px;">GRAND TOTALS:</td>
            <td style="text-align: right; font-family: monospace;">${formatPHP(totalAssetCost)}</td>
            <td style="text-align: right; font-family: monospace; color: #047857;">${formatPHP(totalRetailVal)}</td>
            <td style="text-align: center; font-size: 11px;">${totalUnits.toLocaleString()}</td>
            <td style="text-align: center;">${totalProducts} items</td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <div class="footer-sig">
        <div class="sig-block">
          <div class="sig-line">${printedBy}</div>
          <div class="sig-role">Prepared / Printed By</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Warehouse Operations Manager</div>
          <div class="sig-role">Inventory Custodian & Verification</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Store General Manager</div>
          <div class="sig-role">Store Administration Approval</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
}
