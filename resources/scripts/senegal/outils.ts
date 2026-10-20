// Outils de la scene « Nos realisations » : formes des pays, etiquettes, checkpoints, halo.
// Sortis de scene_senegal.ts (20/10) pour alleger le fichier de la scene.
import * as THREE from 'three'

export const HORIZON = '#DCE8EE'
export const couleur = (c: string) => new THREE.Color(c)

/** Contour plat (x, z) vers une forme Three.js, extrudee ensuite vers le haut. */
export function forme(anneau: number[]) {
  const s = new THREE.Shape()
  for (let i = 0; i < anneau.length; i += 2) {
    // Repere de la forme : y = -z, pour qu apres rotation la forme tombe au bon endroit
    if (i === 0) s.moveTo(anneau[i], -anneau[i + 1])
    else s.lineTo(anneau[i], -anneau[i + 1])
  }
  return s
}

export function dalle(anneaux: number[][], epaisseur: number, dessus: string, cote: string) {
  const geo = new THREE.ExtrudeGeometry(anneaux.map(forme), { depth: epaisseur, bevelEnabled: false })
  geo.rotateX(-Math.PI / 2)
  return new THREE.Mesh(geo, [
    new THREE.MeshStandardMaterial({ color: dessus, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: cote, roughness: 0.95 }),
  ])
}

export function contour(anneau: number[], y: number, teinte: string, opacite = 1) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < anneau.length; i += 2) pts.push(new THREE.Vector3(anneau[i], y, anneau[i + 1]))
  pts.push(pts[0].clone())
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: teinte, transparent: opacite < 1, opacity: opacite })
  )
}

/** Etiquette de ville : carte blanche, nom, kilometre ; verte une fois la fibre arrivee. */
export function etiquette(nom: string, km: number | null, allumee: boolean, raccordement?: number | null) {
  const c = document.createElement('canvas')
  c.width = 520
  c.height = 190
  const ctx = c.getContext('2d')!
  ctx.shadowColor = 'rgba(0,30,15,0.3)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 5
  ctx.fillStyle = allumee ? '#417F62' : '#ffffff'
  ctx.beginPath()
  ctx.roundRect(16, 14, 488, 128, 64)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(238, 140)
  ctx.lineTo(282, 140)
  ctx.lineTo(260, 176)
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.textAlign = 'center'
  ctx.fillStyle = allumee ? '#ffffff' : '#0F1F19'
  ctx.font = '800 50px Montserrat, sans-serif'
  ctx.fillText(nom.toUpperCase(), 260, 80)
  ctx.font = '700 24px Montserrat, sans-serif'
  ctx.fillStyle = allumee ? 'rgba(255,255,255,0.85)' : '#E46B22'
  ctx.fillText(km === 0 ? 'POINT DE DÉPART' : km != null ? `KM ${km}` : `RACCORDEMENT · ${raccordement} KM`, 260, 118)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Checkpoint (20/10) : pilule verte, coche blanche dans un rond, nom et kilometre ; pointe vers la ville. */
export function checkpoint(nom: string, km: number | null, raccordement?: number | null) {
  const c = document.createElement('canvas')
  c.width = 560
  c.height = 200
  const ctx = c.getContext('2d')!
  ctx.shadowColor = 'rgba(0,30,15,0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  ctx.fillStyle = '#417F62'
  ctx.beginPath()
  ctx.roundRect(14, 14, 532, 132, 66)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(258, 144)
  ctx.lineTo(302, 144)
  ctx.lineTo(280, 182)
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // Rond blanc et coche verte : « raccorde »
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(82, 80, 44, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(62, 81)
  ctx.lineTo(77, 96)
  ctx.lineTo(104, 66)
  ctx.lineWidth = 11
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#417F62'
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 50px Montserrat, sans-serif'
  ctx.fillText(nom.toUpperCase(), 146, 80)
  ctx.font = '700 23px Montserrat, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(km === 0 ? 'POINT DE DÉPART' : km != null ? `KM ${km} · RACCORDÉE` : `RACCORDEMENT ${raccordement} KM`, 148, 116)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function halo(teinte: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.25, teinte)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}
