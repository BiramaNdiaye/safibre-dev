// Donnees de la scene 3D « Nos realisations » : le Senegal et ses voisins, et le
// trace de la fibre Dakar -> Diourbel -> Kaolack -> Tambacounda le long des routes.
//
// Sources (a citer sur la page) :
//  - contours des pays : OpenStreetMap via Nominatim (simplifies a ~1 km), licence ODbL ;
//  - trace routier : OSRM (moteur libre sur les donnees OpenStreetMap).
// Usage : node outils/donnees-senegal.mjs   (une requete par seconde, comme le demande Nominatim)

import { mkdirSync, writeFileSync } from 'node:fs'

const AGENT = 'safibre-site-build/1.0 (contact@safibre.sn)'
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))
// Les services publics (OSRM, Overpass, OpenTopoData) saturent parfois (502, 429) : on reessaie
const fetchBrut = globalThis.fetch
globalThis.fetch = async (...args) => {
  for (let essai = 0; essai < 6; essai++) {
    const r = await fetchBrut(...args)
    if (r.ok) return r
    console.log(`  reessai (${r.status})...`)
    await attendre(5000 * (essai + 1))
  }
  return fetchBrut(...args)
}

// Origine au centre du trace ; kilometres, x vers l est, z vers le sud (repere Three.js)
const LAT0 = 14.2
const LON0 = -15.4
const MX = 111.32 * Math.cos((LAT0 * Math.PI) / 180)
const MZ = 110.54
const proj = ([lon, lat]) => [Math.round((lon - LON0) * MX * 100) / 100, Math.round(-(lat - LAT0) * MZ * 100) / 100]

const VILLES = [
  { nom: 'Dakar', lon: -17.4467, lat: 14.6928 },
  { nom: 'Diourbel', lon: -16.2316, lat: 14.655 },
  { nom: 'Kaolack', lon: -16.0726, lat: 14.1652 },
  { nom: 'Tambacounda', lon: -13.6673, lat: 13.7707 },
]

const PAYS = [
  { nom: 'Sénégal', requete: 'senegal', principal: true },
  { nom: 'Gambie', requete: 'gambia' },
  { nom: 'Mauritanie', requete: 'mauritania' },
  { nom: 'Mali', requete: 'mali' },
  { nom: 'Guinée', requete: 'guinea' },
  { nom: 'Guinée-Bissau', requete: 'guinea-bissau' },
]

