import * as THREE from 'three'
import { gsap } from 'gsap'
import { HORIZON, couleur, forme, dalle, contour, etiquette, checkpoint, halo } from '~/scripts/senegal/outils'

// Scene 3D « Nos realisations » : le Senegal en maquette (meme ambiance que le film
// de l accueil : terre claire, mer bleue, fibre orange) et le deploiement de la fibre
// de Dakar a Tambacounda, par Diourbel et Kaolack. Donnees : outils/donnees-senegal.mjs.
// Unites : kilometres ; x vers l est, z vers le sud.

export type DonneesSenegal = {
  origine: [number, number]
  pays: { nom: string; principal: boolean; anneaux: number[][] }[]
  /** Axe principal Dakar -> Tambacounda */
  trace: number[]
  /** Raccordements depuis l axe : u = position du piquage sur l axe (0..1) */
  branches?: { ville: string; u: number; km: number; points: number[] }[]
  /** Routes principales (OSM trunk / primary) */
  routes?: number[][]
  /** Fleuves Senegal et Gambie */
  fleuves?: number[][]
  /** Grille d altitudes (m), de x0,z0 (nord-ouest) a x1,z1 (sud-est) */
  relief?: { nx: number; nz: number; x0: number; z0: number; x1: number; z1: number; altitudes: number[] }
  /** Emprises des forets : [x0, z0, x1, z1] */
  forets?: number[][]
  /** Lieux habites : [x, z, taille 1 village / 2 bourg / 3 ville] */
  habitat?: number[][]
  villes: { nom: string; x: number; z: number; km: number | null; raccordement?: number | null }[]
}

export type SceneSenegal = {
  definirProgression: (p: number) => void
  /** Image fixe a la progression p (mouvements reduits, tests) */
  figer: (p: number) => void
  redimensionner: () => void
  demarrer: () => void
  arreter: () => void
  detruire: () => void
  /** Resolue quand les shaders sont compiles et la premiere image dessinee */
  pret: Promise<void>
}

