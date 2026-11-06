import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Layers,
  ArrowDownLeft
} from 'lucide-react';

/**
 * SupplierTable Component
 * Reusable table displaying supplier and vendor information for inventory management.
 * Supports searching, category filtering, status badges, and optional role actions.
 */
export default function SupplierTable({
  suppliers = [],
  title = "Supplier & Vendor Information",
  subtitle = "Authorized hardware distributors, component manufacturers, and logistics partners",
  canAdd = false,
  onAdd = null,
  onRestock = null,
  role = "inventory_clerk"
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = (suppliers || []).filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.supplied_categories && s.supplied_categories.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (s.status === 'active' || s.status === 1 || !s.status)) ||
      (statusFilter === 'inactive' && (s.status === 'inactive' || s.status === 0));

    return matchesSearch && matchesStatus;
  });

  const activeCount = (suppliers || []).filter(
    (s) => s.status === 'active' || s.status === 1 || !s.status
  ).length;

  return (
    <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
      {/* Table Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3.5 border-b border-gray-100 dark:border-darkbg-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy/10 dark:bg-cyan-500/15 text-navy dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-navy/10 text-navy dark:bg-cyan-500/20 dark:text-cyan-300 border border-navy/15 dark:border-cyan-400/30">
                  {filtered.length} {filtered.length === 1 ? 'Supplier' : 'Suppliers'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier, contact, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-cyan-500/30"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-700 dark:text-gray-200 font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses ({suppliers.length})</option>
            <option value="active">Active Only ({activeCount})</option>
            <option value="inactive">Inactive Only ({suppliers.length - activeCount})</option>
          </select>

          {/* Add Supplier Button (if enabled) */}
          {canAdd && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Supplier Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-darkbg-border">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50/90 dark:bg-darkbg text-gray-600 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-darkbg-border select-none">
            <tr>
              <th className="py-3 px-3.5">Supplier / Company</th>
              <th className="py-3 px-3">Contact Person</th>
              <th className="py-3 px-3">Contact Details</th>
              <th className="py-3 px-3">Supplied Categories</th>
              <th className="py-3 px-3 text-center">Status</th>
              {onRestock && <th className="py-3 px-3 text-right">Quick Restock</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={onRestock ? 6 : 5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="font-semibold text-xs">No matching suppliers found</p>
                    <p className="text-[11px] text-gray-400">
                      {search ? 'Try clearing your search query.' : 'No suppliers registered in the database yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isActive = s.status === 'active' || s.status === 1 || !s.status;
                return (
                  <tr key={s.id || s.name} className="hover:bg-gray-50/60 dark:hover:bg-darkbg-hover/50 transition-colors">
                    {/* Supplier Name & Address */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-navy/5 dark:bg-cyan-500/10 text-navy dark:text-cyan-400 border border-navy/10 dark:border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                            {s.name}
                          </p>
                          {s.address ? (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{s.address}</span>
                            </p>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No address on file</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s.contact_person || 'Representative'}</span>
                      </div>
                    </td>

                    {/* Contact Info (Phone & Email) */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-navy dark:text-cyan-300">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <a href={`mailto:${s.email}`} className="hover:underline truncate max-w-[180px]">
                              {s.email}
                            </a>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-mono">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <a href={`tel:${s.phone}`} className="hover:underline">
                              {s.phone}
                            </a>
                          </div>
                        )}
                        {!s.email && !s.phone && (
                          <span className="text-gray-400 text-[10px] italic">Not provided</span>
                        )}
                      </div>
                    </td>

                    {/* Supplied Categories */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {s.supplied_categories ? (
                          s.supplied_categories.split(',').map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-darkbg-border"
                            >
                              {cat.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 dark:bg-darkbg text-gray-400 border border-gray-200 dark:border-darkbg-border">
                            General Hardware
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Quick Restock Action (if supplied) */}
                    {onRestock && (
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRestock(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy/10 hover:bg-navy/20 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 text-navy dark:text-cyan-300 font-bold text-xs transition cursor-pointer"
                          title={`Initiate restocking batch from ${s.name}`}
                        >
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Stock In</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

