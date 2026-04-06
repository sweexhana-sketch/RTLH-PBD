import React from "react";
import Layout from "../../components/layout";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
} from "recharts";
import {
  AlertCircle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Info,
} from "lucide-react";

const PRIORITY_COLORS = {
  Tinggi: "#ef4444",
  Sedang: "#f59e0b",
  Rendah: "#10b981",
};

export default function AnalysisPage() {
  const { data: records = [] } = useQuery({
    queryKey: ["infrastructure-records"],
    queryFn: async () => {
      const response = await fetch("/api/infrastructure");
      return response.json();
    },
  });

  const totalBudget = records.reduce(
    (sum, r) => sum + Number(r.budget_estimate),
    0,
  );

  const priorityData = records.reduce((acc, curr) => {
    const priority = curr.intervention_priority || "Rendah";
    if (!acc[priority]) acc[priority] = 0;
    acc[priority]++;
    return acc;
  }, {});

  const pieData = Object.entries(priorityData).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_COLORS[name],
  }));

  const categoryBudget = records.reduce((acc, curr) => {
    const category = curr.category;
    if (!acc[category]) acc[category] = 0;
    acc[category] += Number(curr.budget_estimate);
    return acc;
  }, {});

  const barData = Object.entries(categoryBudget).map(([name, budget]) => ({
    name,
    budget,
  }));

  return (
    <Layout activePage="analysis">
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Summary Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-8 rounded-3xl border border-blue-500/30 shadow-xl relative overflow-hidden">
            <Wallet className="absolute -right-4 -bottom-4 text-blue-900/40 w-40 h-40" />
            <div className="relative z-10">
              <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wider">
                Total Anggaran Dibutuhkan
              </p>
              <h2 className="text-4xl font-bold mb-6">
                Rp {new Intl.NumberFormat("id-ID").format(totalBudget)}
              </h2>
              <div className="space-y-3">
                {Object.entries(categoryBudget).map(([cat, amount]) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-blue-200">{cat}</span>
                    <span className="font-semibold">
                      Rp {new Intl.NumberFormat("id-ID").format(amount)}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-white text-blue-900 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                Ajukan Anggaran 2026
              </button>
            </div>
          </div>

          {/* Priority Chart */}
          <div className="lg:col-span-1 bg-[#1e293b] p-8 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-6 w-full flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Prioritas Intervensi
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full mt-4">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="w-2 h-2 rounded-full mb-1"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    {item.name}
                  </span>
                  <span className="text-lg font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Info */}
          <div className="lg:col-span-1 bg-[#1e293b] p-8 rounded-3xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Info size={20} className="text-blue-500" />
              Kebijakan Rekomendasi
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs font-bold text-red-500 uppercase mb-1 tracking-wider">
                  Intervensi Segera
                </p>
                <p className="text-sm text-gray-300">
                  Terdapat{" "}
                  <span className="font-bold text-white">
                    {priorityData["Tinggi"] || 0}
                  </span>{" "}
                  unit dengan kondisi Rusak Berat yang memerlukan penanganan
                  darurat di Triwulan I.
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs font-bold text-blue-500 uppercase mb-1 tracking-wider">
                  Sumber Dana
                </p>
                <p className="text-sm text-gray-300">
                  Data telah tersinkronisasi dengan DTSEN, layak mendapatkan
                  subsidi APBN Tahun Anggaran 2026.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-6">
                <CheckCircle2 className="text-green-500" size={16} />
                <span>Analisis data berbasis 100% data riil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Budget Bar Chart */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-gray-800">
          <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Alokasi Anggaran per Kategori
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 50, right: 30 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <XAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value) =>
                    `Rp ${new Intl.NumberFormat("id-ID").format(value)}`
                  }
                />
                <Bar
                  dataKey="budget"
                  fill="#3b82f6"
                  radius={[0, 10, 10, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
