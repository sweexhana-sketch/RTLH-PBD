import React from "react";
import Layout from "../components/layout";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Home,
  Droplets,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Users,
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800 flex items-start justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
      <div className="flex items-center gap-1 mt-2 text-[10px]">
        <TrendingUp size={10} className="text-green-500" />
        <span className="text-green-500 font-medium">{trend}</span>
        <span className="text-gray-500 ml-1">teridentifikasi</span>
      </div>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const CATEGORY_COLORS = {
  RTLH: "#f59e0b",
  Sanitasi: "#10b981",
  "Air Bersih": "#3b82f6",
};

export default function DashboardPage() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["infrastructure-all"],
    queryFn: async () => {
      const response = await fetch("/api/infrastructure");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const stats = {
    rtlh: records.filter((r) => r.category === "RTLH").length,
    sanitation: records.filter((r) => r.category === "Sanitasi").length,
    water: records.filter((r) => r.category === "Air Bersih").length,
    total: records.length,
  };

  const regencyData = records.reduce((acc, curr) => {
    const regency = curr.regency;
    if (!acc[regency])
      acc[regency] = { name: regency, rtlh: 0, sanitation: 0, water: 0 };
    if (curr.category === "RTLH") acc[regency].rtlh++;
    if (curr.category === "Sanitasi") acc[regency].sanitation++;
    if (curr.category === "Air Bersih") acc[regency].water++;
    return acc;
  }, {});

  const chartData = Object.values(regencyData);

  const pieData = [
    { name: "RTLH", value: stats.rtlh, fill: CATEGORY_COLORS["RTLH"] },
    {
      name: "Sanitasi",
      value: stats.sanitation,
      fill: CATEGORY_COLORS["Sanitasi"],
    },
    {
      name: "Air Bersih",
      value: stats.water,
      fill: CATEGORY_COLORS["Air Bersih"],
    },
  ];

  return (
    <Layout activePage="dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ringkasan Infrastruktur</h1>
            <p className="text-gray-400 max-w-2xl">
              Pantauan terkini data RTLH, Sanitasi, dan Air Bersih di seluruh
              Provinsi Papua Barat Daya berdasarkan integrasi data DTSEN.
            </p>
          </div>
          <button className="bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-[#2563eb] transition-all shadow-lg shadow-blue-900/20">
            Export Laporan <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total RTLH"
            value={stats.rtlh}
            icon={Home}
            color="bg-amber-500/20 text-amber-500"
            trend="+12%"
          />
          <StatCard
            title="Total Sanitasi"
            value={stats.sanitation}
            icon={Trash2}
            color="bg-emerald-500/20 text-emerald-500"
            trend="+5%"
          />
          <StatCard
            title="Total Air Bersih"
            value={stats.water}
            icon={Droplets}
            color="bg-blue-500/20 text-blue-500"
            trend="+8%"
          />
          <StatCard
            title="Total Penerima"
            value={stats.total}
            icon={Users}
            color="bg-indigo-500/20 text-indigo-500"
            trend="+15%"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 bg-[#1e293b] p-8 rounded-3xl border border-gray-800">
            <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-500" />
              Persebaran per Kabupaten/Kota
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#334155" }}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="rtlh"
                    fill={CATEGORY_COLORS["RTLH"]}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="sanitation"
                    fill={CATEGORY_COLORS["Sanitasi"]}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="water"
                    fill={CATEGORY_COLORS["Air Bersih"]}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6">
              {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
                <div key={name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-400">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-[#1e293b] p-8 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-8 w-full text-left">
              Komposisi Kebutuhan
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
            <div className="space-y-4 w-full mt-4">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value} Unit</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Add CSS for layout
const BarChart3 = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);