const aire = (anneau) => {
  let a = 0
  for (let i = 0; i < anneau.length; i++) {
    const [x1, y1] = anneau[i]
    const [x2, y2] = anneau[(i + 1) % anneau.length]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2
}

const pays = []
for (const p of PAYS) {
  const url = `https://nominatim.openstreetmap.org/search?country=${p.requete}&polygon_geojson=1&polygon_threshold=0.01&format=json&limit=1`
  const [resultat] = await (await fetch(url, { headers: { 'User-Agent': AGENT } })).json()
  const g = resultat.geojson
  const polygones = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  // Contours exterieurs seulement, sans les ilots minuscules
  const anneaux = polygones
    .map((poly) => poly[0].map(proj))
    .filter((anneau) => aire(anneau) > 20)
    .map((anneau) => anneau.flat())
  pays.push({ nom: p.nom, principal: !!p.principal, anneaux })
  console.log(`${p.nom} : ${anneaux.length} contour(s), ${anneaux.reduce((n, a) => n + a.length / 2, 0)} points`)
  await attendre(1100)
}

// Ancienne version (20/10) : un seul trace Dakar -> Diourbel -> Kaolack -> Tambacounda.
// Le proprietaire veut un axe direct Dakar -> Tambacounda et des raccordements vers Diourbel et Kaolack.
// // Trace routier entre les villes, dans l ordre du deploiement
// const etapes = VILLES.map((v) => `${v.lon},${v.lat}`).join(';')
// const route = await (
//   await fetch(`https://router.project-osrm.org/route/v1/driving/${etapes}?overview=full&geometries=geojson`, {
//     headers: { 'User-Agent': AGENT },
//   })
// ).json()
// const brut = route.routes[0].geometry.coordinates.map(proj)
// // Un point tous les 1,5 km environ : assez fin pour suivre la route, leger a charger
// const trace = [brut[0]]
// for (const pt of brut) {
//   const [x, z] = trace.at(-1)
//   if (Math.hypot(pt[0] - x, pt[1] - z) >= 1.5) trace.push(pt)
// }
// if (trace.at(-1) !== brut.at(-1)) trace.push(brut.at(-1))

// // Kilometre de chaque ville le long du trace (distances routieres d OSRM, cumulees)
// let cumul = 0
// const villes = VILLES.map((v, i) => {
//   if (i > 0) cumul += route.routes[0].legs[i - 1].distance / 1000
//   const [x, z] = proj([v.lon, v.lat])
//   return { nom: v.nom, x, z, km: Math.round(cumul) }
// })


const osrm = async (de, a) => {
  const r = await (await fetch(`https://router.project-osrm.org/route/v1/driving/${de[0]},${de[1]};${a[0]},${a[1]}?overview=full&geometries=geojson`, { headers: { 'User-Agent': AGENT } })).json()
  await attendre(1100)
  return { coords: r.routes[0].geometry.coordinates, km: r.routes[0].distance / 1000 }
}
// Un point tous les 1,5 km environ : assez fin pour suivre la route, leger a charger
const alleger = (coords) => {
  const pts = coords.map(proj)
  const sortie = [pts[0]]
  for (const pt of pts) if (Math.hypot(pt[0] - sortie.at(-1)[0], pt[1] - sortie.at(-1)[1]) >= 1.5) sortie.push(pt)
  sortie.push(pts.at(-1))
  return sortie
}
const [DAKAR, DIOURBEL, KAOLACK, TAMBA] = VILLES
const axe = await osrm([DAKAR.lon, DAKAR.lat], [TAMBA.lon, TAMBA.lat])
const trace = alleger(axe.coords)
// Longueur cumulee de l axe, pour situer chaque piquage
const cumuls = [0]
for (let i = 1; i < axe.coords.length; i++) {
  const [x1, z1] = proj(axe.coords[i - 1]), [x2, z2] = proj(axe.coords[i])
  cumuls.push(cumuls[i - 1] + Math.hypot(x2 - x1, z2 - z1))
}
const longueurAxe = cumuls.at(-1)
// Raccordement : depuis le point de l axe le plus proche de la ville, par la route
const branches = []
for (const v of [DIOURBEL, KAOLACK]) {
  const [vx, vz] = proj([v.lon, v.lat])
  let i0 = 0, d0 = Infinity
  axe.coords.forEach((c, i) => { const [x, z] = proj(c); const d = Math.hypot(x - vx, z - vz); if (d < d0) { d0 = d; i0 = i } })
  const b = d0 < 2 ? { coords: [axe.coords[i0], [v.lon, v.lat]], km: d0 } : await osrm(axe.coords[i0], [v.lon, v.lat])
  branches.push({ ville: v.nom, u: Math.round((cumuls[i0] / longueurAxe) * 1000) / 1000, km: Math.round(b.km), points: alleger(b.coords).flat() })
}
const villes = VILLES.map((v) => {
  const [x, z] = proj([v.lon, v.lat])
  const br = branches.find((b) => b.ville === v.nom)
  return { nom: v.nom, x, z, km: v === TAMBA ? Math.round(axe.km) : v === DAKAR ? 0 : null, raccordement: br ? br.km : null }
})

// Routes principales (trunk / primary) du Senegal, OpenStreetMap via Overpass
const requete = '[out:json][timeout:90];area["ISO3166-1"="SN"][admin_level=2]->.sn;way[highway~"^(trunk|primary)$"](area.sn);out geom;'
const osm = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(requete), headers: { 'User-Agent': AGENT } })).json()
const routes = osm.elements.filter((e) => e.geometry).map((e) => alleger(e.geometry.map((g) => [g.lon, g.lat])).flat()).filter((r) => r.length >= 4)
console.log(`Routes : ${routes.length} troncons`)

