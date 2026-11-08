const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase settings missing" });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/sklad_state?id=eq.1&select=rev`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const rows = await response.json();

    if (!response.ok || !rows.length) {
      return res.status(500).json({ error: "Supabase read error" });
    }

    return res.status(200).json({ rev: rows[0].rev });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
