import React from "react";

const BADGE_CONFIG = {
  disability: {
    label: "Disabilitas",
    className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    icon: "♿",
  },
  oap: {
    label: "OAP",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    icon: "🏔",
  },
};

const DISABILITY_TYPE_COLORS = {
  Fisik: "bg-blue-500/10 text-blue-400",
  Netra: "bg-cyan-500/10 text-cyan-400",
  Rungu: "bg-teal-500/10 text-teal-400",
  Mental: "bg-rose-500/10 text-rose-400",
  Intelektual: "bg-orange-500/10 text-orange-400",
  Ganda: "bg-fuchsia-500/10 text-fuchsia-400",
};

export function BeneficiaryBadge({ type }) {
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.className}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function DisabilityTypeBadge({ type }) {
  if (!type) return null;
  const cls = DISABILITY_TYPE_COLORS[type] || "bg-gray-500/10 text-gray-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${cls}`}>
      {type}
    </span>
  );
}

export function SeverityDot({ severity }) {
  const colors = { Ringan: "bg-green-500", Sedang: "bg-amber-500", Berat: "bg-red-500" };
  if (!severity) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[severity] || "bg-gray-500"}`} />
      <span className="text-xs text-gray-400">{severity}</span>
    </div>
  );
}

export function BudgetSourceBadge({ source }) {
  const colors = {
    "APBN": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "APBD Provinsi": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "APBD Kabupaten": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "DAK Afirmasi": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Dana Otsus": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const cls = colors[source] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {source || "Lainnya"}
    </span>
  );
}
