import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { dtsen_data } = await request.json();

    // Simulate processing DTSEN data
    // Usually this would involve matching DTSEN IDs and updating records
    // For this prototype, we'll just insert/update based on the simulated input

    const results = [];

    for (const item of dtsen_data) {
      const {
        dtsen_id,
        category,
        regency,
        district,
        village,
        owner_name,
        condition_status,
      } = item;

      // Determine priority and budget estimate based on condition
      let intervention_priority = "Rendah";
      let budget_estimate = 0;

      if (condition_status === "Rusak Berat") {
        intervention_priority = "Tinggi";
        budget_estimate =
          category === "RTLH"
            ? 25000000
            : category === "Sanitasi"
              ? 10000000
              : 15000000;
      } else if (condition_status === "Rusak Ringan") {
        intervention_priority = "Sedang";
        budget_estimate =
          category === "RTLH"
            ? 10000000
            : category === "Sanitasi"
              ? 5000000
              : 7000000;
      }

      const upserted = await sql`
        INSERT INTO infrastructure_records 
        (category, regency, district, village, owner_name, condition_status, intervention_priority, budget_estimate, dtsen_id, dtsen_status)
        VALUES 
        (${category}, ${regency}, ${district}, ${village}, ${owner_name}, ${condition_status}, ${intervention_priority}, ${budget_estimate}, ${dtsen_id}, 'Linked')
        ON CONFLICT (dtsen_id) 
        DO UPDATE SET 
          condition_status = EXCLUDED.condition_status,
          intervention_priority = EXCLUDED.intervention_priority,
          budget_estimate = EXCLUDED.budget_estimate,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      results.push(upserted[0]);
    }

    return Response.json({
      message: "Sync successful",
      synced_count: results.length,
      records: results,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to sync with DTSEN" },
      { status: 500 },
    );
  }
}
