import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const records =
      await sql`SELECT * FROM infrastructure_records WHERE id = ${id}`;
    if (records.length === 0) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }
    return Response.json(records[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Build update query dynamically
    const updates = [];
    const values = [];
    let counter = 1;

    for (const [key, value] of Object.entries(body)) {
      if (
        [
          "category",
          "regency",
          "district",
          "village",
          "owner_name",
          "condition_status",
          "intervention_priority",
          "budget_estimate",
          "dtsen_id",
          "dtsen_status",
        ].includes(key)
      ) {
        updates.push(`${key} = $${counter}`);
        values.push(value);
        counter++;
      }
    }

    if (updates.length === 0) {
      return Response.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `UPDATE infrastructure_records SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${counter} RETURNING *`;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const result =
      await sql`DELETE FROM infrastructure_records WHERE id = ${id} RETURNING *`;
    if (result.length === 0) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }
    return Response.json({ message: "Record deleted" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
