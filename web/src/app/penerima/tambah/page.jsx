import React, { useState } from "react";
import Layout from "../../../components/layout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, MapPin, Home, Accessibility, Globe, Wallet,
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Phone, FileText,
} from "lucide-react";

const REGENCIES = ["Sorong", "Sorong Selatan", "Raja Ampat", "Tambrauw", "Maybrat"];
const DISTRICTS = {
  Sorong: ["Sorong Utara", "Sorong Timur", "Sorong Barat", "Sorong Selatan Kota"],
  "Sorong Selatan": ["Teminabuan", "Kokoda", "Metemani", "Moswaren"],
  "Raja Ampat": ["Waigeo Selatan", "Waigeo Utara", "Misool", "Salawati"],
  Tambrauw: ["Fef", "Amberbaken", "Miyah", "Abun"],
  Maybrat: ["Ayamaru", "Mare", "Aifat", "Aifat Timur"],
};
const DISABILITY_TYPES = ["Fisik", "Netra", "Rungu", "Mental", "Intelektual", "Ganda"];
const SEVERITIES = ["Ringan", "Sedang", "Berat"];
const BUDGET_SOURCES = ["APBN", "APBD Provinsi", "APBD Kabupaten", "DAK Afirmasi", "Dana Otsus"];

const STEPS = [
  { id: 1, label: "Data Pribadi", icon: User },
  { id: 2, label: "Lokasi & Program", icon: MapPin },
  { id: 3, label: "Kelompok Khusus", icon: Accessibility },
  { id: 4, label: "Anggaran", icon: Wallet },
];

const InputField = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
  </div>
);

const inputCls = "w-full bg-[#0f172a] border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder:text-gray-600";
const selectCls = `${inputCls} cursor-pointer`;

const ToggleCard = ({ label, description, checked, onChange, color = "purple" }) => {
  const colors = {
    purple: { border: "border-purple-500 bg-purple-500/10", text: "text-purple-300", dot: "bg-purple-500" },
    amber: { border: "border-amber-500 bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-500" },
  };
  const c = colors[color];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${checked ? c.border : "border-gray-700 hover:border-gray-600"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold text-sm ${checked ? c.text : "text-gray-300"}`}>{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? `${c.dot} border-transparent` : "border-gray-600"}`}>
          {checked && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </div>
    </button>
  );
};

