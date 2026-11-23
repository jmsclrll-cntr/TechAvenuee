
import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, X } from "lucide-react";
import { api } from "../api";

export default function StockMovementAuditTrail() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    supplierId: "",
    startDate: "",
    endDate: "",
    processedBy: "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dynamic filter options
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [catRes, supRes, empRes] = await Promise.all([
          api.get("/api/categories"),
          api.get("/api/suppliers"),
          api.get("/api/employees"),
        ]);

        if (catRes.status === "success") {
          setCategories(catRes.data || []);
        }

        if (supRes.status === "success") {
          setSuppliers(supRes.data || []);
        }

        if (empRes.status === "success") {
          setEmployees(empRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };

    loadOptions();
  }, []);

  // Fetch movements whenever filters or page change
  useEffect(() => {
    let cancelled = false;

    const fetchMovements = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/stock/movements", {
          params: {
            page,
            limit: 20,
            ...filters,
          },
        });

        if (cancelled) return;

        if (response.status === "success") {
          setMovements(response.data?.movements || []);
          setTotalPages(response.data?.total_pages || 1);
        } else {
          setMovements([]);
          setTotalPages(1);
          setError("Unable to retrieve stock movement records.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading stock movements:", err);
          setMovements([]);
          setError("Failed to load stock movement records. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMovements();

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      categoryId: "",
      supplierId: "",
      startDate: "",
      endDate: "",
      processedBy: "",
    });

    setPage(1);
  };

  // Refresh records
  const refreshMovements = () => {
    setPage(1);
    setFilters((prev) => ({ ...prev }));
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== ""
  );

  return (
    <div className="p-6 min-h-screen bg-[#141210] text-stone-100">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Stock Movement Audit Trail
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Track incoming stock replenishments and inventory deductions
            across the warehouse.
          </p>
        </div>

        <button
          onClick={refreshMovements}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
          border border-[#292524] bg-[#1C1917]
          text-stone-300 hover:bg-[#292524] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#1C1917] border border-[#292524]
        rounded-xl p-5 mb-6">

        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white">
              Filter Movement Records
            </h2>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold
              text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
              w-4 h-4 text-stone-500" />

            <input
              type="text"
              name="search"
              placeholder="Search product, SKU, or brand..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg
              bg-[#141210] border border-[#292524]
              text-white text-sm placeholder:text-stone-500
              focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleFilterChange}
            className="w-full px-3 py-2.5 rounded-lg
            bg-[#141210] border border-[#292524]
            text-stone-300 text-sm focus:outline-none
            focus:border-emerald-500"
          >
            <option value="">All Categories</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Supplier */}
          <select
            name="supplierId"
            value={filters.supplierId}
            onChange={handleFilterChange}
            className="w-full px-3 py-2.5 rounded-lg
            bg-[#141210] border border-[#292524]
            text-stone-300 text-sm focus:outline-none
            focus:border-emerald-500"
          >
            <option value="">All Suppliers</option>

            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <div>
            <label className="block text-xs text-stone-400 mb-1.5">
              Start Date
            </label>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={handleFilterChange}
              className="w-full px-3 py-2.5 rounded-lg
              bg-[#141210] border border-[#292524]
              text-stone-300 text-sm focus:outline-none
              focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-stone-400 mb-1.5">
              End Date
            </label>

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={handleFilterChange}
              className="w-full px-3 py-2.5 rounded-lg
              bg-[#141210] border border-[#292524]
              text-stone-300 text-sm focus:outline-none
              focus:border-emerald-500"
            />
          </div>

          {/* Processed By */}
          <select
            name="processedBy"
            value={filters.processedBy}
            onChange={handleFilterChange}
            className="w-full px-3 py-2.5 rounded-lg
            bg-[#141210] border border-[#292524]
            text-stone-300 text-sm focus:outline-none
            focus:border-emerald-500"
          >
            <option value="">All Employees</option>

            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name || e.username}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-[#1C1917] border border-[#292524]
        rounded-xl overflow-hidden">

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">

            <thead className="bg-[#141210] border-b border-[#292524]">
              <tr>
                {[
                  "Timestamp",
                  "Product / SKU",
                  "Category",
                  "Supplier",
                  "Movement Type",
                  "Quantity",
                  "Processed By",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-left text-xs
                    font-bold text-stone-300 uppercase whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#292524]">

              {loading ? (
                <tr>
                  <td colSpan={7}
                    className="p-10 text-center text-stone-400">
                    Loading movement records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7}
                    className="p-10 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7}
                    className="p-10 text-center text-stone-400">
                    No records match the selected filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-[#292524]/40 transition-colors"
                  >

                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap text-stone-400">
                      {m.timestamp
                        ? new Date(m.timestamp).toLocaleString()
                        : "—"}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white">
                        {m.product_name || "—"}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        {m.sku || "—"}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap text-stone-400">
                      {m.category_name || "—"}
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3 whitespace-nowrap text-stone-400">
                      {m.supplier_name || "—"}
                    </td>

                    {/* Movement Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full
                        text-xs font-bold ${m.type === "IN"
                            ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800"
                            : m.type === "OUT"
                              ? "bg-red-900/40 text-red-400 border border-red-800"
                              : "bg-amber-900/40 text-amber-400 border border-amber-800"
                          }`}
                      >
                        {m.type || "OTHER"}
                      </span>
                    </td>

                    {/* Quantity - FIXED */}
                    <td
                      className={`px-4 py-3 whitespace-nowrap font-bold ${Number(m.quantity) > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                        }`}
                    >
                      {Number(m.quantity) > 0
                        ? `+${m.quantity}`
                        : m.quantity ?? "—"}
                    </td>

                    {/* Processed By */}
                    <td className="px-4 py-3 whitespace-nowrap text-stone-400">
                      {m.processed_by_name || "—"}
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-between items-center
          gap-3 p-4 border-t border-[#292524]">

          <span className="text-sm text-stone-400">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium
              bg-[#292524] text-stone-300
              hover:bg-[#44403C] disabled:opacity-40
              disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium
              bg-emerald-600 text-white
              hover:bg-emerald-500 disabled:opacity-40
              disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
