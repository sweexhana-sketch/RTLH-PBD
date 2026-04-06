import React, { useState, useMemo } from "react";
import Layout from "../../components/layout";
import FilterPanel from "../../components/FilterPanel";
import { BeneficiaryBadge, DisabilityTypeBadge, SeverityDot, BudgetSourceBadge } from "../../components/BeneficiaryBadge";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Plus, MapPin, Users, Accessibility, Globe, Wallet,
  Link2, Unlink2, MoreHorizontal, Download, Eye,
} from "lucide-react";

// ── Mock data (dipakai jika API /api/infrastructure kosong) ──────────────────
const MOCK_RECORDS = [
  { id: 1, owner_name: "Yohanis Kambu", regency: "Sorong", district: "Sorong Utara", village: "Remu Utara", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 85000000, is_disability: true, is_oap: true, disability_type: "Fisik", disability_severity: "Berat", budget_source: "Dana Otsus", dtsen_status: "Linked", dtsen_id: "DTSEN-001" },
  { id: 2, owner_name: "Maria Anim", regency: "Maybrat", district: "Ayamaru", village: "Tinalit", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 90000000, is_disability: false, is_oap: true, disability_type: null, disability_severity: null, budget_source: "DAK Afirmasi", dtsen_status: "Linked", dtsen_id: "DTSEN-002" },
  { id: 3, owner_name: "Petrus Haba", regency: "Tambrauw", district: "Fef", village: "Sausapor", category: "Sanitasi", condition_status: "Rusak Ringan", intervention_priority: "Sedang", budget_estimate: 35000000, is_disability: true, is_oap: true, disability_type: "Netra", disability_severity: "Sedang", budget_source: "APBD Provinsi", dtsen_status: "Unlinked", dtsen_id: null },
  { id: 4, owner_name: "Agnes Aituarauw", regency: "Sorong Selatan", district: "Teminabuan", village: "Teminabuan", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 95000000, is_disability: true, is_oap: false, disability_type: "Mental", disability_severity: "Berat", budget_source: "APBN", dtsen_status: "Linked", dtsen_id: "DTSEN-004" },
  { id: 5, owner_name: "Yusuf Sagrim", regency: "Raja Ampat", district: "Waigeo Selatan", village: "Waisai", category: "Air Bersih", condition_status: "Rusak Ringan", intervention_priority: "Sedang", budget_estimate: 28000000, is_disability: false, is_oap: true, disability_type: null, disability_severity: null, budget_source: "Dana Otsus", dtsen_status: "Linked", dtsen_id: "DTSEN-005" },
  { id: 6, owner_name: "Kornelia Wanma", regency: "Sorong", district: "Sorong Timur", village: "Klasabi", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 88000000, is_disability: true, is_oap: true, disability_type: "Rungu", disability_severity: "Sedang", budget_source: "DAK Afirmasi", dtsen_status: "Linked", dtsen_id: "DTSEN-006" },
  { id: 7, owner_name: "Emanuel Futwembun", regency: "Maybrat", district: "Mare", village: "Ayata", category: "Sanitasi", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 42000000, is_disability: false, is_oap: true, disability_type: null, disability_severity: null, budget_source: "APBD Kabupaten", dtsen_status: "Unlinked", dtsen_id: null },
  { id: 8, owner_name: "Sefnat Kokop", regency: "Tambrauw", district: "Amberbaken", village: "Saukorem", category: "RTLH", condition_status: "Rusak Ringan", intervention_priority: "Rendah", budget_estimate: 55000000, is_disability: true, is_oap: true, disability_type: "Intelektual", disability_severity: "Ringan", budget_source: "Dana Otsus", dtsen_status: "Linked", dtsen_id: "DTSEN-008" },
  { id: 9, owner_name: "Obet Klasjau", regency: "Raja Ampat", district: "Misool", village: "Waigama", category: "Air Bersih", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 32000000, is_disability: false, is_oap: true, disability_type: null, disability_severity: null, budget_source: "APBN", dtsen_status: "Linked", dtsen_id: "DTSEN-009" },
  { id: 10, owner_name: "Melkias Malak", regency: "Sorong Selatan", district: "Kokoda", village: "Kokoda Utara", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 92000000, is_disability: true, is_oap: false, disability_type: "Ganda", disability_severity: "Berat", budget_source: "APBN", dtsen_status: "Unlinked", dtsen_id: null },
  { id: 11, owner_name: "Redempta Hindom", regency: "Sorong", district: "Sorong Barat", village: "Klablim", category: "Sanitasi", condition_status: "Rusak Ringan", intervention_priority: "Sedang", budget_estimate: 30000000, is_disability: false, is_oap: true, disability_type: null, disability_severity: null, budget_source: "DAK Afirmasi", dtsen_status: "Linked", dtsen_id: "DTSEN-011" },
  { id: 12, owner_name: "Benediktus Baru", regency: "Tambrauw", district: "Miyah", village: "Bikar", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", budget_estimate: 80000000, is_disability: true, is_oap: true, disability_type: "Fisik", disability_severity: "Sedang", budget_source: "Dana Otsus", dtsen_status: "Linked", dtsen_id: "DTSEN-012" },
];

const CATEGORY_COLORS = {
  RTLH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Sanitasi: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Air Bersih": "bg-blue-500/10 text-blue-500 border-blue-500/20",
};
const PRIORITY_COLORS = {
  Tinggi: "text-red-400 bg-red-500/10",
  Sedang: "text-amber-400 bg-amber-500/10",
  Rendah: "text-green-400 bg-green-500/10",
};

const INIT_FILTERS = { kelompok: "all", category: "", regency: "", disabilityType: "", severity: "", budgetSource: "", priority: "" };

const StatMini = ({ label, value, icon: Icon, color }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
    <Icon size={16} />
    <div>
      <p className="text-xs text-current opacity-70">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

export default function PenerimaPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [selectedRow, setSelectedRow] = useState(null);

  const { data: rawRecords = [] } = useQuery({
    queryKey: ["infrastructure-all"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/infrastructure");
        const data = await res.json();
        return data.length ? data : MOCK_RECORDS;
      } catch {
        return MOCK_RECORDS;
      }
    },
  });

  const records = rawRecords.length ? rawRecords : MOCK_RECORDS;

  const handleFilterChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));
  const handleReset = () => setFilters(INIT_FILTERS);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filters.kelompok === "disability" && !r.is_disability) return false;
      if (filters.kelompok === "oap" && !r.is_oap) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.regency && r.regency !== filters.regency) return false;
      if (filters.disabilityType && r.disability_type !== filters.disabilityType) return false;
      if (filters.severity && r.disability_severity !== filters.severity) return false;
      if (filters.budgetSource && r.budget_source !== filters.budgetSource) return false;
      if (filters.priority && r.intervention_priority !== filters.priority) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.owner_name?.toLowerCase().includes(q) ||
          r.regency?.toLowerCase().includes(q) ||
          r.village?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, filters, search]);

  const totalBudget = filtered.reduce((s, r) => s + Number(r.budget_estimate), 0);
  const totalDisability = filtered.filter((r) => r.is_disability).length;
  const totalOap = filtered.filter((r) => r.is_oap).length;

  return (
    <Layout activePage="penerima">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Data Penerima Manfaat</h1>
            <p className="text-gray-400 text-sm">Kelompok afirmatif: Penyandang Disabilitas & Orang Asli Papua</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-all">
              <Download size={16} /> Export
            </button>
            <a
              href="/penerima/tambah"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-950/40"
            >
              <Plus size={16} /> Tambah Penerima
            </a>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMini label="Total Ditampilkan" value={filtered.length} icon={Users} color="border-gray-700 text-white" />
          <StatMini label="Penyandang Disabilitas" value={totalDisability} icon={Accessibility} color="border-purple-500/30 text-purple-400" />
          <StatMini label="Orang Asli Papua" value={totalOap} icon={Globe} color="border-amber-500/30 text-amber-400" />
          <StatMini label="Estimasi Anggaran" value={`Rp ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalBudget)}`} icon={Wallet} color="border-blue-500/30 text-blue-400" />
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          resultCount={filtered.length}
          totalCount={records.length}
        />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Cari nama penerima, wilayah, atau desa..."
            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f172a]/50">
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Penerima & Lokasi</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kelompok</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Disabilitas</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prioritas</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sumber Dana</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Anggaran</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">DTSEN</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={32} className="text-gray-700" />
                        <p>Tidak ada penerima ditemukan dengan filter ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr
                      key={record.id}
                      className={`hover:bg-gray-800/30 transition-colors group cursor-pointer ${selectedRow === record.id ? "bg-gray-800/40" : ""}`}
                      onClick={() => setSelectedRow(selectedRow === record.id ? null : record.id)}
                    >
                      {/* Penerima & Lokasi */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{record.owner_name}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                          <MapPin size={10} />
                          <span>{record.regency}, {record.village}</span>
                        </div>
                      </td>

                      {/* Kelompok */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {record.is_disability && <BeneficiaryBadge type="disability" />}
                          {record.is_oap && <BeneficiaryBadge type="oap" />}
                          {!record.is_disability && !record.is_oap && (
                            <span className="text-xs text-gray-500">Umum</span>
                          )}
                        </div>
                      </td>

                      {/* Disabilitas */}
                      <td className="px-5 py-4">
                        {record.is_disability ? (
                          <div className="space-y-1">
                            <DisabilityTypeBadge type={record.disability_type} />
                            <SeverityDot severity={record.disability_severity} />
                          </div>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>

                      {/* Program */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[record.category]}`}>
                          {record.category}
                        </span>
                      </td>

                      {/* Prioritas */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${PRIORITY_COLORS[record.intervention_priority]}`}>
                          {record.intervention_priority}
                        </span>
                      </td>

                      {/* Sumber Dana */}
                      <td className="px-5 py-4">
                        <BudgetSourceBadge source={record.budget_source} />
                      </td>

                      {/* Anggaran */}
                      <td className="px-5 py-4 font-mono text-xs">
                        Rp {new Intl.NumberFormat("id-ID").format(record.budget_estimate)}
                      </td>

                      {/* DTSEN */}
                      <td className="px-5 py-4">
                        {record.dtsen_status === "Linked" ? (
                          <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                            <Link2 size={12} /> <span>{record.dtsen_id}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Unlink2 size={12} /> <span>Unlinked</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                            <Eye size={15} />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Footer Total */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-700 bg-[#0f172a]/40">
                    <td colSpan="6" className="px-5 py-3 text-xs text-gray-500 font-semibold">
                      Total ({filtered.length} data)
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-blue-400">
                      Rp {new Intl.NumberFormat("id-ID").format(totalBudget)}
                    </td>
                    <td colSpan="2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