// Fleuves Senegal et Gambie (reperes geographiques), OpenStreetMap via Overpass
await attendre(2000)
const reqFleuves = '[out:json][timeout:90];way[waterway=river][name~"Sénégal|Senegal|Gambie|Gambia"](12.0,-17.6,17.2,-11.3);out geom;'
const osmF = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(reqFleuves), headers: { 'User-Agent': AGENT } })).json()
// Fleuve Gambie retire le 20/10 (demande du proprietaire) : on ne garde que le fleuve Senegal
const fleuves = osmF.elements.filter((e) => e.geometry && !/Gambi/i.test(e.tags?.name ?? '')).map((e) => alleger(e.geometry.map((g) => [g.lon, g.lat])).flat()).filter((r) => r.length >= 4)
console.log(`Fleuves : ${fleuves.length} troncons`)

// Relief : grille d altitudes (SRTM via Open-Elevation), environ un point tous les 10 km
const RELIEF = { lon0: -17.7, lon1: -11.2, lat0: 12.1, lat1: 16.9, pas: 0.09 }
const nLon = Math.round((RELIEF.lon1 - RELIEF.lon0) / RELIEF.pas) + 1
const nLat = Math.round((RELIEF.lat1 - RELIEF.lat0) / RELIEF.pas) + 1
const lieux = []
for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) lieux.push({ latitude: RELIEF.lat1 - j * RELIEF.pas, longitude: RELIEF.lon0 + i * RELIEF.pas })
const altitudes = []
// Open-Elevation refusait les lots de 1 000 points : OpenTopoData (SRTM 90 m), 100 points par requete, une par seconde
for (let k = 0; k < lieux.length; k += 100) {
  const lot = lieux.slice(k, k + 100).map((l) => l.latitude.toFixed(3) + ',' + l.longitude.toFixed(3)).join('|')
  const r = await (await fetch('https://api.opentopodata.org/v1/srtm90m?locations=' + lot, { headers: { 'User-Agent': AGENT } })).json()
  altitudes.push(...r.results.map((x) => Math.max(0, Math.round(x.elevation ?? 0))))
  await attendre(1100)
}
const [rx0, rz0] = proj([RELIEF.lon0, RELIEF.lat1])
const [rx1, rz1] = proj([RELIEF.lon1, RELIEF.lat0])
const relief = { nx: nLon, nz: nLat, x0: rx0, z0: rz0, x1: rx1, z1: rz1, altitudes }
console.log(`Relief : ${nLon} x ${nLat} points, max ${Math.max(...altitudes)} m`)

// Forets (landuse=forest, natural=wood) : leurs emprises, pour y semer des arbres
await attendre(2000)
const reqForets = '[out:json][timeout:120];area["ISO3166-1"="SN"][admin_level=2]->.sn;(way[landuse=forest](area.sn);relation[landuse=forest](area.sn);way[natural=wood](area.sn);relation[natural=wood](area.sn););out bb;'
const osmForets = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(reqForets), headers: { 'User-Agent': AGENT } })).json()
const forets = osmForets.elements
  .filter((e) => e.bounds)
  .map((e) => [...proj([e.bounds.minlon, e.bounds.maxlat]), ...proj([e.bounds.maxlon, e.bounds.minlat])])
  .filter(([x0, z0, x1, z1]) => (x1 - x0) * (z1 - z0) > 1.5)
console.log(`Forets : ${forets.length} zones`)

// Lieux habites : villes, bourgs et villages, pour y poser des batiments
await attendre(2000)
const reqLieux = '[out:json][timeout:120];area["ISO3166-1"="SN"][admin_level=2]->.sn;node[place~"^(city|town|village)$"](area.sn);out;'
const osmLieux = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(reqLieux), headers: { 'User-Agent': AGENT } })).json()
const TAILLE = { city: 3, town: 2, village: 1 }
const habitat = osmLieux.elements.map((e) => [...proj([e.lon, e.lat]), TAILLE[e.tags.place]])
console.log(`Lieux habites : ${habitat.length}`)

mkdirSync('public/donnees', { recursive: true })
writeFileSync('public/donnees/senegal-3d.json', JSON.stringify({ origine: [LAT0, LON0], pays, trace: trace.flat(), branches, routes, fleuves, relief, forets, habitat, villes }))
console.log(`Axe : ${trace.length} points, ${Math.round(axe.km)} km ; raccordements :`, branches.map((b) => `${b.ville} ${b.km} km (u ${b.u})`).join(", "))
