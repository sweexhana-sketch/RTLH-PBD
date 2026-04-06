import React from "react";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  RefreshCw,
  MapPin,
  UserCheck,
  PieChart,
  ChevronRight,
} from "lucide-react";

const SidebarLink = ({ href, icon: Icon, label, active, indent = false }) => (
  <a
    href={href}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
      indent ? "ml-3 text-sm" : ""
    } ${
      active
        ? "bg-[#1e3a8a] text-white"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`}
  >
    <Icon size={indent ? 16 : 20} />
    <span className="font-medium">{label}</span>
  </a>
);

const SidebarGroupLabel = ({ label }) => (
  <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
);

export default function Layout({ children, activePage }) {
  const isPenerima = activePage === "penerima";

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 flex flex-col p-5 sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col items-center gap-2 mb-6 px-2 pt-2">
          <img
            src="/Logo_Papua_Barat_Daya.png"
            alt="Logo Dinas PUPR Papua Barat Daya"
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-xs font-bold leading-tight text-white">DINAS PUPR</h1>
            <p className="text-[9px] text-gray-400 tracking-wider leading-tight">PROVINSI PAPUA</p>
            <p className="text-[9px] text-amber-400 font-semibold tracking-wider leading-tight">BARAT DAYA</p>
          </div>
          {/* Nama Sistem */}
          <div className="w-full mt-1 rounded-xl border border-blue-800/60 bg-gradient-to-b from-blue-950/60 to-[#0f172a]/80 px-3 py-2.5 text-center shadow-inner">
            <p className="text-[11px] font-extrabold tracking-widest text-blue-300 uppercase">SI-RTLH</p>
            <p className="text-[8px] text-gray-400 leading-tight mt-0.5">Sistem Informasi</p>
            <p className="text-[8px] text-gray-400 leading-tight">Rumah Tidak Layak Huni</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarGroupLabel label="Utama" />
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" active={activePage === "dashboard"} />
          <SidebarLink href="/data" icon={Database} label="Data Infrastruktur" active={activePage === "data"} />
          <SidebarLink href="/analysis" icon={BarChart3} label="Analisis & Anggaran" active={activePage === "analysis"} />
          <SidebarLink href="/sync" icon={RefreshCw} label="Sinkronisasi DTSEN" active={activePage === "sync"} />

          <SidebarGroupLabel label="Penerima Afirmatif" />
          {/* Parent menu Penerima */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${isPenerima ? "text-white" : "text-gray-400"}`}>
            <UserCheck size={20} className={isPenerima ? "text-amber-400" : ""} />
            <span className="font-semibold text-sm flex-1">Penerima Manfaat</span>
            <ChevronRight size={13} className={`transition-transform ${isPenerima ? "rotate-90 text-amber-400" : ""}`} />
          </div>
          <div className="space-y-0.5">
            <SidebarLink
              href="/penerima"
              icon={Database}
              label="Data Penerima"
              active={activePage === "penerima" && !window?.location?.pathname?.includes("/analisis")}
              indent
            />
            <SidebarLink
              href="/penerima/tambah"
              icon={UserCheck}
              label="Tambah Penerima"
              active={activePage === "penerima-tambah"}
              indent
            />
            <SidebarLink
              href="/penerima/analisis"
              icon={PieChart}
              label="Analisis Afirmatif"
              active={activePage === "penerima-analisis"}
              indent
            />
          </div>
        </nav>

        <div className="pt-5 border-t border-gray-800 text-[10px] text-gray-500 space-y-0.5">
          <p>© 2026 DINAS PUPR</p>
          <p>PROVINSI PAPUA BARAT DAYA</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-base font-semibold capitalize">
              {activePage === "penerima" ? "Penerima Manfaat" :
               activePage === "penerima-analisis" ? "Analisis Anggaran Afirmatif" :
               activePage === "penerima-tambah" ? "Tambah Penerima Manfaat" :
               activePage?.replace(/-/g, " ")}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={11} />
              <span>Provinsi Papua Barat Daya</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">Administrator PUPR</span>
              <span className="text-[10px] text-green-500 font-mono">System Online</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
              <span className="text-xs font-bold">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}

