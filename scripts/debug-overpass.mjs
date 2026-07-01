import https from "https";

const QUERY = `
[out:json][timeout:120];
area[name="São Paulo"]["admin_level"="8"]->.sp;
(
  relation["admin_level"="10"]["boundary"="administrative"](area.sp);
  relation["place"~"suburb|neighbourhood"](area.sp);
);
out tags;
`;

function post(url, data) {
  return new Promise((resolve, reject) => {
    const body = "data=" + encodeURIComponent(data);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname, path: urlObj.pathname,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "debug/1.0" }
    }, (res) => {
      const c = []; res.on("data", d => c.push(d)); res.on("end", () => resolve(Buffer.concat(c).toString()));
    });
    req.on("error", reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body); req.end();
  });
}

const raw = await post("https://overpass-api.de/api/interpreter", QUERY);
const data = JSON.parse(raw);
console.log(`Elementos: ${data.elements.length}`);
for (const el of data.elements) {
  console.log(`  id=${el.id} type=${el.type} name="${el.tags?.name}" admin_level=${el.tags?.admin_level} place=${el.tags?.place}`);
}