export default function TambahPenerimaPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    owner_name: "", nik: "", phone: "",
    regency: "", district: "", village: "",
    category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi",
    is_disability: false, is_oap: false,
    disability_type: "", disability_severity: "",
    budget_estimate: "", budget_source: "APBN",
    dtsen_id: "", dtsen_status: "Unlinked",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (currentStep) => {
    const e = {};
    if (currentStep === 1) {
      if (!form.owner_name.trim()) e.owner_name = "Nama wajib diisi";
    }
    if (currentStep === 2) {
      if (!form.regency) e.regency = "Kabupaten wajib dipilih";
      if (!form.village.trim()) e.village = "Desa wajib diisi";
      if (!form.category) e.category = "Kategori wajib dipilih";
    }
    if (currentStep === 4) {
      if (!form.budget_estimate || isNaN(Number(form.budget_estimate))) e.budget_estimate = "Anggaran tidak valid";
      if (!form.budget_source) e.budget_source = "Sumber dana wajib dipilih";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep((s) => Math.min(s + 1, 4)); };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/infrastructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, budget_estimate: Number(data.budget_estimate) }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infrastructure-all"] });
      setSubmitted(true);
    },
  });

  const handleSubmit = () => {
    if (validate(4)) mutation.mutate(form);
  };

  if (submitted) {
    return (
      <Layout activePage="penerima">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Data Berhasil Disimpan!</h2>
            <p className="text-gray-400">Data penerima manfaat <span className="text-white font-semibold">{form.owner_name}</span> telah berhasil ditambahkan.</p>
          </div>
          <div className="flex gap-4">
            <a href="/penerima" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl text-sm font-medium transition-all">
              Lihat Daftar Penerima
            </a>
            <button onClick={() => { setSubmitted(false); setForm({ owner_name: "", nik: "", phone: "", regency: "", district: "", village: "", category: "RTLH", condition_status: "Rusak Berat", intervention_priority: "Tinggi", is_disability: false, is_oap: false, disability_type: "", disability_severity: "", budget_estimate: "", budget_source: "APBN", dtsen_id: "", dtsen_status: "Unlinked", notes: "" }); setStep(1); }} className="px-5 py-2.5 bg-[#1e293b] border border-gray-700 text-white rounded-xl text-sm font-medium hover:border-gray-600 transition-all">
              Tambah Data Baru
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="penerima">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Tambah Penerima Manfaat</h1>
          <p className="text-gray-400 text-sm mt-1">Lengkapi semua tahapan untuk mendaftarkan penerima baru</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${done ? "bg-green-500" : active ? "bg-[#1e3a8a] ring-2 ring-blue-600/40" : "bg-[#1e293b] border border-gray-700"}`}>
                    {done ? <CheckCircle2 size={18} className="text-white" /> : <Icon size={18} className={active ? "text-white" : "text-gray-500"} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? "text-white" : done ? "text-green-400" : "text-gray-600"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-2 mb-5 transition-colors ${step > s.id ? "bg-green-500" : "bg-gray-700"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8">
          {/* ── Step 1: Data Pribadi ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User size={18} className="text-blue-400" /> Data Pribadi Penerima</h2>
              <InputField label="Nama Lengkap" required>
                <input className={inputCls} placeholder="Masukkan nama lengkap" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
                {errors.owner_name && <p className="text-red-400 text-xs">{errors.owner_name}</p>}
              </InputField>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="NIK" hint="16 digit Nomor Induk Kependudukan">
                  <input className={inputCls} placeholder="3200xxxxxxxxxxxxxx" maxLength={16} value={form.nik} onChange={(e) => set("nik", e.target.value)} />
                </InputField>
                <InputField label="No. Telepon">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className={`${inputCls} pl-9`} placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </InputField>
              </div>
              <InputField label="Catatan Tambahan">
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-gray-500" />
                  <textarea className={`${inputCls} pl-9 resize-none`} rows={3} placeholder="Informasi tambahan yang relevan..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </InputField>
            </div>
          )}

          {/* ── Step 2: Lokasi & Program ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2"><MapPin size={18} className="text-blue-400" /> Lokasi & Program</h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Kabupaten/Kota" required>
                  <select className={selectCls} value={form.regency} onChange={(e) => { set("regency", e.target.value); set("district", ""); }}>
                    <option value="">-- Pilih Kabupaten --</option>
                    {REGENCIES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.regency && <p className="text-red-400 text-xs">{errors.regency}</p>}
                </InputField>
                <InputField label="Kecamatan">
                  <select className={selectCls} value={form.district} onChange={(e) => set("district", e.target.value)} disabled={!form.regency}>
                    <option value="">-- Pilih Kecamatan --</option>
                    {(DISTRICTS[form.regency] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>
              </div>
              <InputField label="Desa/Kelurahan" required>
                <input className={inputCls} placeholder="Masukkan nama desa/kelurahan" value={form.village} onChange={(e) => set("village", e.target.value)} />
                {errors.village && <p className="text-red-400 text-xs">{errors.village}</p>}
              </InputField>
              <div className="grid grid-cols-3 gap-4">
                <InputField label="Kategori Program" required>
                  <select className={selectCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                    <option value="RTLH">RTLH</option>
                    <option value="Sanitasi">Sanitasi</option>
                    <option value="Air Bersih">Air Bersih</option>
                  </select>
                </InputField>
                <InputField label="Kondisi Saat Ini">
                  <select className={selectCls} value={form.condition_status} onChange={(e) => set("condition_status", e.target.value)}>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Baik">Baik</option>
                  </select>
                </InputField>
                <InputField label="Prioritas Intervensi">
                  <select className={selectCls} value={form.intervention_priority} onChange={(e) => set("intervention_priority", e.target.value)}>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </InputField>
              </div>
            </div>
          )}

          {/* ── Step 3: Kelompok Khusus ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Accessibility size={18} className="text-blue-400" /> Klasifikasi Kelompok Khusus</h2>
              <div className="space-y-3">
                <ToggleCard
                  label="♿ Penyandang Disabilitas"
                  description="Penerima termasuk dalam kategori penyandang disabilitas"
                  checked={form.is_disability}
                  onChange={(v) => set("is_disability", v)}
                  color="purple"
                />
                <ToggleCard
                  label="🏔 Orang Asli Papua (OAP)"
                  description="Penerima merupakan Orang Asli Papua berdasarkan identitas suku/marga"
                  checked={form.is_oap}
                  onChange={(v) => set("is_oap", v)}
                  color="amber"
                />
              </div>

              {form.is_disability && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <p className="col-span-2 text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Accessibility size={12} /> Detail Disabilitas
                  </p>
                  <InputField label="Jenis Disabilitas" required>
                    <select className={selectCls} value={form.disability_type} onChange={(e) => set("disability_type", e.target.value)}>
                      <option value="">-- Pilih Jenis --</option>
                      {DISABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Tingkat Keparahan">
                    <select className={selectCls} value={form.disability_severity} onChange={(e) => set("disability_severity", e.target.value)}>
                      <option value="">-- Pilih Tingkat --</option>
                      {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </InputField>
                </div>
              )}

              {!form.is_disability && !form.is_oap && (
                <div className="flex items-center gap-3 p-4 bg-gray-800/40 rounded-xl border border-gray-700">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm text-gray-400">Tandai setidaknya satu kelompok untuk mendapatkan prioritas anggaran afirmatif, atau lanjut jika penerima merupakan masyarakat umum.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Anggaran ── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={18} className="text-blue-400" /> Estimasi Anggaran</h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Estimasi Anggaran (Rp)" required hint="Masukkan nominal dalam Rupiah">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">Rp</span>
                    <input
                      type="number"
                      className={`${inputCls} pl-10`}
                      placeholder="85000000"
                      value={form.budget_estimate}
                      onChange={(e) => set("budget_estimate", e.target.value)}
                    />
                  </div>
                  {errors.budget_estimate && <p className="text-red-400 text-xs">{errors.budget_estimate}</p>}
                  {form.budget_estimate && !isNaN(Number(form.budget_estimate)) && (
                    <p className="text-[10px] text-blue-400">= Rp {new Intl.NumberFormat("id-ID").format(Number(form.budget_estimate))}</p>
                  )}
                </InputField>
                <InputField label="Sumber Dana" required>
                  <select className={selectCls} value={form.budget_source} onChange={(e) => set("budget_source", e.target.value)}>
                    {BUDGET_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.budget_source && <p className="text-red-400 text-xs">{errors.budget_source}</p>}
                </InputField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="ID DTSEN (opsional)">
                  <input className={inputCls} placeholder="DTSEN-XXXXX" value={form.dtsen_id} onChange={(e) => set("dtsen_id", e.target.value)} />
                </InputField>
                <InputField label="Status DTSEN">
                  <select className={selectCls} value={form.dtsen_status} onChange={(e) => set("dtsen_status", e.target.value)}>
                    <option value="Unlinked">Unlinked</option>
                    <option value="Linked">Linked</option>
                  </select>
                </InputField>
              </div>

              {/* Summary Preview */}
              <div className="p-5 bg-[#0f172a] rounded-xl border border-gray-700 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ringkasan Data</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  {[
                    ["Nama", form.owner_name],
                    ["Wilayah", form.regency ? `${form.regency}, ${form.village}` : "—"],
                    ["Program", form.category],
                    ["Prioritas", form.intervention_priority],
                    ["Kelompok", [form.is_disability && "Disabilitas", form.is_oap && "OAP"].filter(Boolean).join(" + ") || "Umum"],
                    ["Sumber Dana", form.budget_source],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-500 w-24 shrink-0">{k}:</span>
                      <span className="font-medium text-white truncate">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
            {step > 1 ? (
              <button onClick={prev} className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white bg-[#0f172a] border border-gray-700 rounded-xl text-sm font-medium hover:border-gray-600 transition-all">
                <ChevronLeft size={16} /> Kembali
              </button>
            ) : (
              <a href="/penerima" className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white bg-[#0f172a] border border-gray-700 rounded-xl text-sm font-medium hover:border-gray-600 transition-all">
                <ChevronLeft size={16} /> Batal
              </a>
            )}
            {step < 4 ? (
              <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#2563eb] text-white rounded-xl text-sm font-medium transition-all">
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={mutation.isPending} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                {mutation.isPending ? "Menyimpan..." : <><CheckCircle2 size={16} /> Simpan Data</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
