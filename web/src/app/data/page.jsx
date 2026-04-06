import React, { useState } from "react";
import Layout from "../../components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Link2,
  Unlink2,
  MapPin,
  Tag,
} from "lucide-react";

const CATEGORY_COLORS = {
  RTLH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Sanitasi: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Air Bersih": "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const STATUS_COLORS = {
  "Rusak Berat": "text-red-500 bg-red-500/10",
  "Rusak Ringan": "text-orange-500 bg-orange-500/10",
  Baik: "text-green-500 bg-green-500/10",
};

export default function DataPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["infrastructure-records", filterCategory],
    queryFn: async () => {
      let url = "/api/infrastructure";
      if (filterCategory !== "All") url += `?category=${filterCategory}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const filteredRecords = records.filter(
    (r) =>
      r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.regency?.toLowerCase().includes(search.toLowerCase()) ||
      r.village?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout activePage="data">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1e293b] p-4 rounded-2xl border border-gray-800">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama, wilayah, atau desa..."
              className="w-full bg-[#0f172a] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[#0f172a] border border-gray-700 rounded-xl px-3 py-1.5">
              <Filter size={16} className="text-gray-500" />
              <select
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">Semua Kategori</option>
                <option value="RTLH">RTLH</option>
                <option value="Sanitasi">Sanitasi</option>
                <option value="Air Bersih">Air Bersih</option>
              </select>
            </div>

            <button className="flex-1 md:flex-none bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-all">
              <Plus size={18} /> Tambah Data
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#1e293b] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#1e293b]/50">
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Penerima & Lokasi
                </th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kondisi
                </th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  DTSEN Status
                </th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estimasi Anggaran
                </th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan="6"
                        className="px-6 py-8 h-20 bg-gray-800/20"
                      ></td>
                    </tr>
                  ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-20 text-center text-gray-500"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {record.owner_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={10} />
                          <span>
                            {record.regency}, {record.village}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[record.category]}`}
                      >
                        {record.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[record.condition_status]}`}
                      >
                        {record.condition_status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {record.dtsen_status === "Linked" ? (
                        <div className="flex items-center gap-2 text-green-500 text-xs font-medium">
                          <Link2 size={14} />
                          <span>{record.dtsen_id}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                          <Unlink2 size={14} />
                          <span>Unlinked</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono text-sm">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        record.budget_estimate,
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
