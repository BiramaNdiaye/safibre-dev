// Convertit un extrait OpenStreetMap du quartier Amitie / Point E / Fann (Dakar)
// en un fichier compact pour la scene 3D du site.
//
// Extrait brut (Overpass, bbox 14.686,-17.482,14.712,-17.452) :
//   way["building"], way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|unclassified|..."],
//   way["natural"="coastline"] (bbox elargie), parcs, terrains, plages ; sortie « out geom tags ».
// Usage : node outils/donnees-dakar.mjs <extrait.json>
// Donnees © contributeurs OpenStreetMap, licence ODbL : le credit est affiche dans la scene.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const source = process.argv[2]
if (!source) {
  console.error('Usage : node outils/donnees-dakar.mjs <extrait-overpass.json>')
  process.exit(1)
}
const osm = JSON.parse(readFileSync(source, 'utf8'))

// Origine au centre du quartier ; metres, x vers l est, z vers le sud (repere Three.js)
const LAT0 = 14.699
const LON0 = -17.467
const MX = 111320 * Math.cos((LAT0 * Math.PI) / 180)
const MZ = 110540
const proj = (p) => [Math.round((p.lon - LON0) * MX), Math.round(-(p.lat - LAT0) * MZ)]

// Les bureaux SAFIBRE, avenue Habib Bourguiba (Amitie) : arrivee de la fibre
const BUREAUX = proj({ lat: 14.7012, lon: -17.4602 })
// Depart cote Corniche Ouest (Fann)
const DEPART = proj({ lat: 14.6905, lon: -17.4745 })

// Pseudo-hasard stable : la ville est la meme a chaque generation
const hasard = (n) => {
  let x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const aire = (pts) => {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i]
    const [x2, z2] = pts[(i + 1) % pts.length]
    a += x1 * z2 - x2 * z1
  }
  return Math.abs(a) / 2
}

// ---- Batiments : empreinte + hauteur (niveaux OSM si connus, sinon vraisemblable) ----
const batiments = []
for (const e of osm.elements) {
  if (!e.tags?.building || !e.geometry) continue
  let pts = e.geometry.map(proj)
  if (pts.length > 2 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts = pts.slice(0, -1)
  if (pts.length < 3) continue
  const surface = aire(pts)
  if (surface < 20) continue
  const niveaux = Number(e.tags['building:levels'])
  const r = hasard(e.id)
  // Dakar : surtout des maisons de 1 a 3 niveaux, quelques immeubles plus hauts quand l emprise est grande
  let etages = Number.isFinite(niveaux) && niveaux > 0
    ? niveaux
    : surface > 900 ? 3 + Math.floor(r * 6) : surface > 250 ? 2 + Math.floor(r * 3) : 1 + Math.floor(r * 2)
  etages = Math.min(etages, 20)
  batiments.push([Math.round(etages * 3.1), Math.floor(hasard(e.id + 7) * 1000), ...pts.flat()])
}

// ---- Rues : polylignes et categorie (largeur) ----
const CATEGORIES = { motorway: 0, trunk: 0, motorway_link: 1, trunk_link: 1, primary: 1, primary_link: 1, secondary: 2, tertiary: 3, unclassified: 4, residential: 4 }
const rues = []
for (const e of osm.elements) {
  const cat = CATEGORIES[e.tags?.highway]
  if (cat === undefined || !e.geometry) continue
  rues.push([cat, ...e.geometry.map(proj).flat()])
}

// ---- Trace de la fibre : plus court chemin sur le reseau de rues, en preferant les grands axes ----
const graphe = new Map()
const cle = (p) => `${p[0]},${p[1]}`
const relier = (a, b, poids) => {
  if (!graphe.has(a)) graphe.set(a, [])
  graphe.get(a).push([b, poids])
}
for (const e of osm.elements) {
  const cat = CATEGORIES[e.tags?.highway]
  if (cat === undefined || !e.geometry) continue
  const facteur = [1, 1, 1.1, 1.3, 1.8][cat]
  const pts = e.geometry.map(proj)
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) * facteur
    relier(cle(pts[i]), cle(pts[i + 1]), d)
    relier(cle(pts[i + 1]), cle(pts[i]), d)
  }
}
const plusProche = (cible) => {
  let meilleur = null
  let dmin = Infinity
  for (const k of graphe.keys()) {
    const [x, z] = k.split(',').map(Number)
    const d = Math.hypot(x - cible[0], z - cible[1])
    if (d < dmin) {
      dmin = d
      meilleur = k
    }
  }
  return meilleur
}
// Plus court chemin (Dijkstra) entre deux noeuds du reseau de rues
const chemin = (depart, arrivee) => {
  const dist = new Map([[depart, 0]])
  const precedent = new Map()
  const aTraiter = new Set([depart])
  while (aTraiter.size) {
    let courant = null
    let dmin = Infinity
    for (const k of aTraiter) {
      if (dist.get(k) < dmin) {
        dmin = dist.get(k)
        courant = k
      }
    }
    aTraiter.delete(courant)
    if (courant === arrivee) break
    for (const [voisin, poids] of graphe.get(courant) ?? []) {
      const nd = dmin + poids
      if (nd < (dist.get(voisin) ?? Infinity)) {
        dist.set(voisin, nd)
        precedent.set(voisin, courant)
        aTraiter.add(voisin)
      }
    }
  }
  const pts = []
  for (let k = arrivee; k; k = precedent.get(k)) pts.unshift(k.split(',').map(Number))
  return pts[0] && cle(pts[0]) === depart ? pts : []
}

