
const SOURCE_URL = "https://jecfutsal.com.br/competicoes/";

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8211;|&ndash;/gi, "-")
    .replace(/&#8212;|&mdash;/gi, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return value.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase())
    .replace(/\bJec\/Krona\b/i, "JEC/Krona")
    .replace(/\bLnf\b/g, "LNF");
}

function parseGames(html) {
  const text = stripHtml(html);
  const start = text.toUpperCase().indexOf("PRÓXIMOS JOGOS");
  if (start < 0) return [];
  const section = text.slice(start + "PRÓXIMOS JOGOS".length, start + 2500);

  // Ex.: 25/07 - 19H30 - JEC/KRONA X UMUARAMA - LNF
  const regex = /(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\s*[Hh:]\s*(\d{0,2})\s*-\s*([^–—-]+?)\s+[Xx]\s+([^–—-]+?)\s*-\s*([A-ZÀ-Ú0-9\/ ]+?)(?=\s+\d{1,2}\/\d{1,2}\s*-|$)/g;
  const currentYear = new Date().getFullYear();
  const games = [];
  let match;

  while ((match = regex.exec(section)) !== null) {
    const [, day, month, hour, minuteRaw, homeRaw, awayRaw, competitionRaw] = match;
    const minute = (minuteRaw || "00").padStart(2, "0");
    const homeTeam = titleCase(homeRaw.trim());
    const awayTeam = titleCase(awayRaw.trim());
    const competition = titleCase(competitionRaw.trim());
    const jecHome = /JEC\/KRONA/i.test(homeTeam);
    const opponent = jecHome ? awayTeam : homeTeam;
    const date = `${currentYear}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
    const slug = opponent.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_");

    games.push({
      id: `official_${date}_${slug}`,
      date,
      time: `${hour.padStart(2,"0")}:${minute}`,
      opponent,
      competition,
      venue: jecHome ? "Casa" : "Fora",
      homeTeam,
      awayTeam,
      location: jecHome ? "Centreventos Cau Hansen" : "Local a confirmar"
    });
  }
  return games;
}

export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "GET") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers });

    try {
      const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "JEC-Krona-Calendar-Monitor/1.0" } });
      if (!response.ok) throw new Error(`Fonte respondeu ${response.status}`);
      const html = await response.text();
      const games = parseGames(html);
      if (!games.length) throw new Error("Nenhum jogo encontrado na página oficial.");
      return new Response(JSON.stringify({
        source: SOURCE_URL,
        updatedAt: new Date().toISOString(),
        games
      }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 502, headers });
    }
  }
};