export function creerSceneSenegal(canvas: HTMLCanvasElement, donnees: DonneesSenegal, options: { leger?: boolean } = {}): SceneSenegal {
  const leger = options.leger ?? false
  const rendu = new THREE.WebGLRenderer({ canvas, antialias: !leger, powerPreference: 'high-performance' })
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, leger ? 1.25 : 1.75))
  rendu.toneMapping = THREE.ACESFilmicToneMapping
  rendu.toneMappingExposure = 1
  rendu.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.background = couleur(HORIZON)
  // Brume lointaine : les bords des pays voisins se fondent dans l horizon
  // Brume repoussee (avant : 700 a 1600) pour que les voisins restent nets dans la vue d ensemble
  scene.fog = new THREE.Fog(HORIZON, 1000, 2200)
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 4000)

  scene.add(new THREE.HemisphereLight('#EEF5FF', '#B8A78C', 1.3))
  const soleil = new THREE.DirectionalLight('#FFF3E2', 2.4)
  soleil.position.set(-300, 500, 200)
  scene.add(soleil)

  // Ocean, pays voisins en relief tres bas, Senegal un peu plus haut et plus clair
  // Avant : mer unie
  // const ocean = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#2C79AA', roughness: 0.25, metalness: 0.15 }))
  const houle = (() => {
    const n = 128
    const c = document.createElement('canvas')
    c.width = c.height = n
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(n, n)
    const ondes = [[3, 1, 0, 1], [-2, 4, 1.7, 0.8], [5, -3, 2.9, 0.55], [-7, -2, 0.6, 0.4], [9, 6, 4.1, 0.3]]
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let dx = 0
        let dy = 0
        for (const [fx, fy, ph, amp] of ondes) {
          const a = ((fx * x + fy * y) / n) * Math.PI * 2 + ph
          dx += Math.cos(a) * fx * amp
          dy += Math.cos(a) * fy * amp
        }
        const nx = -dx * 0.06
        const ny = -dy * 0.06
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1)
        const k = (y * n + x) * 4
        img.data[k] = (nx * inv * 0.5 + 0.5) * 255
        img.data[k + 1] = (ny * inv * 0.5 + 0.5) * 255
        img.data[k + 2] = (inv * 0.5 + 0.5) * 255
        img.data[k + 3] = 255
      }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(220, 220)
    return t
  })()
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({ color: '#2A78AE', roughness: 0.12, metalness: 0.2, normalMap: houle, normalScale: new THREE.Vector2(0.6, 0.6) })
  )
  ocean.rotation.x = -Math.PI / 2
  ocean.position.y = -0.5
  scene.add(ocean)
  // Rivage : eau claire sur les hauts-fonds et liseré d ecume, peints autour de chaque pays
  {
    const L = 1600
    const c = document.createElement('canvas')
    c.width = c.height = leger ? 1024 : 2048
    const ech = c.width / L
    const ctx = c.getContext('2d')!
    ctx.lineJoin = 'round'
    const tracer = (a: number[]) => {
      ctx.beginPath()
      for (let i = 0; i < a.length; i += 2) ctx.lineTo((a[i] + L / 2) * ech, (a[i + 1] + L / 2) * ech)
      ctx.closePath()
    }
    for (const pays of donnees.pays)
      for (const a of pays.anneaux) {
        for (let k = 0; k < 8; k++) {
          tracer(a)
          ctx.lineWidth = (36 - k * 4) * ech
          ctx.strokeStyle = 'rgba(110,200,215,0.1)'
          ctx.stroke()
        }
        tracer(a)
        ctx.lineWidth = 2.2 * ech
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.stroke()
      }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    const rivage = new THREE.Mesh(new THREE.PlaneGeometry(L, L), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }))
    rivage.rotation.x = -Math.PI / 2
    rivage.position.y = -0.2
    scene.add(rivage)
  }
  // Une visite sur mille (ou ?wow dans l adresse pour la montrer) : le reseau entier s allume a la fin
  const wow = Math.random() < 0.001 || new URLSearchParams(window.location.search).has('wow')
  const uniformesWow = { uOnde: { value: 0 } }
  const HAUT_SENEGAL = 2.5
  // Version precedente (dalles plates extrudees, avant le relief du 20/10) :
  // // Avant : Senegal et voisins presque de la meme teinte, frontiere en trait d un pixel
  // // Maintenant : voisins gris pale, Senegal clair et chaud, frontiere en ruban vert ; la dalle
  // // du Senegal se souleve au debut du film (relief)
  // const senegal = new THREE.Group()
  // for (const p of donnees.pays) {
  // if (p.principal) {
  // senegal.add(dalle(p.anneaux, HAUT_SENEGAL, '#F8F4EA', '#C9B993'))
  // for (const a of p.anneaux) {
  // const pts: THREE.Vector3[] = []
  // for (let i = 0; i < a.length; i += 2) pts.push(new THREE.Vector3(a[i], HAUT_SENEGAL + 0.1, a[i + 1]))
  // senegal.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), pts.length * 2, 0.7, 4, true), new THREE.MeshBasicMaterial({ color: '#417F62' })))
  // }
  // } else {
  // const gambie = p.nom === 'Gambie'
  // scene.add(dalle(p.anneaux, gambie ? 1.2 : 0.8, gambie ? '#E2E0DA' : '#E6E4DF', '#C7C3BA'))
  // for (const a of p.anneaux) scene.add(contour(a, (gambie ? 1.2 : 0.8) + 0.05, '#B8B4AA', 0.8))
  // }
  // }
  // scene.add(senegal)

  // ---- Relief : altitudes SRTM, exagerees pour se lire a l echelle du pays ----
  const EXAGERATION = 0.012 // unites (km) par metre : 1 000 m -> 12
  const R = donnees.relief
  /** Hauteur du sol (terre) en x, z, par interpolation dans la grille d altitudes. */
  const hauteur = (x: number, z: number) => {
    if (!R) return HAUT_SENEGAL
    const fx = THREE.MathUtils.clamp(((x - R.x0) / (R.x1 - R.x0)) * (R.nx - 1), 0, R.nx - 1.001)
    const fz = THREE.MathUtils.clamp(((z - R.z0) / (R.z1 - R.z0)) * (R.nz - 1), 0, R.nz - 1.001)
    const i = Math.floor(fx)
    const j = Math.floor(fz)
    const a = (ii: number, jj: number) => R.altitudes[jj * R.nx + ii] ?? 0
    const tx = fx - i
    const tz = fz - j
    const m = a(i, j) * (1 - tx) * (1 - tz) + a(i + 1, j) * tx * (1 - tz) + a(i, j + 1) * (1 - tx) * tz + a(i + 1, j + 1) * tx * tz
    return HAUT_SENEGAL + m * EXAGERATION
  }
  const senegal = new THREE.Group()
  if (R) {
    // Couleurs des pays peintes sur une toile : le reste (la mer) est transparent
    const c = document.createElement('canvas')
    c.width = leger ? 1024 : 2048
    c.height = Math.round((c.width * (R.z1 - R.z0)) / (R.x1 - R.x0))
    const ctx = c.getContext('2d')!
    const ex = c.width / (R.x1 - R.x0)
    const ez = c.height / (R.z1 - R.z0)
    const tracer = (a: number[]) => {
      ctx.beginPath()
      for (let i = 0; i < a.length; i += 2) ctx.lineTo((a[i] - R.x0) * ex, (a[i + 1] - R.z0) * ez)
      ctx.closePath()
    }
    for (const pays of donnees.pays) {
      for (const a of pays.anneaux) {
        tracer(a)
        // ctx.fillStyle = pays.principal ? '#F8F4EA' : pays.nom === 'Gambie' ? '#DEDBD3' : '#E4E2DD'  (voisins tous du meme gris)
        // Chaque voisin sa teinte, toujours pale pour laisser le Senegal au premier plan
        const TEINTES: Record<string, string> = { Gambie: '#D9D5CB', Mauritanie: '#E9E2D2', Mali: '#E2DCCD', Guinée: '#DCE2D5', 'Guinée-Bissau': '#E1DFD6' }
        ctx.fillStyle = pays.principal ? '#F8F4EA' : TEINTES[pays.nom] ?? '#E4E2DD'
        ctx.fill()
      }
    }
    // Frontiere du Senegal : un liseré vert, peint sur le sol pour suivre le relief
    // Frontiere du Senegal remise le 20/10 (retiree puis redemandee), et frontieres des voisins en gris
    for (const pays of donnees.pays.filter((p) => !p.principal))
      for (const a of pays.anneaux) {
        tracer(a)
        ctx.lineWidth = 0.6 * ex
        ctx.strokeStyle = '#A9A398'
        ctx.stroke()
      }
    for (const pays of donnees.pays.filter((p) => p.principal))
      for (const a of pays.anneaux) {
        tracer(a)
        ctx.lineWidth = 1.3 * ex
        ctx.strokeStyle = '#417F62'
        ctx.stroke()
      }
    const carte = new THREE.CanvasTexture(c)
    carte.colorSpace = THREE.SRGBColorSpace
    carte.anisotropy = 8
    const geo = new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0, R.nx - 1, R.nz - 1)
    geo.rotateX(-Math.PI / 2)
    geo.translate((R.x0 + R.x1) / 2, 0, (R.z0 + R.z1) / 2)
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    for (let k = 0; k < pos.count; k++) pos.setY(k, HAUT_SENEGAL + (R.altitudes[k] ?? 0) * EXAGERATION)
    geo.computeVertexNormals()
    // alphaTest : la mer reste visible la ou la toile est vide
    senegal.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: carte, alphaTest: 0.5, roughness: 0.95 })))
  }
  scene.add(senegal)
  // Pays voisins en entier : le relief ne couvre qu une fenetre autour du Senegal ; au-dela, leurs
  // contours complets prolongent la carte (juste sous le relief, qui reste prioritaire la ou il existe)
  const TEINTES_VOISINS: Record<string, string> = { Gambie: '#D9D5CB', Mauritanie: '#E9E2D2', Mali: '#E2DCCD', Guinée: '#DCE2D5', 'Guinée-Bissau': '#E1DFD6' }
  for (const p of donnees.pays.filter((p) => !p.principal)) {
    const voisin = dalle(p.anneaux, HAUT_SENEGAL - 0.3, TEINTES_VOISINS[p.nom] ?? '#E4E2DD', '#C7C3BA')
    scene.add(voisin)
    for (const a of p.anneaux) scene.add(contour(a, HAUT_SENEGAL - 0.25, '#A9A398', 0.9))
  }

  // Noms des pays a plat sur la carte, comme sur un atlas
  const nomSurCarte = (texte: string, x: number, z: number, y: number, taille: number, teinte: string) => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 160
    const ctx = c.getContext('2d')!
    ctx.font = '700 96px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = teinte
    ctx.letterSpacing = '18px'
    ctx.fillText(texte.toUpperCase(), 512, 84)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    const m = new THREE.Mesh(new THREE.PlaneGeometry(taille, taille * 0.156), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x, y, z)
    scene.add(m)
  }
  for (const p of donnees.pays) {
    // Centre du plus grand contour, ramene vers le Senegal pour les grands voisins
    const a = p.anneaux[0]
    let cx = 0
    let cz = 0
    for (let i = 0; i < a.length; i += 2) {
      cx += a[i]
      cz += a[i + 1]
    }
    cx /= a.length / 2
    cz /= a.length / 2
    if (p.principal) nomSurCarte('Sénégal', cx - 60, cz - 70, hauteur(cx - 60, cz - 70) + 0.4, 200, 'rgba(65,127,98,0.22)')
    // Avant : nom au centre de chaque pays, ramene au bord de la carte (souvent hors champ, trop pale)
    // Maintenant : nom pose dans la partie visible de chaque voisin, pres du Senegal (positions en km)
    else {
      const POSITIONS: Record<string, [number, number, number]> = {
        // Ramenes dans le cadre de la vue finale (essai precedent : Mali a x 400, Guinee a z 215, hors champ)
        Gambie: [-22, 83, 70],
        Mauritanie: [80, -215, 150],
        Mali: [320, -40, 130],
        Guinée: [220, 175, 130],
        'Guinée-Bissau': [-10, 182, 120],
      }
      const [nx, nz, taille] = POSITIONS[p.nom] ?? [THREE.MathUtils.clamp(cx, -330, 420), THREE.MathUtils.clamp(cz, -260, 260), 130]
      // Noms des voisins retires le 20/10 : « mets-les sur la carte au lieu de mettre leur nom »
      // nomSurCarte(p.nom, nx, nz, hauteur(nx, nz) + 0.6, taille, 'rgba(80,70,55,0.75)')
      void nx
      void nz
      void taille
    }
  }
  // Avant : (-330, 60, taille 240) : coupe sur le bord gauche
  nomSurCarte('Océan Atlantique', -235, 10, 0.1, 160, 'rgba(255,255,255,0.4)')

  // Routes principales du Senegal, en gris clair sur la terre
  if (donnees.routes?.length) {
    const sommets: number[] = []
    for (const r of donnees.routes)
      for (let i = 0; i + 3 < r.length; i += 2) sommets.push(r[i], hauteur(r[i], r[i + 1]) + 0.15, r[i + 1], r[i + 2], hauteur(r[i + 2], r[i + 3]) + 0.15, r[i + 3])
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(sommets, 3))
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#B4A890', transparent: true, opacity: 0.85 })))
    if (wow) {
      // Effet rare : une onde orange part de Dakar et allume tout le reseau routier
      const d0 = donnees.villes[0]
      const dist: number[] = []
      for (let i = 0; i < sommets.length; i += 3) dist.push(Math.hypot(sommets[i] - d0.x, sommets[i + 2] - d0.z))
      const gw = g.clone()
      gw.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1))
      const lw = new THREE.LineSegments(
        gw,
        new THREE.ShaderMaterial({
          uniforms: uniformesWow,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          vertexShader: 'attribute float aDist; varying float vDist; void main(){ vDist = aDist; gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(0.0, 0.05, 0.0), 1.0); }',
          fragmentShader: 'uniform float uOnde; varying float vDist; void main(){ float d = uOnde - vDist; if (d < 0.0) discard; float front = exp(-d * 0.05); gl_FragColor = vec4(mix(vec3(0.98,0.42,0.1), vec3(1.0,0.9,0.7), front), 0.95); }',
        })
      )
      scene.add(lw)
    }
  }

  // Fleuves Senegal et Gambie : reperes bleus (au-dessus de la Gambie et du Senegal selon l endroit)
  for (const f of donnees.fleuves ?? []) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < f.length; i += 2) pts.push(new THREE.Vector3(f[i], hauteur(f[i], f[i + 1]) + 0.2, f[i + 1]))
    if (pts.length < 2) continue
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.9, 4, false), new THREE.MeshBasicMaterial({ color: '#3D8DC4' })))
  }

  // ---- Forets : des arbres semes dans les emprises OSM (landuse=forest, natural=wood) ----
  const hasardStable = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }
  {
    const zones = donnees.forets ?? []
    const surfaceTotale = zones.reduce((t, [x0, z0, x1, z1]) => t + (x1 - x0) * (z1 - z0), 0) || 1
    const MAX = leger ? 2500 : 7000
    const positions: THREE.Vector3[] = []
    zones.forEach(([x0, z0, x1, z1], iz) => {
      const n = Math.max(1, Math.round((((x1 - x0) * (z1 - z0)) / surfaceTotale) * MAX))
      for (let k = 0; k < n; k++) {
        const x = x0 + hasardStable(iz * 97 + k) * (x1 - x0)
        const z = z0 + hasardStable(iz * 131 + k + 7) * (z1 - z0)
        positions.push(new THREE.Vector3(x, hauteur(x, z), z))
      }
    })
    const arbres = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.6, 6).translate(0, 1.3, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), positions.length)
    const m = new THREE.Matrix4()
    const verts = [couleur('#4E8A3A'), couleur('#5E9A44'), couleur('#3F7A35'), couleur('#6FA34E')]
    positions.forEach((pt, i) => {
      const e = 0.7 + hasardStable(i + 3) * 0.7
      m.makeScale(e, e, e).setPosition(pt)
      arbres.setMatrixAt(i, m)
      arbres.setColorAt(i, verts[i % verts.length])
    })
    scene.add(arbres)
  }

  // ---- Lieux habites : quelques batiments par village, davantage par bourg et par ville ----
  {
    const lieux = donnees.habitat ?? []
    const PAR_TAILLE = [0, 2, 9, 26]
    const RAYON = [0, 0.8, 2.6, 6]
    const MAX = leger ? 6000 : 16000
    const poses: [number, number, number, number][] = []
    lieux.forEach(([x, z, t], il) => {
      for (let k = 0; k < PAR_TAILLE[t] && poses.length < MAX; k++) {
        const a = hasardStable(il * 17 + k) * Math.PI * 2
        const r = Math.sqrt(hasardStable(il * 29 + k + 3)) * RAYON[t]
        poses.push([x + Math.cos(a) * r, z + Math.sin(a) * r, t, a])
      }
    })
    const batiments = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), poses.length)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const tons = [couleur('#F4F1EA'), couleur('#EDE6D8'), couleur('#E7DCC6'), couleur('#F8F6F2')]
    poses.forEach(([x, z, t, a], i) => {
      // Batiments exageres comme le reste de la carte, plus hauts en ville
      const largeur = 0.6 + hasardStable(i + 11) * 0.7
      const haut = t === 3 ? 0.8 + hasardStable(i + 5) * 2.2 : 0.5 + hasardStable(i + 5) * 0.6
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a)
      m.compose(new THREE.Vector3(x, hauteur(x, z), z), q, new THREE.Vector3(largeur, haut, largeur * (0.7 + hasardStable(i) * 0.6)))
      batiments.setMatrixAt(i, m)
      batiments.setColorAt(i, tons[i % tons.length])
    })
    scene.add(batiments)
  }

  // ---- La fibre : un tube qui se dessine le long des routes, lumiere a sa tete ----
  // Fibre aerienne, accrochee en haut des poteaux (avant : posee a 0,8 km du sol)
  const points: THREE.Vector3[] = []
  for (let i = 0; i < donnees.trace.length; i += 2) points.push(new THREE.Vector3(donnees.trace[i], hauteur(donnees.trace[i], donnees.trace[i + 1]) + 5.5, donnees.trace[i + 1]))
  const courbe = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const uniformes = { uTete: { value: 0 }, uTemps: { value: 0 } }
  const fibre = new THREE.Mesh(
    new THREE.TubeGeometry(courbe, Math.max(400, points.length * 3), leger ? 1.3 : 1, 8, false),
    new THREE.ShaderMaterial({
      uniforms: uniformes,
      toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float uTete; uniform float uTemps; varying vec2 vUv;
        void main(){
          float d = uTete - vUv.x;
          if (d < 0.0) discard;
          float tete = exp(-d * 60.0);
          float impulsion = smoothstep(0.92, 1.0, fract(vUv.x * 40.0 - uTemps * 1.2)) * step(0.004, d);
          vec3 c = vec3(0.98, 0.42, 0.10) + vec3(1.0, 0.86, 0.6) * (tete * 1.4 + impulsion * 0.6);
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  )
  scene.add(fibre)
  // Raccordements vers Diourbel et Kaolack : ils partent de l axe une fois la lumiere passee au piquage
  const branches = (donnees.branches ?? []).map((b) => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < b.points.length; i += 2) pts.push(new THREE.Vector3(b.points[i], hauteur(b.points[i], b.points[i + 1]) + 5.5, b.points[i + 1]))
    if (pts.length < 2) return null
    const uniformesB = { uTete: { value: 0 }, uTemps: uniformes.uTemps }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(30, pts.length * 3), leger ? 1.4 : 1.1, 8, false),
      (fibre.material as THREE.ShaderMaterial).clone()
    )
    ;(tube.material as THREE.ShaderMaterial).uniforms = uniformesB
    scene.add(tube)
    return { ...b, uniformes: uniformesB }
  }).filter((b): b is NonNullable<typeof b> => b !== null)
  // Le trace complet, en pointille discret : on devine ou va la fibre
  const guide = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(courbe.getSpacedPoints(600).map((p) => p.clone().setY(hauteur(p.x, p.z) + 0.1))),
    new THREE.LineDashedMaterial({ color: '#B9AD95', dashSize: 3, gapSize: 3 })
  )
  guide.computeLineDistances()
  scene.add(guide)
  const tete = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,130,50,0.75)'), depthWrite: false, transparent: true, toneMapped: false }))
  tete.scale.set(14, 14, 1)
  scene.add(tete)

  // ---- Poteaux le long de l axe et des raccordements, comme dans le film de Dakar ----
  // Exageres (quelques km de haut) pour rester lisibles a l echelle du pays ; ils se dressent
  // quand la fibre passe a leur hauteur. Un tous les 9 km.
  const poses: { pos: THREE.Vector3; u: number; branche?: number }[] = []
  courbe.getSpacedPoints(Math.round(courbe.getLength() / 9)).forEach((pt, i, tous) => poses.push({ pos: pt, u: i / (tous.length - 1) }))
  ;(donnees.branches ?? []).forEach((b, ib) => {
    for (let i = 0; i + 1 < b.points.length; i += 2 * 6) poses.push({ pos: new THREE.Vector3(b.points[i], 0, b.points[i + 1]), u: b.u + 0.06 * (i / b.points.length), branche: ib })
  })
  const fut = new THREE.CylinderGeometry(0.22, 0.32, 6, 6).translate(0, 3, 0)
  const traverse = new THREE.BoxGeometry(2.2, 0.25, 0.25).translate(0, 5.6, 0)
  const poteaux = new THREE.InstancedMesh(fut, new THREE.MeshLambertMaterial({ color: '#7A5A3C' }), poses.length)
  const traverses = new THREE.InstancedMesh(traverse, new THREE.MeshLambertMaterial({ color: '#5E4630' }), poses.length)
  const mPoteau = new THREE.Matrix4()
  const dresser = (u: number) => {
    poses.forEach((po, i) => {
      // Le poteau monte en 2 % d avancement apres le passage de la lumiere
      const k = THREE.MathUtils.clamp((u - po.u) / 0.02, 0, 1)
      const e = k * k * (3 - 2 * k)
      mPoteau.makeScale(1, Math.max(e, 0.0001), 1).setPosition(po.pos.x, hauteur(po.pos.x, po.pos.z), po.pos.z)
      poteaux.setMatrixAt(i, mPoteau)
      traverses.setMatrixAt(i, mPoteau)
    })
    poteaux.instanceMatrix.needsUpdate = traverses.instanceMatrix.needsUpdate = true
  }
  scene.add(poteaux, traverses)

  // ---- Villes : position sur le trace (u), pastille, etiquette, onde a l arrivee de la fibre ----
  // Part de l avancement de l axe pendant laquelle un raccordement se deroule
  const DUREE_BRANCHE = 0.06
  const longueur = courbe.getLength()
  const echantillons = courbe.getSpacedPoints(800)
  const villes = donnees.villes.map((v) => {
    let meilleur = 0
    let dmin = Infinity
    echantillons.forEach((p, i) => {
      const d = Math.hypot(p.x - v.x, p.z - v.z)
      if (d < dmin) {
        dmin = d
        meilleur = i
      }
    })
    const branche = (donnees.branches ?? []).find((b) => b.ville === v.nom)
    // Ville de raccordement : allumee quand son branchement est termine
    const u = branche ? branche.u + DUREE_BRANCHE : meilleur / (echantillons.length - 1)
    // Avant : pastille grise et etiquette blanche visibles des le depart, verdies a l arrivee
    // const textures = [etiquette(v.nom, v.km, false, v.raccordement), etiquette(v.nom, v.km, true, v.raccordement)]
    // Maintenant (20/10) : rien n apparait avant la fibre ; a son arrivee, un bouton s enfonce et l etiquette tombe
    const sol = hauteur(v.x, v.z)
    const pastille = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.2, 32).translate(0, 0.6, 0), new THREE.MeshStandardMaterial({ color: '#3DDC84', emissive: '#1F9D55', emissiveIntensity: 0.6, roughness: 0.4 }))
    pastille.position.set(v.x, sol + 0.1, v.z)
    pastille.visible = false
    const textures = [checkpoint(v.nom, v.km, v.raccordement), checkpoint(v.nom, v.km, v.raccordement)]
    const carte = new THREE.Sprite(new THREE.SpriteMaterial({ map: textures[1], depthTest: false, sizeAttenuation: false, transparent: true }))
    carte.center.set(0.5, 0)
    carte.renderOrder = 10
    carte.position.set(v.x, sol + 7, v.z)
    carte.scale.set(0.18, 0.064, 1)
    carte.visible = false
    const eclat = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
    )
    eclat.position.set(v.x, sol + 0.5, v.z)
    eclat.visible = false
    scene.add(eclat)
    const onde = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#3DDC84', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
    )
    onde.position.set(v.x, hauteur(v.x, v.z) + 0.4, v.z)
    scene.add(pastille, carte, onde)
    return { ...v, u, pastille, carte, onde, eclat, sol, textures, allumee: false }
  })
  void longueur

  // ---- Camera : depart sur la presqu ile du Cap-Vert, poursuite de la fibre, vue d ensemble a la fin ----
  // La fibre court sur [DEBUT, FIN] du defilement ; avant, on s installe sur Dakar ; apres, on recule
  const DEBUT = 0.08
  const FIN = 0.86
  const avancement = (p: number) => THREE.MathUtils.clamp((p - DEBUT) / (FIN - DEBUT), 0, 1)
  const dakar = villes[0]
  const posCamera = new THREE.Vector3(dakar.x - 120, 320, dakar.z + 260)
  const visee = new THREE.Vector3(dakar.x, 0, dakar.z)
  const centre = new THREE.Vector3()
  for (const v of villes) centre.add(new THREE.Vector3(v.x, 0, v.z))
  centre.divideScalar(villes.length)

  // Milieu de l axe Dakar -> Tambacounda : centre de la vue finale (le centre des villes la decalait vers l ouest)
  // Decale vers l est (90 km coupait Dakar, 0 coupait Tambacounda) : tout le trace et les voisins dans le cadre
  const milieuAxe = courbe.getPointAt(0.5).setY(0).add(new THREE.Vector3(55, 0, 20))
  let orbite = 0
  const cadrer = (p: number) => {
    const u = avancement(p)
    const ici = courbe.getPointAt(Math.max(u, 0.0001))
    // Pendant la pose : la camera suit la tete, au sud-ouest et en hauteur, en se rapprochant un peu
    // const suivi = ici.clone().add(new THREE.Vector3(-70, 190, 170))  (avant : poursuite en ligne droite)
    // Arc : la camera glisse d un cote a l autre de la fibre au fil du trajet
    const arc = Math.sin(u * Math.PI * 2) * 90
    // Zoom sur les batiments : a l approche de chaque ville, la camera plonge vers la ville puis remonte
    const pres = Math.max(0, ...villes.map((v) => Math.exp(-(((u - v.u) / 0.035) ** 2))))
    const recul = 1 - 0.62 * pres
    const suivi = ici.clone().add(new THREE.Vector3((-70 + arc * 0.5) * recul, (190 - Math.sin(u * Math.PI) * 30) * recul + 12 * pres, (170 + arc) * recul))
    // Avant : (centre.x - 40, 520, centre.z + 430) : trop loin, la fibre paraissait fine
    // Vue finale : lente orbite autour du milieu de l axe, tout le trace a l image
    // Plus haute et plus reculee (avant : 420 / 340) : les pays voisins entourent le Senegal a l image
    const vueEnsemble = milieuAxe.clone().add(new THREE.Vector3(Math.sin(orbite) * 220, 600, Math.cos(orbite) * 460))
    const ouverture = new THREE.Vector3(dakar.x - 110, 280, dakar.z + 230)
    const kDebut = THREE.MathUtils.smoothstep(p, 0, DEBUT + 0.04)
    const kFin = THREE.MathUtils.smoothstep(p, FIN - 0.02, 0.98)
    const pos = ouverture.clone().lerp(suivi, kDebut).lerp(vueEnsemble, kFin)
    const cible = new THREE.Vector3(dakar.x, 0, dakar.z).lerp(ici, kDebut).lerp(milieuAxe, kFin)
    return [pos, cible] as const
  }

  let progression = 0
  let progressionAffichee = 0
  const placerCamera = (p: number, lissage: number) => {
    const [pos, cible] = cadrer(p)
    posCamera.lerp(pos, lissage)
    visee.lerp(cible, lissage)
    camera.position.copy(posCamera)
    camera.lookAt(visee)
  }

  const appliquer = (p: number) => {
    senegal.scale.y = 0.15 + 0.85 * THREE.MathUtils.smoothstep(p, 0, 0.07)
    const u = avancement(p)
    uniformes.uTete.value = u
    tete.position.copy(courbe.getPointAt(Math.max(u, 0.0001)))
    tete.visible = u > 0.001 && u < 0.999
    dresser(u)
    for (const b of branches) b.uniformes.uTete.value = THREE.MathUtils.clamp((u - b.u) / DUREE_BRANCHE, 0, 1)
    for (const v of villes) {
      // Une ville est raccordee des que la lumiere l a depassee
      // (p > DEBUT : Dakar, au kilometre 0, ne s allume qu au depart reel de la fibre, pas des l ouverture)
      const allumee = p > DEBUT + 0.005 && u >= v.u - 0.002
      if (allumee !== v.allumee) {
        v.allumee = allumee
        gsap.killTweensOf([v.pastille.scale, v.carte.scale, v.carte.position, v.eclat.scale, v.eclat.material])
        v.pastille.visible = v.carte.visible = v.eclat.visible = allumee
        if (allumee) {
          // 1. le bouton sort du sol, 2. il s enfonce comme sous un doigt, 3. il rebondit
          const tl = gsap.timeline()
          tl.fromTo(v.pastille.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'power2.out' })
            .to(v.pastille.scale, { x: 1.35, y: 0.25, z: 1.35, duration: 0.12, ease: 'power3.in' })
            .to(v.pastille.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
          // A l instant de l appui : un anneau blanc s echappe du bouton
          tl.fromTo(v.eclat.scale, { x: 2, y: 1, z: 2 }, { x: 34, y: 1, z: 34, duration: 0.8, ease: 'power2.out' }, 0.37)
          tl.fromTo(v.eclat.material as THREE.MeshBasicMaterial, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: 'power1.out' }, 0.37)
          // L etiquette tombe sur la ville et rebondit
          tl.fromTo(v.carte.position, { y: v.sol + 22 }, { y: v.sol + 7, duration: 0.7, ease: 'bounce.out' }, 0.3)
          tl.fromTo(v.carte.scale, { x: 0.05, y: 0.018 }, { x: 0.18, y: 0.064, duration: 0.5, ease: 'back.out(2.5)' }, 0.3)
        }
      }
    }
  }

  const redimensionner = () => {
    const l = canvas.clientWidth
    const h = canvas.clientHeight
    if (!l || !h) return
    rendu.setSize(l, h, false)
    camera.aspect = l / h
    // Sur telephone (portrait), un champ plus large pour garder le trace en vue
    camera.fov = l < h ? 60 : 40
    camera.updateProjectionMatrix()
  }

  const horloge = new THREE.Clock()
  let image = 0
  let enMarche = false
  const animer = () => {
    const temps = horloge.getElapsedTime()
    progressionAffichee = THREE.MathUtils.lerp(progressionAffichee, progression, 0.08)
    appliquer(progressionAffichee)
    placerCamera(progressionAffichee, 0.06)
    uniformes.uTemps.value = temps
    // L orbite finale avance lentement tant qu on est a la fin du film
    if (progressionAffichee > 0.9) orbite += 0.0025
    // L onde ne part qu une fois le deploiement termine, et se retire si l on remonte
    if (wow) uniformesWow.uOnde.value = progressionAffichee > 0.95 ? Math.min(uniformesWow.uOnde.value + 4, 900) : Math.max(uniformesWow.uOnde.value - 12, 0)
    // Ondes vertes sur les villes raccordees
    villes.forEach((v, i) => {
      v.onde.visible = v.allumee
      if (!v.allumee) return
      const t = (temps * 0.5 + i * 0.25) % 1
      v.onde.scale.setScalar(3 + t * 22)
      ;(v.onde.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9
    })
    tete.scale.setScalar(12 + Math.sin(temps * 6) * 2)
    rendu.render(scene, camera)
    if (enMarche) image = requestAnimationFrame(animer)
  }

  redimensionner()
  appliquer(0)
  placerCamera(0, 1)
  // Shaders compiles en parallele avant la premiere image (meme principe que la scene de Dakar)
  // En developpement : progression du defilement a laquelle chaque ville s allume (verifier les textes)
  if (import.meta.env.DEV)
    (window as unknown as { __timingsSenegal?: unknown }).__timingsSenegal = villes.map((v) => ({ ville: v.nom, p: Math.round((DEBUT + v.u * (FIN - DEBUT)) * 1000) / 1000 }))
  const pret = rendu
    .compileAsync(scene, camera)
    .catch(() => undefined)
    .then(() => rendu.render(scene, camera))

  return {
    pret,
    definirProgression: (p) => {
      progression = THREE.MathUtils.clamp(p, 0, 1)
    },
    figer: (p) => {
      progression = progressionAffichee = THREE.MathUtils.clamp(p, 0, 1)
      appliquer(progression)
      placerCamera(progression, 1)
      villes.forEach((v) => (v.onde.visible = false))
      rendu.render(scene, camera)
    },
    redimensionner: () => {
      redimensionner()
      if (!enMarche) rendu.render(scene, camera)
    },
    demarrer: () => {
      if (enMarche) return
      enMarche = true
      horloge.start()
      image = requestAnimationFrame(animer)
    },
    arreter: () => {
      enMarche = false
      cancelAnimationFrame(image)
    },
    detruire: () => {
      enMarche = false
      cancelAnimationFrame(image)
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Sprite) {
          o.geometry.dispose()
          const m = o.material as THREE.Material | THREE.Material[]
          ;(Array.isArray(m) ? m : [m]).forEach((x) => {
            const carte = (x as THREE.MeshBasicMaterial).map
            carte?.dispose()
            x.dispose()
          })
        }
      })
      villes.forEach((v) => v.textures.forEach((t) => t.dispose()))
      rendu.dispose()
    },
  }
}
