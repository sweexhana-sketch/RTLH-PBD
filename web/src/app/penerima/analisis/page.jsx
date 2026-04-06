import React, { useState } from "react";
import Layout from "../../../components/layout";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Accessibility, Globe, Wallet, TrendingUp, Users,
  AlertCircle, CheckCircle2, Info, ArrowRight,
} from "lucide-react";

// Mock stats for development
const MOCK_STATS = {
  summary: {
    totalDisability: 7, totalOap: 9, totalOapDisability: 4, totalGeneral: 2,
    budgetDisability: 525000000, budgetOap: 570000000,
    totalBudget: 752000000, totalRecords: 12,
  },
  byDisabilityType: [
    { name: "Fisik", value: 2 }, { name: "Mental", value: 1 },
    { name: "Netra", value: 1 }, { name: "Rungu", value: 1 },
    { name: "Intelektual", value: 1 }, { name: "Ganda", value: 1 },
  ],
  byBudgetSource: [
    { name: "Dana Otsus", count: 4, budget: 260000000 },
    { name: "DAK Afirmasi", count: 3, budget: 213000000 },
    { name: "APBN", count: 3, budget: 209000000 },
    { name: "APBD Provinsi", count: 1, budget: 35000000 },
    { name: "APBD Kabupaten", count: 1, budget: 42000000 },
  ],
  byRegency: [
    { name: "Sorong", disability: 2, oap: 2, general: 0, budget: 203000000 },
    { name: "Maybrat", disability: 0, oap: 2, general: 0, budget: 132000000 },
    { name: "Tambrauw", disability: 2, oap: 2, general: 0, budget: 170000000 },
    { name: "Sorong Selatan", disability: 2, oap: 0, general: 1, budget: 187000000 },
    { name: "Raja Ampat", disability: 0, oap: 2, general: 0, budget: 60000000 },
  ],
};

