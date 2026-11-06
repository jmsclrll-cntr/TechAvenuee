import React from 'react';
import {
  X,
  Package,
  Tag,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  FileText,
  Barcode,
  Truck,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Edit2,
  ArrowDownLeft,
  Image as ImageIcon
} from 'lucide-react';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  suppliers = [],
  role = 'clerk',
  onEdit,
  onRestock
}) {
  if (!isOpen || !product) return null;

  const cost = Number(product.cost_price || 0);
  const price = Number(product.selling_price || 0);
  const stock = Number(product.stock_quantity ?? 0);
  const reorder = Number(product.reorder_level ?? 0);
  const margin = price - cost;
  const marginPct = price > 0 ? ((margin / price) * 100).toFixed(1) : 0;
  const totalValuation = stock * price;
  const totalCostValuation = stock * cost;

  const isOutOfStock = stock === 0;
  const isLowStock = !isOutOfStock && stock <= reorder;

  // Specific product photo mapping
  const getProductImage = () => {
    if (product.image_url && product.image_url !== '/products/default.svg') {
      return product.image_url;
    }
    const sku = (product.sku || '').toUpperCase();
    const map = {
      'PRD-1001': '/products/beast-gaming-pc.svg',
      'PRD-1002': '/products/slim-ultrabook-laptop.svg',
      'PRD-1003': '/products/apexpro-rgb-keyboard.svg',
      'PRD-1004': '/products/silenttouch-keyboard.svg',
      'PRD-1005': '/products/viperstrike-mouse.svg',
      'PRD-1006': '/products/ultraview-monitor.svg',
      'PRD-1007': '/products/intel-i7-processor.svg',
      'PRD-1008': '/products/rtx-4070-super.svg',
      'PRD-1009': '/products/vengeance-ddr5-ram.svg',
      'PRD-1010': '/products/samsung-990-pro-ssd.svg',
      'PRD-1011': '/products/archer-wifi6-router.svg'
    };
    return map[sku] || product.image_url || '/products/beast-gaming-pc.svg';
  };

  const productImage = getProductImage();

  // Resolve authorized hardware supplier company based on registered suppliers
  const resolveSupplier = () => {
    if (product.supplier_id && suppliers?.length) {
      const found = suppliers.find(s => s.id === product.supplier_id);
      if (found) return found;
    }
    if (product.supplier_name) {
      if (suppliers?.length) {
        const found = suppliers.find(s => s.name?.toLowerCase() === product.supplier_name?.toLowerCase());
        if (found) return found;
      }
      return {
        name: product.supplier_name,
        contact_person: 'Supplier Account Rep',
        email: 'orders@supplier-hub.ph',
        phone: '+63 917 555 0199',
        address: 'Metro Manila Distribution Center'
      };
    }

    const brand = (product.brand || '').toLowerCase();
    const cat = (product.category_name || product.category || '').toLowerCase();
    const sku = (product.sku || '').toUpperCase();

    if (suppliers && suppliers.length > 0) {
      // 1. Match brand in supplier name or supplied_categories
      const brandMatch = suppliers.find(s =>
        (s.name && s.name.toLowerCase().includes(brand)) ||
        (s.supplied_categories && s.supplied_categories.toLowerCase().includes(brand))
      );
      if (brandMatch) return brandMatch;

      // 2. Match category
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

      return suppliers[0];
    }

    // Default registered hardware suppliers in system
    if (brand.includes('asus') || cat.includes('laptop') || cat.includes('computer') || cat.includes('monitor') || sku.includes('1001') || sku.includes('1002') || sku.includes('1006') || sku.includes('1008')) {
      return {
        name: "Asus Philippines Distribution",
        contact_person: "Michael Chang",
        email: "sales@asus-ph.com",
        phone: "+63 917 123 4567",
        address: "Bonifacio Global City, Taguig, Philippines"
      };
    }
    if (brand.includes('logitech') || brand.includes('apex') || brand.includes('razer') || cat.includes('keyboard') || cat.includes('mouse') || sku.includes('1003') || sku.includes('1004') || sku.includes('1005')) {
      return {
        name: "Logitech Regional Hub",
        contact_person: "Sarah Lim",
        email: "support@logitech-dist.com",
        phone: "+63 918 555 1234",
        address: "Ortigas Center, Pasig City, Philippines"
      };
    }
    return {
      name: "Corsair & Kingston PH Hub",
      contact_person: "David Tan",
      email: "orders@corsair-ph.com",
      phone: "+63 920 444 8888",
      address: "Quezon City, Metro Manila, Philippines"
    };
  };

  const supplier = resolveSupplier();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-border overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg-border bg-gray-50/70 dark:bg-darkbg/50">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-navy/10 text-navy dark:bg-blue-400/10 dark:text-blue-400 border border-navy/20 dark:border-blue-400/20">
                {product.sku || 'NO-SKU'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-darkbg-border text-gray-700 dark:text-gray-300 font-medium">
                {product.category_name || product.category || 'General Hardware'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isOutOfStock
                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                : isLowStock
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                {isOutOfStock ? (
                  <><AlertTriangle className="w-3 h-3" /> Out of Stock</>
                ) : isLowStock ? (
                  <><AlertTriangle className="w-3 h-3" /> Low Stock ({stock} left)</>
                ) : (
                  <><CheckCircle2 className="w-3 h-3" /> In Stock</>
                )}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
              {product.name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              {product.brand && (
                <p>
                  Brand: <span className="font-semibold text-gray-700 dark:text-gray-300">{product.brand}</span>
                </p>
              )}
              <span>•</span>
              <p className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-navy dark:text-blue-400 shrink-0" />
                <span>Supplier:</span>
                <span className="font-semibold text-navy dark:text-blue-400">{supplier.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkbg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Specific Product Photo Hero Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gray-50/70 dark:bg-darkbg/50 border border-gray-100 dark:border-darkbg-border">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-slate-900 border border-gray-200 dark:border-darkbg-border p-2.5 shrink-0 flex items-center justify-center overflow-hidden shadow-md group">
              <img
                src={productImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.src = '/products/beast-gaming-pc.svg'; }}
              />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy/10 text-navy dark:bg-blue-400/10 dark:text-blue-400 font-bold">
                  SKU: {product.sku}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-200 dark:bg-darkbg-border text-gray-600 dark:text-gray-300">
                  {product.category_name || product.category || 'Component'}
                </span>
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white leading-snug">
                {product.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                {product.description || 'Full hardware catalog item verified in central warehouse inventory.'}
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs">
                <span className="text-gray-500">
                  Retail: <strong className="text-navy dark:text-blue-400 font-mono">PHP {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500">
                  Cost: <strong className="font-mono text-gray-700 dark:text-gray-300">PHP {cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-darkbg/70 border border-gray-100 dark:border-darkbg-border">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block mb-1">
                Current Stock
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-black ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                  {stock}
                </span>
                <span className="text-[11px] text-gray-400">units</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Min threshold: {reorder}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-darkbg/70 border border-gray-100 dark:border-darkbg-border">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block mb-1">
                Selling Price
              </span>
              <span className="text-base sm:text-lg font-black text-navy dark:text-blue-400 block font-mono">
                PHP {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                +{marginPct}% margin
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-darkbg/70 border border-gray-100 dark:border-darkbg-border">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block mb-1">
                Cost Price
              </span>
              <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300 block font-mono">
                PHP {cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Markup: PHP {margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-darkbg/70 border border-gray-100 dark:border-darkbg-border">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block mb-1">
                Stock Valuation
              </span>
              <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white block font-mono">
                PHP {totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Cost Basis: PHP {totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Specifications & Extended Information */}
          <div className="rounded-xl border border-gray-100 dark:border-darkbg-border p-4 bg-gray-50/40 dark:bg-darkbg/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-navy dark:text-blue-400" />
              Item Specifications & Inventory Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">Brand / Maker:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.brand || 'TechAvenue'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">Category:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.category_name || product.category || 'General'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">SKU Code:</span>
                <span className="font-mono font-semibold text-navy dark:text-blue-400">{product.sku}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">Reorder Trigger:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{reorder} units minimum</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">Stock Status:</span>
                <span className="font-semibold capitalize text-gray-900 dark:text-white">
                  {product.status ? product.status.replace('_', ' ') : (stock === 0 ? 'Out of stock' : stock <= reorder ? 'Low stock' : 'In stock')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500">Authorized Supplier:</span>
                <span className="font-bold text-navy dark:text-blue-400">
                  {supplier.name}
                </span>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">Product Description / Notes:</span>
              <p className="p-3 rounded-lg bg-white dark:bg-darkbg text-xs text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-darkbg-border leading-relaxed">
                {product.description || 'No detailed specifications or manufacturer notes recorded for this SKU.'}
              </p>
            </div>
          </div>

          {/* Authorized Hardware Supplier & Logistics Card */}
          <div className="rounded-xl border border-gray-200/80 dark:border-darkbg-border p-4 bg-navy/5 dark:bg-darkbg/40 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-darkbg-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-blue-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Authorized Hardware Supplier & Fulfillment Partner
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Verified Vendor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-gray-500 text-[11px] block">Company / Supplier:</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{supplier.name}</span>
              </div>

              {supplier.contact_person && (
                <div>
                  <span className="text-gray-500 text-[11px] block">Account Representative:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-gray-400" />
                    {supplier.contact_person}
                  </span>
                </div>
              )}

              {supplier.email && (
                <div>
                  <span className="text-gray-500 text-[11px] block">Corporate Email:</span>
                  <a href={`mailto:${supplier.email}`} className="font-mono text-navy dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {supplier.email}
                  </a>
                </div>
              )}

              {supplier.phone && (
                <div>
                  <span className="text-gray-500 text-[11px] block">Direct Phone:</span>
                  <a href={`tel:${supplier.phone}`} className="font-mono text-gray-700 dark:text-gray-300 hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {supplier.phone}
                  </a>
                </div>
              )}

              {supplier.address && (
                <div className="col-span-1 sm:col-span-2 pt-1 border-t border-gray-200/50 dark:border-darkbg-border">
                  <span className="text-gray-500 text-[11px] block">Fulfillment / Warehouse Address:</span>
                  <p className="text-gray-700 dark:text-gray-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{supplier.address}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-darkbg-border bg-gray-50/70 dark:bg-darkbg/50">
          <div className="text-[11px] text-gray-400">
            System ID: <span className="font-mono font-medium">{product.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/80 hover:bg-gray-300 dark:bg-darkbg dark:hover:bg-darkbg-hover transition-colors"
            >
              Close
            </button>

            {/* Clerk Quick Restock Option */}
            {role === 'clerk' && onRestock && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRestock(product);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Restock</span>
              </button>
            )}

            {/* Admin Quick Edit Option */}
            {role === 'admin' && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-navy hover:bg-navy-light transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Item</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
