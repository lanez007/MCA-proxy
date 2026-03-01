const https = require("https");
const http = require("http");

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname === "/search") {
    const type     = url.searchParams.get("type") || "";
    const location = url.searchParams.get("location") || "";
    const limit    = parseInt(url.searchParams.get("limit") || "10");
    const details  = url.searchParams.get("details") !== "false";

    try {
      const geoData = await googleGet(
        `/maps/api/geocode/json?address=${enc(location)}&key=${GOOGLE_API_KEY}`
      );
      if (!geoData.results?.[0]) {
        respond(res, 404, { error: "Location not found" }); return;
      }
      const { lat, lng } = geoData.results[0].geometry.location;

      const placesData = await googleGet(
        `/maps/api/place/textsearch/json?query=${enc(type)}&location=${lat},${lng}&radius=30000&key=${GOOGLE_API_KEY}`
      );
      const places = (placesData.results || []).slice(0, limit);

      let detailed;
      if (details) {
        detailed = await Promise.all(places.map(async (p) => {
          try {
            const d = await googleGet(
              `/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number,website,formatted_address&key=${GOOGLE_API_KEY}`
            );
            return {
              businessName: p.name,
              address: d.result?.formatted_address || p.formatted_address || "",
              phone: d.result?.formatted_phone_number || null,
              website: d.result?.website || null,
              placeId: p.place_id,
              rating: p.rating || null,
            };
          } catch(_) {
            return {
              businessName: p.name,
              address: p.formatted_address || "",
              phone: null, website: null,
              placeId: p.place_id, rating: p.rating || null,
            };
          }
        }));
      } else {
        detailed = places.map(p => ({
          businessName: p.name,
          address: p.formatted_address || "",
          phone: null,
          website: null,
          placeId: p.place_id,
          rating: p.rating || null,
        }));
      }

      respond(res, 200, { results: detailed });
    } catch(err) {
      respond(res, 500, { error: err.message });
    }
    return;
  }

  res.writeHead(404); res.end();
});

function googleGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://maps.googleapis.com${path}`, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

function respond(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function enc(s) { return encodeURIComponent(s); }

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
