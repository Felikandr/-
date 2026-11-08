const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase environment variables are missing" });
  }

  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    const url = SUPABASE_URL.replace(/\/$/, "");
    const endpoint = `${url}/rest/v1/sklad_state?id=eq.1&select=rev,state`;

    if (req.method === "GET") {
      const response = await fetch(endpoint, { headers });
      const rows = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: rows.message || "Supabase read error" });
      }

      if (!rows.length) {
        return res.status(404).json({ error: "Warehouse state not found" });
      }

      return res.status(200).json(rows[0]);
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.state !== "object" || body.state === null) {
      return res.status(400).json({ error: "Expected { rev, state }" });
    }

    const currentResponse = await fetch(endpoint, { headers });
    const currentRows = await currentResponse.json();

    if (!currentResponse.ok || !currentRows.length) {
      return res.status(500).json({ error: "Could not read current warehouse state" });
    }

    const current = currentRows[0];

    const expectedRev = body.baseRev ?? body.rev;

if (expectedRev !== undefined && Number(expectedRev) !== Number(current.rev)) {
      return res.status(409).json({ error: "Revision conflict", rev: current.rev, state: current.state });
    }

    const updateResponse = await fetch(
      `${url}/rest/v1/sklad_state?id=eq.1&rev=eq.${current.rev}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          rev: Number(current.rev) + 1,
          state: body.state
        })
      }
    );

    const updatedRows = await updateResponse.json();

    if (!updateResponse.ok) {
      return res.status(updateResponse.status).json({ error: "Supabase update error" });
    }

    if (!updatedRows.length) {
      return res.status(409).json({ error: "Revision conflict" });
    }

    return res.status(200).json(updatedRows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
