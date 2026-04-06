import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const regency = searchParams.get("regency");
    const isDisability = searchParams.get("is_disability");
    const isOap = searchParams.get("is_oap");
    const budgetSource = searchParams.get("budget_source");
    const disabilityType = searchParams.get("disability_type");
    const disabilitySeverity = searchParams.get("disability_severity");

    let query = "SELECT * FROM infrastructure_records WHERE 1=1";
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (regency) {
      params.push(regency);
      query += ` AND regency = $${params.length}`;
    }
    if (isDisability === "true") {
      query += ` AND is_disability = TRUE`;
    }
    if (isOap === "true") {
      query += ` AND is_oap = TRUE`;
    }
    if (budgetSource) {
      params.push(budgetSource);
      query += ` AND budget_source = $${params.length}`;
    }
    if (disabilityType) {
      params.push(disabilityType);
      query += ` AND disability_type = $${params.length}`;
    }
    if (disabilitySeverity) {
      params.push(disabilitySeverity);
      query += ` AND disability_severity = $${params.length}`;
    }

    query += " ORDER BY created_at DESC";

    const records = await sql(query, params);
    return Response.json(records);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      category,
      regency,
      district,
      village,
      owner_name,
      condition_status,
      intervention_priority,
      budget_estimate,
      dtsen_id,
      dtsen_status,
      is_disability = false,
      is_oap = false,
      disability_type,
      disability_severity,
      budget_source,
      nik,
      phone,
      notes,
    } = body;

    const result = await sql`
      INSERT INTO infrastructure_records 
      (category, regency, district, village, owner_name, condition_status, intervention_priority, budget_estimate, dtsen_id, dtsen_status, is_disability, is_oap, disability_type, disability_severity, budget_source, nik, phone, notes)
      VALUES 
      (${category}, ${regency}, ${district}, ${village}, ${owner_name}, ${condition_status}, ${intervention_priority}, ${budget_estimate}, ${dtsen_id}, ${dtsen_status || "Unlinked"}, ${is_disability}, ${is_oap}, ${disability_type || null}, ${disability_severity || null}, ${budget_source || "APBN"}, ${nik || null}, ${phone || null}, ${notes || null})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create record" }, { status: 500 });
  }
}