const fibre = chemin(plusProche(DEPART), plusProche(BUREAUX))
if (fibre.length < 2) throw new Error('Pas de chemin entre la Corniche et les bureaux')

// ---- Deploiement : des branches partent du trace principal vers d autres rues du quartier ----
const longueurs = [0]
for (let i = 1; i < fibre.length; i++) longueurs.push(longueurs[i - 1] + Math.hypot(fibre[i][0] - fibre[i - 1][0], fibre[i][1] - fibre[i - 1][1]))
const total = longueurs.at(-1)
const noeuds = [...graphe.keys()].map((k) => k.split(',').map(Number))
const branches = []
;[0.18, 0.34, 0.5, 0.66, 0.8].forEach((u, n) => {
  const i = longueurs.findIndex((l) => l >= u * total)
  const origine = fibre[i]
  // Une cible entre 350 et 750 m, d un cote puis de l autre du trace
  const candidats = noeuds.filter(([x, z]) => {
    const d = Math.hypot(x - origine[0], z - origine[1])
    return d > 350 && d < 750
  })
  if (!candidats.length) return
  const cible = candidats[Math.floor(hasard(n * 31 + 5) * candidats.length)]
  const pts = chemin(cle(origine), cle(cible))
  if (pts.length > 2) branches.push({ u: Math.round(u * 1000) / 1000, points: pts.flat() })
})

// ---- Cote : la terre est a gauche du sens de la ligne (convention OSM), on la ferme par l est ----
const morceaux = osm.elements.filter((e) => e.tags?.natural === 'coastline').map((e) => e.geometry)
let cote = morceaux.shift()
while (morceaux.length) {
  const fin = cote.at(-1)
  const i = morceaux.findIndex((m) => Math.abs(m[0].lat - fin.lat) < 1e-6 && Math.abs(m[0].lon - fin.lon) < 1e-6)
  if (i < 0) break
  cote = cote.concat(morceaux.splice(i, 1)[0].slice(1))
}
const terre = [
  ...cote.map(proj),
  proj({ lat: cote.at(-1).lat, lon: -17.43 }),
  proj({ lat: 14.73, lon: -17.43 }),
  proj({ lat: 14.73, lon: cote[0].lon }),
]

// ---- Espaces verts, terrains et plages ----
const surfaces = []
for (const e of osm.elements) {
  const t = e.tags ?? {}
  // La ligne de cote sert a la terre ; remplie comme une surface, elle peignait la mer en vert
  if (t.natural === 'coastline') continue
  const genre = t.natural === 'beach' || t.natural === 'sand' ? 2 : t.leisure === 'pitch' ? 1 : t.leisure || t.landuse || t.natural ? 0 : -1
  if (genre < 0 || !e.geometry) continue
  surfaces.push([genre, ...e.geometry.map(proj).flat()])
}

mkdirSync('public/donnees', { recursive: true })
const sortie = { origine: [LAT0, LON0], bureaux: BUREAUX, batiments, rues, fibre, branches, terre: terre.flat(), surfaces }
writeFileSync('public/donnees/dakar-3d.json', JSON.stringify(sortie))
console.log(
  `${batiments.length} batiments, ${rues.length} rues, fibre de ${fibre.length} points, ${branches.length} branches, ${surfaces.length} surfaces`
)
