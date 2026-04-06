import sql from "@/app/api/utils/sql";

// Mock data for development (when DATABASE_URL is not set)
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("group_by") || "summary";

    let records = MOCK_RECORDS;

    // Try real DB first
    try {
      const dbRecords = await sql("SELECT * FROM infrastructure_records", []);
      if (dbRecords && dbRecords.length > 0) records = dbRecords;
    } catch (_) {
      // Fall back to mock
    }

    const totalDisability = records.filter((r) => r.is_disability).length;
    const totalOap = records.filter((r) => r.is_oap).length;
    const totalOapDisability = records.filter((r) => r.is_oap && r.is_disability).length;
    const totalGeneral = records.filter((r) => !r.is_oap && !r.is_disability).length;

    const budgetDisability = records
      .filter((r) => r.is_disability)
      .reduce((s, r) => s + Number(r.budget_estimate), 0);
    const budgetOap = records
      .filter((r) => r.is_oap)
      .reduce((s, r) => s + Number(r.budget_estimate), 0);
    const totalBudget = records.reduce((s, r) => s + Number(r.budget_estimate), 0);

    // By disability type
    const byDisabilityType = records
      .filter((r) => r.is_disability && r.disability_type)
      .reduce((acc, r) => {
        acc[r.disability_type] = (acc[r.disability_type] || 0) + 1;
        return acc;
      }, {});

    // By budget source
    const byBudgetSource = records.reduce((acc, r) => {
      const src = r.budget_source || "Lainnya";
      if (!acc[src]) acc[src] = { count: 0, budget: 0 };
      acc[src].count++;
      acc[src].budget += Number(r.budget_estimate);
      return acc;
    }, {});

    // By regency
    const byRegency = records.reduce((acc, r) => {
      if (!acc[r.regency]) acc[r.regency] = { disability: 0, oap: 0, general: 0, budget: 0 };
      if (r.is_disability) acc[r.regency].disability++;
      if (r.is_oap) acc[r.regency].oap++;
      if (!r.is_oap && !r.is_disability) acc[r.regency].general++;
      acc[r.regency].budget += Number(r.budget_estimate);
      return acc;
    }, {});

    return Response.json({
      summary: { totalDisability, totalOap, totalOapDisability, totalGeneral, budgetDisability, budgetOap, totalBudget, totalRecords: records.length },
      byDisabilityType: Object.entries(byDisabilityType).map(([name, value]) => ({ name, value })),
      byBudgetSource: Object.entries(byBudgetSource).map(([name, d]) => ({ name, count: d.count, budget: d.budget })),
      byRegency: Object.entries(byRegency).map(([name, d]) => ({ name, ...d })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch beneficiary data" }, { status: 500 });
  }
}
