import React, { useState } from "react";
import Layout from "../../components/layout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  FileJson,
  ArrowRight,
} from "lucide-react";

// Mock DTSEN data for demonstration
const MOCK_DTSEN_DATA = [
  {
    dtsen_id: "DTSEN-006",
    category: "RTLH",
    regency: "Kota Sorong",
    district: "Sorong Timur",
    village: "Kladufu",
    owner_name: "Bpk. Ahmad",
    condition_status: "Rusak Berat",
  },
  {
    dtsen_id: "DTSEN-007",
    category: "Sanitasi",
    regency: "Kabupaten Sorong Selatan",
    district: "Teminabuan",
    village: "Kaibus",
    owner_name: "Ibu Fatimah",
    condition_status: "Rusak Ringan",
  },
  {
    dtsen_id: "DTSEN-008",
    category: "Air Bersih",
    regency: "Kabupaten Maybrat",
    district: "Ayamaru",
    village: "Kartapura",
    owner_name: "Bpk. Karel",
    condition_status: "Rusak Berat",
  },
  {
    dtsen_id: "DTSEN-009",
    category: "RTLH",
    regency: "Kabupaten Raja Ampat",
    district: "Waigeo Selatan",
    village: "Saonek",
    owner_name: "Ibu Nurbaiti",
    condition_status: "Baik",
  },
];

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, success, error
  const [syncedCount, setSyncedCount] = useState(0);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/dtsen-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dtsen_data: data }),
      });
      if (!response.ok) throw new Error("Sync failed");
      return response.json();
    },
    onSuccess: (data) => {
      setSyncStatus("success");
      setSyncedCount(data.synced_count);
      queryClient.invalidateQueries({ queryKey: ["infrastructure-records"] });
      queryClient.invalidateQueries({ queryKey: ["infrastructure-all"] });
    },
    onError: () => {
      setSyncStatus("error");
    },
  });

  const handleSync = () => {
    setSyncStatus("syncing");
    // Simulate API delay
    setTimeout(() => {
      syncMutation.mutate(MOCK_DTSEN_DATA);
    }, 1500);
  };

  return (
    <Layout activePage="sync">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Connection Status Header */}
        <div className="bg-[#1e293b] p-10 rounded-3xl border border-gray-800 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Database size={64} className="text-blue-500" />
              <div className="absolute -right-2 -bottom-2 bg-green-500 p-1.5 rounded-full border-4 border-[#1e293b]">
                <ShieldCheck size={20} className="text-white" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">Integrasi Data DTSEN</h1>
            <p className="text-gray-400">
              Sistem terkoneksi dengan Database Pusat Data Terpadu Sistem
              Elektronik Nasional. Anda memiliki hak akses untuk menarik data
              intervensi wilayah Papua Barat Daya.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2 text-sm bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-300">DTSEN API: Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
              <span className="text-gray-500">Last Sync:</span>
              <span className="text-gray-300 font-mono">Today, 09:45 AM</span>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className={`
              w-full md:w-64 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl
              ${
                syncStatus === "syncing"
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-900/40"
              }
            `}
          >
            <RefreshCw
              size={24}
              className={syncStatus === "syncing" ? "animate-spin" : ""}
            />
            {syncStatus === "syncing"
              ? "Menyinkronkan..."
              : "Sinkronisasi Sekarang"}
          </button>
        </div>

        {/* Results / Info Cards */}
        {syncStatus === "success" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-500 text-lg">
                Sinkronisasi Berhasil
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                Sebanyak{" "}
                <span className="font-bold text-white">
                  {syncedCount} data baru
                </span>{" "}
                telah berhasil ditarik dari DTSEN dan diolah ke dalam database
                lokal.
              </p>
              <a
                href="/data"
                className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold mt-4 hover:underline"
              >
                Lihat Data Terkini <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-500 text-lg">
                Gagal Sinkronisasi
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                Terjadi kesalahan saat menghubungi server DTSEN. Pastikan
                koneksi internet stabil dan hak akses masih berlaku.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <FileJson size={18} className="text-amber-500" />
              Skema Data DTSEN
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex justify-between border-b border-gray-800 pb-2">
                <span>Unique ID</span>
                <span className="text-gray-300 font-mono">
                  String (DTSEN-XXX)
                </span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-2">
                <span>Nama Kepala Keluarga</span>
                <span className="text-gray-300 font-mono">String</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-2">
                <span>Kondisi Hunian</span>
                <span className="text-gray-300 font-mono">
                  Enum (Baik/RB/RR)
                </span>
              </li>
              <li className="flex justify-between">
                <span>Koordinat</span>
                <span className="text-gray-300 font-mono">Lat/Lng</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              Keamanan Data
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Seluruh data yang ditarik dari DTSEN telah melalui proses enkripsi
              AES-256. Data hanya digunakan untuk kepentingan internal DINAS
              PUPR Papua Barat Daya dalam menentukan kebijakan intervensi.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