const DISABILITY_TYPE_COLORS = ["#a855f7", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"];
const PIE_COLORS_MAIN = ["#a855f7", "#f59e0b", "#10b981", "#94a3b8"];
const BUDGET_SOURCE_COLORS = { "Dana Otsus": "#f59e0b", "DAK Afirmasi": "#10b981", "APBN": "#3b82f6", "APBD Provinsi": "#6366f1", "APBD Kabupaten": "#8b5cf6" };

const BIG_STAT = ({ label, value, sub, color, icon: Icon }) => (
  <div className={`flex-1 p-6 rounded-2xl border ${color} relative overflow-hidden`}>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} />
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1.5 opacity-60">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      {label && <p className="font-bold text-white mb-2">{label}</p>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-gray-400">{p.name || p.dataKey}:</span>
          <span className="font-bold text-white">
            {p.dataKey === "budget" ? `Rp ${new Intl.NumberFormat("id-ID", { notation: "compact" }).format(p.value)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalisasPenerimaPage() {
  const [activeSource, setActiveSource] = useState(null);

  const { data: stats = MOCK_STATS } = useQuery({
    queryKey: ["beneficiaries-stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/beneficiaries");
        const data = await res.json();
        return data.summary ? data : MOCK_STATS;
      } catch { return MOCK_STATS; }
    },
  });

  const { summary, byDisabilityType = [], byBudgetSource = [], byRegency = [] } = stats;

  const mainPieData = [
    { name: "OAP + Disabilitas", value: summary.totalOapDisability, fill: "#a855f7" },
    { name: "Hanya OAP", value: summary.totalOap - summary.totalOapDisability, fill: "#f59e0b" },
    { name: "Hanya Disabilitas", value: summary.totalDisability - summary.totalOapDisability, fill: "#3b82f6" },
    { name: "Umum", value: summary.totalGeneral, fill: "#334155" },
  ].filter((d) => d.value > 0);

  const budgetCoverage = ((summary.budgetDisability + summary.budgetOap) / summary.totalBudget * 100).toFixed(1);

  return (
    <Layout activePage="penerima">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <a href="/penerima" className="hover:text-white transition-colors">Penerima Manfaat</a>
              <ArrowRight size={12} />
              <span>Analisis Anggaran Afirmatif</span>
            </div>
            <h1 className="text-2xl font-bold">Analisis Anggaran Afirmatif</h1>
            <p className="text-gray-400 text-sm mt-1">Alokasi dan distribusi anggaran untuk kelompok prioritas afirmatif</p>
          </div>
          <button className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl text-sm font-medium transition-all">
            Export Laporan
          </button>
        </div>

        {/* Big Stats Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <BIG_STAT
            label="Penyandang Disabilitas"
            value={summary.totalDisability}
            sub={`Rp ${new Intl.NumberFormat("id-ID", { notation: "compact" }).format(summary.budgetDisability)} estimasi anggaran`}
            color="border-purple-500/30 bg-purple-500/5 text-purple-300"
            icon={Accessibility}
          />
          <BIG_STAT
            label="Orang Asli Papua"
            value={summary.totalOap}
            sub={`Rp ${new Intl.NumberFormat("id-ID", { notation: "compact" }).format(summary.budgetOap)} estimasi anggaran`}
            color="border-amber-500/30 bg-amber-500/5 text-amber-300"
            icon={Globe}
          />
          <BIG_STAT
            label="Total Penerima"
            value={summary.totalRecords}
            sub={`${summary.totalGeneral} penerima umum`}
            color="border-blue-500/30 bg-blue-500/5 text-blue-300"
            icon={Users}
          />
          <BIG_STAT
            label="Porsi Anggaran Afirmatif"
            value={`${budgetCoverage}%`}
            sub={`Rp ${new Intl.NumberFormat("id-ID", { notation: "compact" }).format(summary.totalBudget)} total`}
            color="border-green-500/30 bg-green-500/5 text-green-300"
            icon={Wallet}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut: Komposisi Penerima */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <Users size={16} className="text-blue-400" /> Komposisi Penerima
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mainPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {mainPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {mainPieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span className="text-gray-300">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value} org</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut: Jenis Disabilitas */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <Accessibility size={16} className="text-purple-400" /> Jenis Disabilitas
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byDisabilityType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                    {byDisabilityType.map((_, i) => <Cell key={i} fill={DISABILITY_TYPE_COLORS[i % DISABILITY_TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-y-2 mt-2">
              {byDisabilityType.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DISABILITY_TYPE_COLORS[i % DISABILITY_TYPE_COLORS.length] }} />
                  <span className="text-gray-300">{d.name}</span>
                  <span className="font-bold ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Recommendation Card */}
          <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-6 rounded-2xl border border-blue-500/30">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Info size={16} className="text-blue-300" /> Rekomendasi Kebijakan
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-purple-200 uppercase mb-1">Prioritas Disabilitas Berat</p>
                <p className="text-xs text-blue-100">
                  {byDisabilityType.filter((d) => ["Fisik", "Ganda"].includes(d.name)).reduce((s, d) => s + d.value, 0)} penerima dengan disabilitas berat perlu penanganan segera Triwulan I 2026.
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-amber-200 uppercase mb-1">Optimasi Dana Otsus</p>
                <p className="text-xs text-blue-100">
                  Dana Otsus merupakan sumber utama untuk {byBudgetSource.find((s) => s.name === "Dana Otsus")?.count || 0} penerima OAP.
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-green-200 uppercase mb-1">Verifikasi DTSEN</p>
                <p className="text-xs text-blue-100">Pastikan integrasi DTSEN untuk semua penerima afirmatif sebelum pencairan anggaran.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-200 mt-3">
                <CheckCircle2 size={12} className="text-green-400" />
                <span>Analisis berbasis data real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget by Source */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <Wallet size={16} className="text-blue-400" /> Alokasi per Sumber Dana
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byBudgetSource} layout="vertical" margin={{ left: 90, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} width={85} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="budget" radius={[0, 8, 8, 0]} barSize={24}>
                    {byBudgetSource.map((entry) => (
                      <Cell key={entry.name} fill={BUDGET_SOURCE_COLORS[entry.name] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution by Regency */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" /> Distribusi per Kabupaten
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRegency} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="disability" name="Disabilitas" fill="#a855f7" radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="oap" name="OAP" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="general" name="Umum" fill="#334155" radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              {[{ label: "Disabilitas", color: "#a855f7" }, { label: "OAP", color: "#f59e0b" }, { label: "Umum", color: "#334155" }].map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Source Detail Table */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" /> Rincian Anggaran per Sumber Dana
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0f172a]/40">
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Sumber Dana</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Jumlah Penerima</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Total Anggaran</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Rata-rata per Penerima</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">% dari Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {byBudgetSource.map((src) => (
                <tr key={src.name} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: BUDGET_SOURCE_COLORS[src.name] || "#6366f1" }} />
                      <span className="font-medium">{src.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{src.count}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs">Rp {new Intl.NumberFormat("id-ID").format(src.budget)}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                    Rp {new Intl.NumberFormat("id-ID").format(Math.round(src.budget / src.count))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(src.budget / summary.totalBudget * 100).toFixed(0)}%`, background: BUDGET_SOURCE_COLORS[src.name] || "#6366f1" }}
                        />
                      </div>
                      <span className="text-xs font-bold">{(src.budget / summary.totalBudget * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700 bg-[#0f172a]/40">
                <td className="px-6 py-3 text-xs font-bold">TOTAL</td>
                <td className="px-6 py-3 text-center text-xs font-bold">{summary.totalRecords}</td>
                <td className="px-6 py-3 text-right font-mono text-xs font-bold text-blue-400">Rp {new Intl.NumberFormat("id-ID").format(summary.totalBudget)}</td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Layout>
  );
}
