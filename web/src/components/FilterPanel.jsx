import React from "react";
import { Filter, X, ChevronDown } from "lucide-react";

const REGENCIES = ["Sorong", "Sorong Selatan", "Raja Ampat", "Tambrauw", "Maybrat"];
const CATEGORIES = ["RTLH", "Sanitasi", "Air Bersih"];
const DISABILITY_TYPES = ["Fisik", "Netra", "Rungu", "Mental", "Intelektual", "Ganda"];
const SEVERITIES = ["Ringan", "Sedang", "Berat"];
const BUDGET_SOURCES = ["APBN", "APBD Provinsi", "APBD Kabupaten", "DAK Afirmasi", "Dana Otsus"];
const PRIORITIES = ["Tinggi", "Sedang", "Rendah"];

const FilterSelect = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder || "Semua"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  </div>
);

const ToggleFilter = ({ label, checked, onChange, color = "blue" }) => {
  const colors = {
    purple: { ring: "border-purple-500 bg-purple-500/10", dot: "bg-purple-500", text: "text-purple-400" },
    amber: { ring: "border-amber-500 bg-amber-500/10", dot: "bg-amber-500", text: "text-amber-400" },
    blue: { ring: "border-blue-500 bg-blue-500/10", dot: "bg-blue-500", text: "text-blue-400" },
  };
  const c = colors[color];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
        checked ? `${c.ring} ${c.text}` : "border-gray-700 text-gray-400 hover:border-gray-600"
      }`}
    >
      <span className={`w-2 h-2 rounded-full transition-colors ${checked ? c.dot : "bg-gray-600"}`} />
      {label}
    </button>
  );
};

export function ResultCount({ count, total }) {
  return (
    <span className="text-xs text-gray-500">
      Menampilkan <span className="font-bold text-white">{count}</span> dari <span className="font-bold text-white">{total}</span> data
    </span>
  );
}

export default function FilterPanel({ filters, onChange, onReset, resultCount, totalCount }) {
  const hasActiveFilters =
    filters.kelompok !== "all" ||
    filters.category !== "" ||
    filters.regency !== "" ||
    filters.disabilityType !== "" ||
    filters.severity !== "" ||
    filters.budgetSource !== "" ||
    filters.priority !== "";

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter size={16} className="text-blue-400" />
          <span>Filter Data</span>
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ResultCount count={resultCount} total={totalCount} />
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Body */}
      <div className="p-5 space-y-5">
        {/* Group Toggle */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Kelompok Penerima</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Semua", color: "blue" },
              { value: "disability", label: "♿ Penyandang Disabilitas", color: "purple" },
              { value: "oap", label: "🏔 Orang Asli Papua", color: "amber" },
            ].map(({ value, label, color }) => (
              <ToggleFilter
                key={value}
                label={label}
                checked={filters.kelompok === value}
                onChange={() => onChange("kelompok", value)}
                color={color}
              />
            ))}
          </div>
        </div>

        {/* Grid filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <FilterSelect
            label="Kabupaten/Kota"
            value={filters.regency}
            onChange={(v) => onChange("regency", v)}
            options={REGENCIES}
            placeholder="Semua Wilayah"
          />
          <FilterSelect
            label="Kategori Program"
            value={filters.category}
            onChange={(v) => onChange("category", v)}
            options={CATEGORIES}
            placeholder="Semua Kategori"
          />
          <FilterSelect
            label="Jenis Disabilitas"
            value={filters.disabilityType}
            onChange={(v) => onChange("disabilityType", v)}
            options={DISABILITY_TYPES}
            placeholder="Semua Jenis"
          />
          <FilterSelect
            label="Tingkat Keparahan"
            value={filters.severity}
            onChange={(v) => onChange("severity", v)}
            options={SEVERITIES}
            placeholder="Semua Tingkat"
          />
          <FilterSelect
            label="Sumber Anggaran"
            value={filters.budgetSource}
            onChange={(v) => onChange("budgetSource", v)}
            options={BUDGET_SOURCES}
            placeholder="Semua Sumber"
          />
          <FilterSelect
            label="Prioritas"
            value={filters.priority}
            onChange={(v) => onChange("priority", v)}
            options={PRIORITIES}
            placeholder="Semua Prioritas"
          />
        </div>
      </div>
    </div>
  );
}
