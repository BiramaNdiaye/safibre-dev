import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Scene 3D du quartier Fann / Point E / Amitie (Dakar) a partir des donnees
// OpenStreetMap preparees par outils/donnees-dakar.mjs. Tout est fusionne en
// quelques maillages (un pour les 7 000 batiments, un pour les rues...) :
// une seule scene legere, qui tourne sur un portable ordinaire.

export type DonneesDakar = {
  origine: [number, number]
  bureaux: [number, number]
  batiments: number[][]
  rues: number[][]
  fibre: [number, number][]
  /** Branches de deploiement : u = fraction du trace principal ou elles partent */
  branches?: { u: number; points: number[] }[]
  terre: number[]
  surfaces: number[][]
}

export type SceneDakar = {
  definirProgression: (p: number) => void
  /** Image fixe a la progression p, sans animation (mouvements reduits, tests) */
  figer: (p: number) => void
  redimensionner: () => void
  demarrer: () => void
  arreter: () => void
  detruire: () => void
  /** Resolue quand les shaders sont compiles et la premiere image dessinee */
  pret: Promise<void>
}

// Facades de Dakar : sable, ocre, blanc casse, terre cuite, quelques pastels
// Majorite de blancs et blancs casses, comme une maquette urbaine, avec quelques tons sable
// Ancienne palette (sable, ocre, pastels), avant les facades blanches facon maquette :
// const FACADES = ['#F3E7D3', '#EAD6B5', '#E7C79C', '#F6F1E7', '#D9AE86', '#EBD2BD', '#D6E4D6', '#F0D8A6', '#E2BFA4', '#F4E0C4']
const FACADES = ['#F7F7F5', '#F2F2F0', '#FAFAF8', '#EEEEEB', '#F5F4F1', '#F0EDE6', '#F8F8F6', '#ECECE9', '#F4F3F0', '#EDE7DC']
const COULEURS_FIBRES = ['#2F6FE4', '#22C55E', '#FACC15', '#A855F7', '#EC4899', '#E46B22']
const VOITURES = ['#F4F4F2', '#F4F4F2', '#2B2B2B', '#F2C230', '#F2C230', '#C8452F', '#9AA3AD', '#3E6E9E']
const PIROGUES = ['#E63B2E', '#F2C230', '#1F9D55', '#2F6FE4', '#F7F3EA']

const hasard = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const couleur = (hex: string) => new THREE.Color(hex)

/** Ajoute un polygone plat triangule (sol, parcs, plages) a des tableaux de sommets. */
function polygonePlat(pts: number[], y: number, c: THREE.Color, positions: number[], normales: number[], couleurs: number[]) {
  const contour: THREE.Vector2[] = []
  for (let i = 0; i < pts.length; i += 2) contour.push(new THREE.Vector2(pts[i], pts[i + 1]))
  if (contour.length > 2 && contour[0].equals(contour[contour.length - 1])) contour.pop()
  if (contour.length < 3) return
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  for (const [a, b, d] of triangles) {
    const A = contour[a]
    const B = contour[b]
    const C = contour[d]
    // On veut une face vers le haut : sinon on inverse l ordre
    const haut = (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y) > 0
    const ordre = haut ? [A, B, C] : [A, C, B]
    for (const p of ordre) {
      positions.push(p.x, y, p.y)
      normales.push(0, 1, 0)
      couleurs.push(c.r, c.g, c.b)
    }
  }
}

function maillage(positions: number[], normales: number[], couleurs: number[], materiau: THREE.Material) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3))
  return new THREE.Mesh(g, materiau)
}

/**
 * Facade facon maquette urbaine (reference du proprietaire) : volumes blancs nets, fenetres
 * a peine marquees qui donnent l echelle sans salir le blanc. Le motif reste uni sur les toits.
 */
function texturFacade() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 128, 128)
  // Bandeau d etage, un peu plus sombre : lit la hauteur des immeubles
  ctx.fillStyle = '#f0eeea'
  ctx.fillRect(0, 120, 128, 8)
  // Fenetre : cadre clair, vitre sombre qui reflete un peu le ciel
  ctx.fillStyle = '#efedea'
  ctx.fillRect(44, 40, 40, 50)
  const vitre = ctx.createLinearGradient(0, 44, 0, 86)
  vitre.addColorStop(0, '#dfe6ea')
  vitre.addColorStop(1, '#c9d2d8')
  ctx.fillStyle = vitre
  ctx.fillRect(47, 44, 34, 42)
  // Ancien reflet de vitre et anciennes couleurs (vitre sombre #6f8796 -> #3a4a55, cadre #d8d2c6, bandeau #e6e1d8) :
  // ctx.fillStyle = 'rgba(255,255,255,0.25)'
  // ctx.fillRect(63, 44, 2, 42)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

const TRAVEE = 4
const ETAGE = 3.1

function batiments(donnees: DonneesDakar) {
  const positions: number[] = []
  const normales: number[] = []
  const couleurs: number[] = []
  const uvs: number[] = []
  const toits: THREE.Vector3[] = []
  // Plage de sommets de chaque batiment dans le maillage commun : pour l allumer une fois raccorde
  const plages: [number, number][] = []
  const toit = couleur('#FBFBFA')
  for (const b of donnees.batiments) {
    const debut = positions.length / 3
    const [h, graine, ...coords] = b
    const pts: THREE.Vector2[] = []
    for (let i = 0; i < coords.length; i += 2) pts.push(new THREE.Vector2(coords[i], coords[i + 1]))
    const c = couleur(FACADES[graine % FACADES.length])
    const bas = c.clone().multiplyScalar(0.78)
    const centre = pts.reduce((s, p) => s.add(p), new THREE.Vector2()).divideScalar(pts.length)

    // Murs : la normale doit sortir du batiment, sinon l eclairage les noircit
    let cumul = 0
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const d = pts[(i + 1) % pts.length]
      let nx = -(d.y - a.y)
      let nz = d.x - a.x
      const milieu = a.clone().add(d).multiplyScalar(0.5).sub(centre)
      const dehors = nx * milieu.x + nz * milieu.y > 0
      const [p, q] = dehors ? [a, d] : [d, a]
      if (!dehors) {
        nx = -nx
        nz = -nz
      }
      const l = Math.hypot(nx, nz) || 1
      nx /= l
      nz /= l
      const longueur = a.distanceTo(d)
      // u en travees de 4 m, v en etages : les fenetres gardent leur taille quel que soit le mur
      const u0 = cumul / TRAVEE
      const u1 = (cumul + longueur) / TRAVEE
      cumul += longueur
      const sommets: [THREE.Vector2, number, number][] = [
        [p, 0, u0], [q, 0, u1], [q, h, u1],
        [p, 0, u0], [q, h, u1], [p, h, u0],
      ]
      for (const [s, y, u] of sommets) {
        positions.push(s.x, y, s.y)
        normales.push(nx, 0, nz)
        const k = y === 0 ? bas : c
        couleurs.push(k.r, k.g, k.b)
        uvs.push(u, y / ETAGE)
      }
    }
    // Toit-terrasse, plus clair, pris dans la partie unie du motif
    const tc = c.clone().lerp(toit, 0.55)
    const avant = positions.length
    polygonePlat(coords, h, tc, positions, normales, couleurs)
    for (let k = avant; k < positions.length; k += 3) uvs.push(0.05, 0.05)
    // Une terrasse sur trois porte une citerne ou un local technique
    plages.push([debut, positions.length / 3])
    if (hasard(graine * 13 + h) > 0.62 && h > 4) toits.push(new THREE.Vector3(centre.x + (hasard(graine) - 0.5) * 4, h, centre.y + (hasard(graine + 1) - 0.5) * 4))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  // 0 = eteint, 1 = batiment raccorde, allume en vert (murs, fenetres et toit)
  const allume = new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3), 1)
  allume.setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('aAllume', allume)
  const materiau = new THREE.MeshStandardMaterial({ vertexColors: true, map: texturFacade(), roughness: 0.92, metalness: 0 })
  materiau.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aAllume;
varying float vAllume;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vAllume = aAllume;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vAllume;`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.86, 0.55), vAllume * 0.75);
totalEmissiveRadiance += vec3(0.12, 0.78, 0.40) * vAllume * 0.85;`
      )
  }
  const mesh = new THREE.Mesh(g, materiau)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return { mesh, toits, plages, allume }
}

function sols(donnees: DonneesDakar) {
  const positions: number[] = []
  const normales: number[] = []
  const couleurs: number[] = []
  polygonePlat(donnees.terre, 0, couleur('#DCCDB0'), positions, normales, couleurs)
  const teintes = [couleur('#93C06E'), couleur('#6FAE5A'), couleur('#F2E3C2')]
  for (const [genre, ...pts] of donnees.surfaces) polygonePlat(pts, 0.06 + genre * 0.01, teintes[genre], positions, normales, couleurs)
  return maillage(positions, normales, couleurs, new THREE.MeshLambertMaterial({ vertexColors: true }))
}

function rues(donnees: DonneesDakar) {
  const positions: number[] = []
  const normales: number[] = []
  const couleurs: number[] = []
  const largeurs = [16, 12, 10, 8, 6]
  const teintes = [couleur('#8D8780'), couleur('#948E86'), couleur('#9C968D'), couleur('#A7A096'), couleur('#B5AC9F')]
  for (const [cat, ...pts] of donnees.rues) {
    const w = largeurs[cat] / 2
    const y = 0.12 + (4 - cat) * 0.02
    const c = teintes[cat]
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i]
      const az = pts[i + 1]
      const bx = pts[i + 2]
      const bz = pts[i + 3]
      const l = Math.hypot(bx - ax, bz - az) || 1
      const px = (-(bz - az) / l) * w
      const pz = ((bx - ax) / l) * w
      const coins = [
        [ax - px, az - pz], [bx - px, bz - pz], [bx + px, bz + pz],
        [ax - px, az - pz], [bx + px, bz + pz], [ax + px, az + pz],
      ]
      // Meme regle que le sol : face vers le haut
      const haut = (coins[1][1] - coins[0][1]) * (coins[2][0] - coins[0][0]) - (coins[1][0] - coins[0][0]) * (coins[2][1] - coins[0][1]) > 0
      const ordre = haut ? [0, 1, 2, 3, 4, 5] : [0, 2, 1, 3, 5, 4]
      for (const k of ordre) {
        positions.push(coins[k][0], y, coins[k][1])
        normales.push(0, 1, 0)
        couleurs.push(c.r, c.g, c.b)
      }
    }
  }
  return maillage(positions, normales, couleurs, new THREE.MeshLambertMaterial({ vertexColors: true }))
}

/** Le point est-il a terre ? (sert a poser pirogues en mer et palmiers sur le sol) */
function surTerre(terre: number[], x: number, z: number) {
  let dedans = false
  for (let i = 0, j = terre.length - 2; i < terre.length; j = i, i += 2) {
    const xi = terre[i]
    const zi = terre[i + 1]
    const xj = terre[j]
    const zj = terre[j + 1]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dedans = !dedans
  }
  return dedans
}

type Trajet = { points: THREE.Vector3[]; longueurs: number[]; total: number }

function trajet(pts: number[], y: number): Trajet {
  const points: THREE.Vector3[] = []
  for (let i = 0; i < pts.length; i += 2) points.push(new THREE.Vector3(pts[i], y, pts[i + 1]))
  const longueurs = [0]
  for (let i = 1; i < points.length; i++) longueurs.push(longueurs[i - 1] + points[i].distanceTo(points[i - 1]))
  return { points, longueurs, total: longueurs[longueurs.length - 1] }
}

function pointSurTrajet(t: Trajet, s: number, sortie: THREE.Vector3, direction: THREE.Vector3) {
  let i = 1
  while (i < t.longueurs.length - 1 && t.longueurs[i] < s) i++
  const a = t.points[i - 1]
  const b = t.points[i]
  const seg = t.longueurs[i] - t.longueurs[i - 1] || 1
  const f = Math.min(Math.max((s - t.longueurs[i - 1]) / seg, 0), 1)
  sortie.lerpVectors(a, b, f)
  direction.subVectors(b, a).normalize()
}

function texteEnTexture(texte: string, fond: string) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = fond
  ctx.beginPath()
  ctx.roundRect(4, 4, 504, 120, 60)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 56px Montserrat, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texte, 256, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function halo(teinte: string) {
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

export function creerSceneDakar(canvas: HTMLCanvasElement, donnees: DonneesDakar, options: { leger?: boolean } = {}): SceneDakar {
  const leger = options.leger ?? false
  // Chronometre de construction, en developpement seulement (window.__chronoDakar)
  const chrono: [string, number][] = []
  let repere = performance.now()
  const jalon = (nom: string) => {
    if (!import.meta.env.DEV) return
    const t = performance.now()
    chrono.push([nom, Math.round(t - repere)])
    repere = t
  }
  const rendu = new THREE.WebGLRenderer({ canvas, antialias: !leger, powerPreference: 'high-performance' })
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, leger ? 1.25 : 1.75))
  rendu.toneMapping = THREE.ACESFilmicToneMapping
  rendu.toneMappingExposure = 0.95
  rendu.outputColorSpace = THREE.SRGBColorSpace
  // Ombres du soleil couchant : le relief de la ville en depend ; coupees sur les petites machines
  rendu.shadowMap.enabled = !leger
  rendu.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  // Ciel de fin d apres-midi sur l Atlantique, dessine sur mesure (le ciel physique de
  // Three.js sortait gris) : bleu franc en haut, horizon clair et brumeux, soleil au-dessus
  // de l ocean pour les reflets sur la mer ; il eclaire aussi la scene.
  // Ancien coucher de soleil : soleil a 6 degres, horizon dore #F7C98E, zenith #3C6E9E, milieu #E9A877,
  // brume Fog(HORIZON, 1100, 3600), HemisphereLight('#FFEBCC', '#A88F6E', 1.1), DirectionalLight('#FFD2A0', 2.8)
  // const directionSoleil = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 6), THREE.MathUtils.degToRad(-100))
  // const HORIZON = '#F7C98E'
  const directionSoleil = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 32), THREE.MathUtils.degToRad(-100))
  const HORIZON = '#DCE8EE'
  const materiauCiel = () =>
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      uniforms: {
        uSoleil: { value: directionSoleil },
        uZenith: { value: couleur('#3F86C8') },
        uMilieu: { value: couleur('#9CC7E8') },
        uHorizon: { value: couleur(HORIZON) },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 uSoleil; uniform vec3 uZenith; uniform vec3 uMilieu; uniform vec3 uHorizon; varying vec3 vDir;
        void main(){
          float h = clamp(vDir.y, 0.0, 1.0);
          // Degrade long : une transition courte faisait une ligne nette au-dessus de la brume
          vec3 c = mix(uHorizon, uMilieu, smoothstep(-0.02, 0.32, h));
          c = mix(c, uZenith, smoothstep(0.22, 0.85, h));
          float s = max(dot(normalize(vDir), normalize(uSoleil)), 0.0);
          c += vec3(1.0, 0.93, 0.8) * pow(s, 10.0) * 0.35;
          c += vec3(1.0, 0.9, 0.7) * pow(s, 900.0) * 2.5;
          if (vDir.y < 0.0) c = uHorizon;
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  // Le dome suit la camera et reste sous son plan lointain : plus grand, il etait coupe
  // et le haut de l image sortait noir (surtout sur telephone, ou l on voit plus de ciel)
  // const ciel = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), materiauCiel())  (coupe par le plan lointain : haut noir)
  const ciel = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), materiauCiel())
  scene.add(ciel)
  const pmrem = new THREE.PMREMGenerator(rendu)
  const sceneCiel = new THREE.Scene()
  sceneCiel.add(new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), materiauCiel()))
  jalon('ciel')
  scene.environment = pmrem.fromScene(sceneCiel).texture
  // Le ciel eclaire sans delaver les facades
  scene.environmentIntensity = 0.6
  // Brume assez proche pour que la limite des donnees se fonde dans l horizon
  scene.fog = new THREE.Fog(HORIZON, 2400, 7000)

  const camera = new THREE.PerspectiveCamera(42, 1, 5, 9000)

  scene.add(new THREE.HemisphereLight('#EEF5FF', '#B8A78C', 1.2))
  const soleil = new THREE.DirectionalLight('#FFF3E2', 3)
  soleil.position.copy(directionSoleil).multiplyScalar(1800)
  soleil.castShadow = !leger
  soleil.shadow.mapSize.set(2048, 2048)
  const ombre = soleil.shadow.camera
  ombre.left = ombre.bottom = -650
  ombre.right = ombre.top = 650
  ombre.near = 10
  ombre.far = 5000
  soleil.shadow.bias = -0.0004
  soleil.shadow.normalBias = 0.8
  scene.add(soleil, soleil.target)

  jalon('environnement')
  // Ancien ocean : couleur unie, sans houle ni rivage
  // const ocean = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshStandardMaterial({ color: '#1C6A88', roughness: 0.12, metalness: 0.35 }))
  // Ocean bleu franc dont la houle accroche le soleil : une carte de normales en vagues
  // croisees, qui derive doucement, donne les scintillements de la reference
  const houle = (() => {
    // Avant : 256 px et un THREE.Vector3 par pixel (0,8 s au chargement)
    // const n = 256
    const n = 128
    const c = document.createElement('canvas')
    c.width = c.height = n
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(n, n)
    // Frequences entieres : la texture se repete sans couture
    const ondes = [
      [3, 1, 0.0, 1.0],
      [-2, 4, 1.7, 0.8],
      [5, -3, 2.9, 0.55],
      [-7, -2, 0.6, 0.4],
      [9, 6, 4.1, 0.3],
      [-4, 11, 5.3, 0.25],
      [13, -9, 3.3, 0.18],
    ]
    const pente = (x: number, y: number) => {
      let dx = 0
      let dy = 0
      for (const [fx, fy, phase, amp] of ondes) {
        const a = ((fx * x + fy * y) / n) * Math.PI * 2 + phase
        dx += Math.cos(a) * fx * amp
        dy += Math.cos(a) * fy * amp
      }
      return [dx, dy]
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const [dx, dy] = pente(x, y)
        // const v = new THREE.Vector3(-dx * 0.06, -dy * 0.06, 1).normalize()
        const nx = -dx * 0.06
        const ny = -dy * 0.06
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1)
        const k = (y * n + x) * 4
        img.data[k] = (nx * inv * 0.5 + 0.5) * 255
        img.data[k + 1] = (ny * inv * 0.5 + 0.5) * 255
        img.data[k + 2] = (inv * 0.5 + 0.5) * 255
        img.data[k + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(260, 260)
    return t
  })()
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(20000, 20000),
    new THREE.MeshStandardMaterial({ color: '#2A78AE', roughness: 0.07, metalness: 0.15, normalMap: houle, normalScale: new THREE.Vector2(0.7, 0.7) })
  )
  ocean.rotation.x = -Math.PI / 2
  ocean.position.y = -0.8
  ocean.receiveShadow = false
  scene.add(ocean)

  jalon('ocean')
  // Rivage : eau plus claire sur les hauts-fonds et liseré d ecume le long de la cote.
  // Peint sur une toile autour du trace de la cote ; la terre, posee au-dessus, cache le cote interieur.
  const rivage = (() => {
    const t = donnees.terre
    let x0 = Infinity
    let z0 = Infinity
    let x1 = -Infinity
    let z1 = -Infinity
    for (let i = 0; i < t.length; i += 2) {
      x0 = Math.min(x0, t[i])
      x1 = Math.max(x1, t[i])
      z0 = Math.min(z0, t[i + 1])
      z1 = Math.max(z1, t[i + 1])
    }
    const marge = 500
    x0 -= marge
    z0 -= marge
    x1 += marge
    z1 += marge
    const largeur = x1 - x0
    const hauteur = z1 - z0
    const echelle = (leger ? 1024 : 2048) / Math.max(largeur, hauteur)
    const c = document.createElement('canvas')
    c.width = Math.ceil(largeur * echelle)
    c.height = Math.ceil(hauteur * echelle)
    const ctx = c.getContext('2d')!
    const trace = () => {
      ctx.beginPath()
      for (let i = 0; i < t.length; i += 2) ctx.lineTo((t[i] - x0) * echelle, (t[i + 1] - z0) * echelle)
      ctx.closePath()
    }
    ctx.lineJoin = 'round'
    // Des traits de plus en plus fins et opaques : un degrade sans ctx.filter (absent de vieux Safari)
    for (let k = 0; k < 10; k++) {
      trace()
      ctx.lineWidth = (320 - k * 30) * echelle
      ctx.strokeStyle = `rgba(110,200,215,${0.1})`
      ctx.stroke()
    }
    for (const [l, a] of [[26, 0.35], [14, 0.6], [7, 0.95]]) {
      trace()
      ctx.lineWidth = l * echelle
      ctx.strokeStyle = `rgba(255,255,255,${a})`
      ctx.stroke()
    }
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = THREE.SRGBColorSpace
    const plan = new THREE.Mesh(
      new THREE.PlaneGeometry(largeur, hauteur),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true, depthWrite: false, roughness: 0.35 })
    )
    plan.rotation.x = -Math.PI / 2
    plan.position.set(x0 + largeur / 2, -0.4, z0 + hauteur / 2)
    return plan
  })()
  scene.add(rivage)

  jalon('rivage')
  const sol = sols(donnees)
  sol.receiveShadow = true
  const voirie = rues(donnees)
  voirie.receiveShadow = true
  jalon('sols')
  const bati = batiments(donnees)
  scene.add(sol, voirie, bati.mesh)

  // Citernes et locaux techniques sur les toits-terrasses, noires ou blanches comme a Dakar
  const citernes = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.3, 1.3, 2.4, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), bati.toits.length)
  const mc = new THREE.Matrix4()
  bati.toits.forEach((t, i) => {
    mc.makeTranslation(t.x, t.y + 1.2, t.z)
    citernes.setMatrixAt(i, mc)
    citernes.setColorAt(i, couleur(i % 3 ? '#C9CDD0' : '#EDEDED'))
  })
  citernes.castShadow = true
  scene.add(citernes)

  jalon('batiments')
  // ---- Palmiers et arbres : parcs et bords de rues residentielles ----
  const arbres: THREE.Vector3[] = []
  let graine = 1
  for (const [genre, ...pts] of donnees.surfaces) {
    if (genre !== 0) continue
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i])
      minZ = Math.min(minZ, pts[i + 1]); maxZ = Math.max(maxZ, pts[i + 1])
    }
    const nombre = Math.min(40, Math.floor(((maxX - minX) * (maxZ - minZ)) / 900))
    for (let k = 0; k < nombre; k++) {
      const x = minX + hasard(graine++) * (maxX - minX)
      const z = minZ + hasard(graine++) * (maxZ - minZ)
      if (surTerre(pts, x, z)) arbres.push(new THREE.Vector3(x, 0, z))
    }
  }
  for (const [cat, ...pts] of donnees.rues) {
    if (cat < 3) continue
    for (let i = 0; i < pts.length - 2; i += 2) {
      if (hasard(graine++) > (leger ? 0.12 : 0.25)) continue
      const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3]
      const l = Math.hypot(bx - ax, bz - az) || 1
      const cote = hasard(graine++) > 0.5 ? 1 : -1
      arbres.push(new THREE.Vector3((ax + bx) / 2 + (-(bz - az) / l) * 7 * cote, 0, (az + bz) / 2 + ((bx - ax) / l) * 7 * cote))
    }
  }
  const tronc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 9, 5), new THREE.MeshLambertMaterial({ color: '#8A6A4A' }), arbres.length)
  const feuillage = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), arbres.length)
  const m = new THREE.Matrix4()
  const verts = [couleur('#4E8A3A'), couleur('#5E9A44'), couleur('#3F7A35'), couleur('#6FA34E')]
  arbres.forEach((p, i) => {
    const echelle = 0.8 + hasard(i * 3) * 0.6
    m.compose(new THREE.Vector3(p.x, 4.5 * echelle, p.z), new THREE.Quaternion(), new THREE.Vector3(echelle, echelle, echelle))
    tronc.setMatrixAt(i, m)
    m.compose(
      new THREE.Vector3(p.x, 9.5 * echelle, p.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, hasard(i) * 3, 0)),
      new THREE.Vector3(echelle * 1.3, echelle * 0.55, echelle * 1.3)
    )
    feuillage.setMatrixAt(i, m)
    feuillage.setColorAt(i, verts[i % verts.length])
  })
  tronc.castShadow = feuillage.castShadow = true
  scene.add(tronc, feuillage)

  jalon('arbres')
  // ---- Circulation : voitures, taxis jaunes, cars rapides sur les axes ----
  const axes = donnees.rues.filter(([cat, ...pts]) => cat <= 3 && pts.length >= 4).map(([, ...pts]) => trajet(pts, 0)).filter((t) => t.total > 60)
  const nbVoitures = leger ? 90 : 220
  const voitures = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 1.6, 4.4), new THREE.MeshLambertMaterial({ color: '#ffffff' }), nbVoitures)
  const nbCars = leger ? 10 : 24
  const cars = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 3, 9), new THREE.MeshLambertMaterial({ color: '#ffffff' }), nbCars)
  type Mobile = { trajet: Trajet; s: number; vitesse: number }
  const mobiles: Mobile[] = []
  for (let i = 0; i < nbVoitures + nbCars; i++) {
    const t = axes[Math.floor(hasard(i * 7 + 1) * axes.length)]
    mobiles.push({ trajet: t, s: hasard(i * 7 + 2) * t.total, vitesse: (6 + hasard(i * 7 + 3) * 9) * (hasard(i * 7 + 4) > 0.5 ? 1 : -1) })
    if (i < nbVoitures) voitures.setColorAt(i, couleur(VOITURES[i % VOITURES.length]))
    // Les cars rapides : bleu et jaune, comme dans les rues de Dakar
    else cars.setColorAt(i - nbVoitures, couleur(i % 2 ? '#2F6FE4' : '#F2C230'))
  }
  scene.add(voitures, cars)

  jalon('circulation')
  // ---- Pirogues au large de la Corniche ----
  const pirogues: { position: THREE.Vector3; cap: number; phase: number; derive: number }[] = []
  const t = donnees.terre
  for (let essai = 0; pirogues.length < (leger ? 18 : 36) && essai < 4000; essai++) {
    const i = Math.floor(hasard(essai + 500) * (t.length / 2 - 4)) * 2
    const ax = t[i], az = t[i + 1], bx = t[i + 2], bz = t[i + 3]
    const l = Math.hypot(bx - ax, bz - az) || 1
    const recul = 60 + hasard(essai + 900) * 520
    // La mer est a droite du sens de la cote ; z pointe au sud, d ou ces signes
    const x = ax - ((bz - az) / l) * recul
    const z = az + ((bx - ax) / l) * recul
    if (Math.abs(x) > 3500 || Math.abs(z) > 3500 || surTerre(t, x, z)) continue
    pirogues.push({ position: new THREE.Vector3(x, 0, z), cap: hasard(essai) * Math.PI * 2, phase: hasard(essai + 3) * 6, derive: 0.6 + hasard(essai + 4) })
  }
  const coque = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1, 11), new THREE.MeshLambertMaterial({ color: '#ffffff' }), pirogues.length)
  pirogues.forEach((_, i) => coque.setColorAt(i, couleur(PIROGUES[i % PIROGUES.length])))
  scene.add(coque)

  jalon('pirogues')
  // Ancienne fibre : tube de 4 m + gaine de 11 m en melange additif (gros bloc jaune sur les facades blanches)
  // const courbe = new THREE.CatmullRomCurve3(donnees.fibre.map(([x, z]) => new THREE.Vector3(x, 4, z)), false, 'centripetal')
  // const geoFibre = new THREE.TubeGeometry(courbe, segments, 4, RADIAL, false)
  // const shaderFibre = (gaine: boolean) => new THREE.ShaderMaterial({ uniforms: uniformesFibre, transparent: gaine, depthWrite: !gaine,
  //   blending: gaine ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, ... orange + braise * (tete * 1.6 + impulsion * 0.9),
  //   gaine ? vec4(c, 0.22 + tete * 0.6 + impulsion * 0.35) : vec4(c, 1.0) })
  // const fibre = new THREE.Mesh(geoFibre, shaderFibre(false))
  // const gaine = new THREE.Mesh(new THREE.TubeGeometry(courbe, segments, 11, RADIAL, false), shaderFibre(true))
  // scene.add(fibre, gaine)
  // ---- La fibre SAFIBRE : trace orange sur la rue, cable par-dessus, lumiere a sa tete ----
  // Avant : fibre a 3,2 m du sol, tube de 1,3 m, lueur de 3 m, puis 1,4 m / 0,9 m / 2,2 m (trop massif de pres)
  const courbe = new THREE.CatmullRomCurve3(donnees.fibre.map(([x, z]) => new THREE.Vector3(x, 0.7, z)), false, 'centripetal')
  const longueurFibre = courbe.getLength()
  const segments = Math.max(200, Math.floor(longueurFibre / 3))
  const RADIAL = 8
  // Hors tonalite : l orange reste vif quelle que soit la lumiere de la scene.
  // La fibre avance en continu (pas par segments) : le shader coupe au-dela de la tete,
  // fait briller la tete et fait circuler des impulsions dans la partie posee.
  const uniformesFibre = { uTete: { value: 0 }, uTemps: { value: 0 } }
  const COMMUN = `
    uniform float uTete; uniform float uTemps; varying vec2 vUv; varying vec3 vNormale; varying vec3 vVue;
    vec3 ORANGE = vec3(0.98, 0.40, 0.09);
    vec3 BRAISE = vec3(1.0, 0.84, 0.58);`
  const sommets = `
    varying vec2 vUv; varying vec3 vNormale; varying vec3 vVue;
    void main(){
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormale = normalize(normalMatrix * normal);
      vVue = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`
  // genre : 'cable' (opaque, ombre de cylindre), 'trace' (bande posee sur la rue), 'halo' (bord doux)
  const shaderFibre = (genre: 'cable' | 'trace' | 'halo') =>
    new THREE.ShaderMaterial({
      uniforms: uniformesFibre,
      transparent: genre !== 'cable',
      depthWrite: genre === 'cable',
      polygonOffset: genre === 'trace',
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: false,
      vertexShader: sommets,
      fragmentShader: `${COMMUN}
        void main(){
          float d = uTete - vUv.x;
          if (d < 0.0) discard;
          float tete = exp(-d * 120.0);
          float impulsion = smoothstep(0.9, 1.0, fract(vUv.x * 60.0 - uTemps * 1.4)) * step(0.004, d);
          ${
            genre === 'cable'
              ? `// Eclairage de cylindre : le cable a du volume au lieu d etre un ruban plat
          float face = clamp(dot(vNormale, vVue), 0.0, 1.0);
          vec3 c = ORANGE * (0.55 + 0.45 * face) + vec3(1.0, 0.9, 0.75) * pow(face, 18.0) * 0.35;
          c += BRAISE * (tete * 1.4 + impulsion * 0.7);
          gl_FragColor = vec4(c, 1.0);`
              : genre === 'trace'
                ? `// Bande sur la chaussee, bords adoucis, comme le trace surligne d un plan
          float bord = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);
          vec3 c = mix(ORANGE, BRAISE, tete * 0.8 + impulsion * 0.4);
          gl_FragColor = vec4(c, bord * (0.62 + tete * 0.3));`
                : `// Halo : seulement sur les bords du tube (Fresnel) et pres de la tete, jamais un bloc
          float fresnel = pow(1.0 - clamp(abs(dot(vNormale, vVue)), 0.0, 1.0), 2.0);
          gl_FragColor = vec4(BRAISE, fresnel * tete * 0.55);`
          }
        }`,
    })
  const fibre = new THREE.Mesh(new THREE.TubeGeometry(courbe, segments, 0.5, RADIAL, false), shaderFibre('cable'))
  const lueur = new THREE.Mesh(new THREE.TubeGeometry(courbe, segments, 1.3, RADIAL, false), shaderFibre('halo'))
  // Bande au sol : 14 m de large, posee juste au-dessus des rues
  const geoTrace = (() => {
    const n = segments
    const pos: number[] = []
    const uv: number[] = []
    const nor: number[] = []
    const index: number[] = []
    const t = new THREE.Vector3()
    for (let i = 0; i <= n; i++) {
      const u = i / n
      const p = courbe.getPointAt(u)
      courbe.getTangentAt(u, t)
      const lx = -t.z
      const lz = t.x
      const l = Math.hypot(lx, lz) || 1
      for (const cote of [-1, 1]) {
        pos.push(p.x + (lx / l) * 4.5 * cote, 0.45, p.z + (lz / l) * 4.5 * cote)
        uv.push(u, cote < 0 ? 0 : 1)
        nor.push(0, 1, 0)
      }
      if (i < n) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    g.setIndex(index)
    return g
  })()
  const trace = new THREE.Mesh(geoTrace, shaderFibre('trace'))
  trace.material.side = THREE.DoubleSide
  scene.add(trace, fibre, lueur)

  // Nuages : quelques bancs etires, blancs, qui derivent lentement
  const textureNuage = (() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const ctx = c.getContext('2d')!
    for (let k = 0; k < 14; k++) {
      const x = 40 + hasard(k + 300) * 176
      const y = 50 + hasard(k + 400) * 34
      const rayon = 22 + hasard(k + 500) * 30
      const g = ctx.createRadialGradient(x, y, 0, x, y, rayon)
      g.addColorStop(0, 'rgba(255,255,255,0.55)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 256, 128)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const nuages: THREE.Sprite[] = []
  for (let k = 0; k < 16; k++) {
    const nuage = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: textureNuage, transparent: true, depthWrite: false, fog: false, color: k % 3 ? '#FFFFFF' : '#F1F5F8', opacity: 0.55 })
    )
    const angle = hasard(k + 600) * Math.PI * 2
    const distance = 2200 + hasard(k + 700) * 3500
    nuage.position.set(Math.cos(angle) * distance, 900 + hasard(k + 800) * 900, Math.sin(angle) * distance)
    const largeur = 1400 + hasard(k + 900) * 1800
    nuage.scale.set(largeur, largeur * 0.32, 1)
    scene.add(nuage)
    nuages.push(nuage)
  }

  // Etincelles au point de pose : la tete de la fibre « travaille »
  const NB_ETINCELLES = 60
  const geoEtincelles = new THREE.BufferGeometry()
  const posEtincelles = new Float32Array(NB_ETINCELLES * 3)
  const vitEtincelles = new Float32Array(NB_ETINCELLES * 3)
  const vieEtincelles = new Float32Array(NB_ETINCELLES)
  geoEtincelles.setAttribute('position', new THREE.BufferAttribute(posEtincelles, 3))
  const etincelles = new THREE.Points(
    geoEtincelles,
    new THREE.PointsMaterial({ color: '#FFD9A8', size: 3.2, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  )
  etincelles.frustumCulled = false
  scene.add(etincelles)


  // const tete = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,120,40,0.85)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  // tete.scale.set(48, 48, 1)
  // const lumiereTete = new THREE.PointLight('#FF8A3D', 9000, 260, 2)
  // Melange normal : en additif, sur des facades blanches, la tete brulait l image
  const tete = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,130,50,0.7)'), depthWrite: false, transparent: true, toneMapped: false, opacity: 0.9 }))
  // tete.scale.set(30, 30, 1)  (avant : trop grosse dans les plans rapproches)
  tete.scale.set(16, 16, 1)
  scene.add(tete)
  const lumiereTete = new THREE.PointLight('#FF8A3D', 3500, 200, 2)
  scene.add(lumiereTete)

  // Connecteurs aux couleurs du code des fibres, poses le long du trace
  const JALONS = [0.1, 0.27, 0.44, 0.61, 0.78, 0.92]
  const connecteurs = JALONS.map((u, i) => {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: COULEURS_FIBRES[i % COULEURS_FIBRES.length], emissive: COULEURS_FIBRES[i % COULEURS_FIBRES.length], emissiveIntensity: 0.35 })
    )
    dome.position.copy(courbe.getPointAt(u)).setY(0.4)
    dome.scale.setScalar(0.001)
    scene.add(dome)
    return { dome, u }
  })

  jalon('fibre')
  // ---- Deploiement : branches qui partent du trace principal dans d autres rues ----
  const branches = (donnees.branches ?? []).map((b) => {
    const pts: THREE.Vector3[] = []
    // Avant : branches a 3,5 m du sol
    for (let i = 0; i < b.points.length; i += 2) pts.push(new THREE.Vector3(b.points[i], 1.2, b.points[i + 1]))
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const n = Math.max(40, Math.floor(c.getLength() / 4))
    // const geo = new THREE.TubeGeometry(c, n, 2.6, RADIAL, false)  (avant : tube de 5 m de diametre a 3,5 m, il barrait les gros plans)
    const geo = new THREE.TubeGeometry(c, n, 0.8, RADIAL, false)
    geo.setDrawRange(0, 0)
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#FF9248', toneMapped: false })))
    return { u: b.u, geo, n }
  })

  jalon('branches')
  // ---- Raccordements d abonnes : un cable monte du reseau jusqu au toit des maisons voisines ----
  // Sources : le trace principal et les branches, chacune avec le moment ou la lumiere y passe
  const sources: { point: THREE.Vector3; u: number }[] = []
  courbe.getSpacedPoints(Math.floor(longueurFibre / 10)).forEach((point, k, tous) => sources.push({ point, u: k / (tous.length - 1) }))
  for (const b of donnees.branches ?? []) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < b.points.length; i += 2) pts.push(new THREE.Vector3(b.points[i], 3.5, b.points[i + 1]))
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    c.getSpacedPoints(Math.floor(c.getLength() / 10)).forEach((point, k, tous) => sources.push({ point, u: b.u + 0.16 * (k / (tous.length - 1)) }))
  }
  // Grille de 70 m : chaque maison ne cherche sa source que dans les cases voisines
  // (avant : comparee a tous les points de fibre, 0,6 s au chargement)
  const CASE = 70
  const grille = new Map<string, { point: THREE.Vector3; u: number }[]>()
  for (const src of sources) {
    const cle = Math.floor(src.point.x / CASE) + ',' + Math.floor(src.point.z / CASE)
    if (!grille.has(cle)) grille.set(cle, [])
    grille.get(cle)!.push(src)
  }
  // Cable de branchement : se deroule du poteau vers la maison avec une lumiere en tete,
  // puis vire au vert quand l abonne est en service
  const materiauCable = () =>
    new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uVert: { value: 0 }, uTemps: uniformesFibre.uTemps },
      toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float uK; uniform float uVert; uniform float uTemps; varying vec2 vUv;
        void main(){
          float d = uK - vUv.x;
          if (d < 0.0) discard;
          float tete = exp(-d * 18.0) * (1.0 - uVert);
          // Une fois en service, de petites impulsions vertes montent vers la maison
          float impulsion = smoothstep(0.85, 1.0, fract(vUv.x * 3.0 - uTemps * 0.9)) * uVert;
          vec3 c = mix(vec3(0.98, 0.45, 0.12), vec3(0.22, 0.80, 0.48), uVert);
          c += vec3(1.0, 0.88, 0.65) * tete * 1.3 + vec3(0.7, 1.0, 0.8) * impulsion * 0.6;
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  // Poteaux et boitiers (PBO) en bord de rue, d ou partent les branchements
  const posPoteaux: THREE.Vector3[] = []
  // Direction de la rue vue du poteau (oppose a la maison) : le boitier et le technicien y font face
  const dirRue: THREE.Vector3[] = []
  // Ancienne balise : losange vert plat (#3DDC84, lisere blanc 7 px), faisceau droit CylinderGeometry(1.6, 1.6, 90),
  // pin a 0.036 x 0.045 toujours plein format, sans onde ni effacement apres passage de la fibre.
  // Balise d un batiment raccorde, facon jeu video : faisceau effile, onde sur le toit et
  // marqueur flottant, visible a travers les batiments et de taille constante a l ecran
  const texturePin = (() => {
    const c = document.createElement('canvas')
    c.width = 160
    c.height = 200
    const ctx = c.getContext('2d')!
    ctx.translate(80, 78)
    // Pointe sous le losange : la balise designe le toit
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(-11, 62)
    ctx.lineTo(11, 62)
    ctx.lineTo(0, 84)
    ctx.closePath()
    ctx.fill()
    // Losange aux angles arrondis, liseré blanc, degrade vert
    const losange = () => {
      ctx.beginPath()
      ctx.moveTo(0, -60)
      ctx.lineTo(60, 0)
      ctx.lineTo(0, 60)
      ctx.lineTo(-60, 0)
      ctx.closePath()
    }
    ctx.lineJoin = 'round'
    ctx.shadowColor = 'rgba(0,30,15,0.45)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    losange()
    ctx.lineWidth = 18
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    const g = ctx.createLinearGradient(0, -60, 0, 60)
    g.addColorStop(0, '#6EF0A6')
    g.addColorStop(1, '#17A35A')
    losange()
    ctx.fillStyle = g
    ctx.fill()
    // Reflet sur la moitie haute
    ctx.save()
    losange()
    ctx.clip()
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(-60, -60, 120, 52)
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(-20, 2)
    ctx.lineTo(-6, 16)
    ctx.lineTo(22, -14)
    ctx.lineWidth = 11
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const textureFaisceau = (() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, 'rgba(80,235,150,0)')
    g.addColorStop(0.6, 'rgba(80,235,150,0.35)')
    g.addColorStop(1, 'rgba(120,255,180,0.9)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 256)
    return new THREE.CanvasTexture(c)
  })()
  // Effile vers le haut : un trait de lumiere, pas un tuyau
  const geoFaisceau = new THREE.CylinderGeometry(0.35, 2, 110, 12, 1, true)
  geoFaisceau.translate(0, 55, 0)
  // Melange normal : en additif, sur une ville claire, la colonne virait au blanc
  const matFaisceau = new THREE.MeshBasicMaterial({ map: textureFaisceau, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false })
  const matPin = new THREE.SpriteMaterial({ map: texturePin, depthTest: false, sizeAttenuation: false, transparent: true })
  // Onde qui s elargit sur le toit au moment du raccordement
  const geoOnde = new THREE.RingGeometry(0.82, 1, 48)
  geoOnde.rotateX(-Math.PI / 2)
  type Raccordement = {
    u: number
    cable: THREE.ShaderMaterial
    voyant: THREE.Mesh
    faisceau: THREE.Mesh
    pin: THREE.Sprite
    onde: THREE.Mesh
    hauteur: number
    eclat: number
    recent: number
    plage: [number, number]
    eclatApplique: number
  }
  const raccordements: Raccordement[] = []
  // Allume (0..1) tout un batiment dans le maillage commun
  const allumer = (plage: [number, number], valeur: number) => {
    const tab = bati.allume.array as Float32Array
    tab.fill(valeur, plage[0], plage[1])
    bati.allume.needsUpdate = true
  }
  const centreBatiment = (coords: number[]) => {
    let cx = 0
    let cz = 0
    for (let k = 0; k < coords.length; k += 2) {
      cx += coords[k]
      cz += coords[k + 1]
    }
    return [cx / (coords.length / 2), cz / (coords.length / 2)]
  }
  const gris = couleur('#8C8C8C')
  const vert = couleur('#3DDC84')
  const maximum = leger ? 70 : 160
  for (let i = 0; i < donnees.batiments.length && raccordements.length < maximum; i++) {
    if (hasard(i + 17) > 0.7) continue
    const [h, , ...coords] = donnees.batiments[i]
    const [cx, cz] = centreBatiment(coords)
    let meilleure: { point: THREE.Vector3; u: number } | null = null
    let dmin = Infinity
    // for (const src of sources) { ... }  (avant : toutes les sources)
    const gx = Math.floor(cx / CASE)
    const gz = Math.floor(cz / CASE)
    for (let ox = -1; ox <= 1; ox++)
      for (let oz = -1; oz <= 1; oz++)
        for (const src of grille.get(gx + ox + ',' + (gz + oz)) ?? []) {
          const d = Math.hypot(src.point.x - cx, src.point.z - cz)
          if (d < dmin) {
            dmin = d
            meilleure = src
          }
        }
    // Les maisons en bordure du reseau, comme un vrai raccordement d abonne
    if (!meilleure || dmin > 70 || dmin < 8) continue
    // Ancien raccordement : cable en arc de la rue au toit, sans poteau
    // const depuis = meilleure.point.clone()
    // const arc = new THREE.QuadraticBezierCurve3(depuis, new THREE.Vector3((depuis.x + cx) / 2, h + 10, (depuis.z + cz) / 2), toitPt)
    // const geo = new THREE.TubeGeometry(arc, 14, 1, 4, false)
    // scene.add(new THREE.Mesh(geo, materiauCable))  (materiauCable : MeshBasicMaterial #FFB27A)
    // Le poteau se dresse au bord de la rue, cote maison ; le cable pend jusqu au toit
    const versMaison = new THREE.Vector3(cx - meilleure.point.x, 0, cz - meilleure.point.z).normalize()
    const pied = meilleure.point.clone().addScaledVector(versMaison, 7).setY(0)
    posPoteaux.push(pied)
    dirRue.push(versMaison.clone().negate())
    const depuis = pied.clone().setY(8.6)
    const toitPt = new THREE.Vector3(cx, h + 0.6, cz)
    const milieu = depuis.clone().lerp(toitPt, 0.5)
    milieu.y = Math.max(Math.min(depuis.y, toitPt.y) - 3 - dmin * 0.04, 2)
    const pendant = new THREE.CatmullRomCurve3([depuis, milieu, toitPt])
    const cable = materiauCable()
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(pendant, 20, 0.12, 6, false), cable))
    const voyant = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 8), new THREE.MeshBasicMaterial({ color: gris.clone(), toneMapped: false }))
    voyant.position.copy(toitPt)
    // Le batiment allume en vert dit deja « raccorde » ; de pres, la boule cachait le ciel
    voyant.visible = false
    scene.add(voyant)
    const faisceau = new THREE.Mesh(geoFaisceau, matFaisceau)
    faisceau.position.copy(toitPt)
    faisceau.scale.set(1, 0.001, 1)
    const pin = new THREE.Sprite(matPin)
    pin.renderOrder = 10
    pin.center.set(0.5, 0)
    pin.position.set(cx, h + 112, cz)
    pin.scale.set(0, 0, 1)
    const onde = new THREE.Mesh(geoOnde, new THREE.MeshBasicMaterial({ color: '#5BEA9C', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }))
    onde.position.copy(toitPt).setY(h + 0.9)
    onde.visible = false
    scene.add(faisceau, pin, onde)
    raccordements.push({ u: meilleure.u, cable, voyant, faisceau, pin, onde, hauteur: h + 112, eclat: 0, recent: 0, plage: bati.plages[i], eclatApplique: 0 })
  }

  // Poteau bois de distribution, comme sur le terrain a Dakar : fut effile veine, traverse,
  // colliers acier, boitier PBO detaille, lovee de cable et descente le long du fut.
  const textureBois = (() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#7A5A3C'
    ctx.fillRect(0, 0, 64, 256)
    for (let k = 0; k < 26; k++) {
      ctx.strokeStyle = `rgba(${40 + hasard(k) * 30},${26 + hasard(k + 1) * 20},12,${0.25 + hasard(k + 2) * 0.3})`
      ctx.lineWidth = 1 + hasard(k + 3) * 2
      ctx.beginPath()
      const x = hasard(k + 4) * 64
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + 4, 80, x - 4, 170, x + 2, 256)
      ctx.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 3)
    return t
  })()
  // Ancien poteau : simple cylindre gris et boitier blanc
  // const geoPoteau = new THREE.CylinderGeometry(0.22, 0.32, 9, 6).translate(0, 4.5, 0)
  // const poteaux = new THREE.InstancedMesh(geoPoteau, new THREE.MeshLambertMaterial({ color: '#8A8F94' }), posPoteaux.length)
  // const boitiers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 1.7, 0.8).translate(0, 7.4, 0.45), new THREE.MeshLambertMaterial({ color: '#F1F3F4' }), posPoteaux.length)
  const geoPoteau = new THREE.CylinderGeometry(0.17, 0.27, 9.6, 12).translate(0, 4.8, 0)
  const poteaux = new THREE.InstancedMesh(geoPoteau, new THREE.MeshLambertMaterial({ map: textureBois }), posPoteaux.length)
  const boitiers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1.4, 0.42).translate(0, 7.4, 0.42), new THREE.MeshLambertMaterial({ color: '#E9ECEE' }), posPoteaux.length)
  // Pieces du poteau, toutes posees dans le repere du poteau (z vers la rue)
  const piecesPoteau = [
    // Traverse en haut du fut
    new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.14, 0.14).translate(0, 9.1, 0), new THREE.MeshLambertMaterial({ color: '#5E4630' }), posPoteaux.length),
    // Colliers acier qui tiennent le boitier
    new THREE.InstancedMesh(
      mergeGeometries([new THREE.CylinderGeometry(0.255, 0.255, 0.08, 14).translate(0, 7.9, 0), new THREE.CylinderGeometry(0.265, 0.265, 0.08, 14).translate(0, 6.9, 0)]),
      new THREE.MeshLambertMaterial({ color: '#B8BEC4' }),
      posPoteaux.length
    ),
    // Bande verte SAFIBRE et joint du couvercle du boitier
    new THREE.InstancedMesh(new THREE.BoxGeometry(1.01, 0.12, 0.43).translate(0, 7.95, 0.42), new THREE.MeshLambertMaterial({ color: '#417F62' }), posPoteaux.length),
    new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, 0.03, 0.44).translate(0, 7.62, 0.42), new THREE.MeshLambertMaterial({ color: '#A9AFB4' }), posPoteaux.length),
    // Presse-etoupes sous le boitier, lovee de cable et descente le long du fut
    new THREE.InstancedMesh(
      mergeGeometries([
        new THREE.BoxGeometry(0.75, 0.12, 0.28).translate(0, 6.64, 0.42),
        new THREE.TorusGeometry(0.36, 0.035, 6, 22).translate(0, 5.6, 0.32),
        new THREE.CylinderGeometry(0.03, 0.03, 6.3, 5).translate(0.14, 3.45, 0.27),
      ]),
      new THREE.MeshLambertMaterial({ color: '#1E2328' }),
      posPoteaux.length
    ),
  ]
  posPoteaux.forEach((pt, i) => {
    // m.makeTranslation(pt.x, 0, pt.z) (avant : tous les boitiers face au sud)
    m.makeRotationY(Math.atan2(dirRue[i].x, dirRue[i].z)).setPosition(pt.x, 0, pt.z)
    poteaux.setMatrixAt(i, m)
    boitiers.setMatrixAt(i, m)
    for (const piece of piecesPoteau) piece.setMatrixAt(i, m)
  })
  poteaux.castShadow = boitiers.castShadow = !leger
  for (const piece of piecesPoteau) piece.castShadow = !leger
  scene.add(poteaux, boitiers, ...piecesPoteau)

  jalon('raccordements')
  // ---- Arrivee : le siege SAFIBRE, avenue Habib Bourguiba ----
  // Le batiment le plus proche du point des bureaux devient le siege : il s allume, un dernier
  // cable le relie au bout de la fibre, une grande balise a l etiquette SAFIBRE se pose dessus.
  const [bx, bz] = donnees.bureaux
  let siege = 0
  let dSiege = Infinity
  donnees.batiments.forEach(([, , ...coords], i) => {
    const [cx, cz] = centreBatiment(coords)
    const d = Math.hypot(cx - bx, cz - bz)
    if (d < dSiege) {
      dSiege = d
      siege = i
    }
  })
  const [sx, sz] = centreBatiment(donnees.batiments[siege].slice(2))
  // Le batiment OSM est remplace par un vrai siege : on l aplatit dans le maillage commun
  {
    const position = bati.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const [debut, fin] = bati.plages[siege]
    for (let k = debut; k < fin; k++) position.setY(k, Math.min(position.getY(k), 0.05))
    position.needsUpdate = true
  }
  // Orientation et emprise : on suit l arete la plus longue du batiment d origine
  const emprise = (() => {
    const c = donnees.batiments[siege].slice(2)
    let angle = 0
    let meilleure = 0
    for (let k = 0; k < c.length; k += 2) {
      const dx = c[(k + 2) % c.length] - c[k]
      const dz = c[(k + 3) % c.length] - c[k + 1]
      const l = Math.hypot(dx, dz)
      if (l > meilleure) {
        meilleure = l
        angle = Math.atan2(dz, dx)
      }
    }
    let largeur = 0
    let profondeur = 0
    for (let k = 0; k < c.length; k += 2) {
      const x = c[k] - sx
      const z = c[k + 1] - sz
      largeur = Math.max(largeur, Math.abs(x * Math.cos(angle) + z * Math.sin(angle)))
      profondeur = Math.max(profondeur, Math.abs(-x * Math.sin(angle) + z * Math.cos(angle)))
    }
    return { angle, largeur: THREE.MathUtils.clamp(largeur * 2, 22, 40), profondeur: THREE.MathUtils.clamp(profondeur * 2, 16, 28) }
  })()
  const ETAGES_SIEGE = 8
  const hSiege = ETAGES_SIEGE * 3.4
  // Facade du siege : bandeaux blancs et vitrage teinte vert, une travee par carreau
  const textureSiege = (eclaire: boolean) => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    ctx.fillStyle = eclaire ? '#000000' : '#F4F5F3'
    ctx.fillRect(0, 0, 128, 128)
    if (eclaire) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(10, 26, 108, 84)
    } else {
      const vitre = ctx.createLinearGradient(0, 26, 0, 110)
      vitre.addColorStop(0, '#5F8F80')
      vitre.addColorStop(1, '#2B4F45')
      ctx.fillStyle = vitre
      ctx.fillRect(10, 26, 108, 84)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(62, 26, 4, 84)
    }
    const t = new THREE.CanvasTexture(c)
    if (!eclaire) t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }
  // Les etages s allument un a un, du bas vers le haut, quand le reseau arrive
  const uniformesSiege = { uNiveau: { value: 0 } }
  const materiauFacade = (travees: number) => {
    const map = textureSiege(false)
    const emissiveMap = textureSiege(true)
    map.repeat.set(travees, ETAGES_SIEGE)
    emissiveMap.repeat.copy(map.repeat)
    const mat = new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: '#FFE7B8', emissiveIntensity: 0, roughness: 0.35, metalness: 0.1 })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uNiveau = uniformesSiege.uNiveau
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uNiveau;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance *= step(vMapUv.y / ${ETAGES_SIEGE.toFixed(1)}, uNiveau);`)
    }
    return mat
  }
  const toitSiege = new THREE.MeshStandardMaterial({ color: '#E9ECEA', roughness: 0.8 })
  const siegeGroupe = new THREE.Group()
  siegeGroupe.position.set(sx, 0, sz)
  siegeGroupe.rotation.y = -emprise.angle
  {
    const { largeur, profondeur } = emprise
    const travL = Math.max(3, Math.round(largeur / 4))
    const travP = Math.max(3, Math.round(profondeur / 4))
    const facadeL = materiauFacade(travL)
    const facadeP = materiauFacade(travP)
    // Ordre des faces d une boite : +x, -x, +y, -y, +z, -z
    const corps = new THREE.Mesh(new THREE.BoxGeometry(largeur, hSiege, profondeur).translate(0, hSiege / 2, 0), [facadeP, facadeP, toitSiege, toitSiege, facadeL, facadeL])
    corps.castShadow = corps.receiveShadow = !leger
    // Couronne verte aux couleurs de la marque, et socle vitre en retrait
    const couronne = new THREE.Mesh(
      new THREE.BoxGeometry(largeur + 1.2, 2.4, profondeur + 1.2).translate(0, hSiege + 1.2, 0),
      new THREE.MeshStandardMaterial({ color: '#417F62', roughness: 0.5 })
    )
    const filet = new THREE.Mesh(
      new THREE.BoxGeometry(largeur + 1.3, 0.5, profondeur + 1.3).translate(0, hSiege + 0.2, 0),
      new THREE.MeshBasicMaterial({ color: '#E46B22', toneMapped: false })
    )
    const parvis = new THREE.Mesh(new THREE.BoxGeometry(largeur + 16, 0.3, profondeur + 16).translate(0, 0.15, 0), new THREE.MeshStandardMaterial({ color: '#D9DCD8', roughness: 0.9 }))
    parvis.receiveShadow = !leger
    // Enseigne sur le toit, lisible des deux cotes
    const enseigneTexture = (() => {
      const c = document.createElement('canvas')
      c.width = 1024
      c.height = 256
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(8, 8, 1008, 240, 36)
      ctx.fill()
      ctx.font = '800 150px Montserrat, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#417F62'
      ctx.fillText('SAFIBRE', 512, 136)
      // Les points de couleur du logo : le code des fibres
      COULEURS_FIBRES.forEach((teinte, i) => {
        ctx.fillStyle = teinte
        ctx.beginPath()
        ctx.arc(262 + i * 100, 40, 11, 0, Math.PI * 2)
        ctx.fill()
      })
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      return t
    })()
    const largeurEnseigne = Math.min(largeur * 0.85, 30)
    const enseigne = new THREE.Mesh(
      new THREE.PlaneGeometry(largeurEnseigne, largeurEnseigne / 4).translate(0, hSiege + 2.4 + largeurEnseigne / 8 + 0.6, 0),
      new THREE.MeshBasicMaterial({ map: enseigneTexture, toneMapped: false, side: THREE.FrontSide })
    )
    const dos = enseigne.clone()
    dos.rotation.y = Math.PI
    siegeGroupe.add(parvis, corps, couronne, filet, enseigne, dos)
  }
  scene.add(siegeGroupe)
  const materiauxSiege: THREE.MeshStandardMaterial[] = []
  siegeGroupe.traverse((o) => {
    if (o instanceof THREE.Mesh && Array.isArray(o.material)) o.material.forEach((mt) => mt.emissiveMap && materiauxSiege.push(mt))
  })
  const finFibre = courbe.getPointAt(1)
  const cableSiege = new THREE.TubeGeometry(
    new THREE.QuadraticBezierCurve3(finFibre.clone(), new THREE.Vector3((finFibre.x + sx) / 2, 2.5, (finFibre.z + sz) / 2), new THREE.Vector3(sx, 2.5, sz)),
    24,
    2.2,
    6,
    false
  )
  cableSiege.setDrawRange(0, 0)
  scene.add(new THREE.Mesh(cableSiege, new THREE.MeshBasicMaterial({ color: '#FF9248', toneMapped: false })))
  const colonne = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 4, 300, 20, 1, true).translate(0, 150, 0),
    new THREE.MeshBasicMaterial({ map: textureFaisceau, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false })
  )
  colonne.position.set(sx, hSiege + 0.5, sz)
  colonne.scale.y = 0.001
  // scene.add(colonne)  (retire de la scene : la colonne traversait l enseigne du siege ; ancienne colonne CylinderGeometry(9, 9, 160), opacite 0.55)
  // Trois ondes decalees au pied du siege, qui repartent en boucle une fois arrive
  const ondesSiege = [0, 1, 2].map(() => {
    const o = new THREE.Mesh(geoOnde, new THREE.MeshBasicMaterial({ color: '#5BEA9C', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }))
    o.position.set(sx, 1.2, sz)
    scene.add(o)
    return o
  })
  // Etiquette : carte blanche, coche verte, nom et adresse, pointe vers le batiment
  const textureEtiquette = (() => {
    const c = document.createElement('canvas')
    c.width = 560
    c.height = 210
    const ctx = c.getContext('2d')!
    ctx.shadowColor = 'rgba(0,30,15,0.35)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 6
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(20, 14, 520, 140, 70)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(258, 150)
    ctx.lineTo(302, 150)
    ctx.lineTo(280, 186)
    ctx.closePath()
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = '#417F62'
    ctx.beginPath()
    ctx.arc(90, 84, 46, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(70, 86)
    ctx.lineTo(84, 100)
    ctx.lineTo(111, 70)
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#030303'
    ctx.font = '800 54px Montserrat, sans-serif'
    ctx.fillText('SAFIBRE', 158, 88)
    ctx.fillStyle = '#E46B22'
    ctx.font = '700 22px Montserrat, sans-serif'
    ctx.fillText('RÉSEAU EN SERVICE', 160, 122)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const etiquette = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureEtiquette, transparent: true, opacity: 0, depthTest: false, sizeAttenuation: false }))
  etiquette.renderOrder = 11
  etiquette.center.set(0.5, 0)
  etiquette.position.set(sx, hSiege + 34, sz)
  etiquette.scale.set(0, 0, 1)
  scene.add(etiquette)

  jalon('siege')
  // ---- Equipes au travail : techniciens en gilet, camionnette et cones ----
  // Une equipe suit la tete de la fibre (pose), un technicien se tient au poteau des
  // raccordements recents, deux agents accueillent la fibre au siege. Silhouettes simples,
  // agrandies d un tiers pour rester lisibles a la hauteur de la camera.
  const NB_TETE = 4
  const NB_POTEAUX = leger ? 4 : 8
  const NB_SIEGE = 2
  const NB_AGENTS = NB_TETE + NB_POTEAUX + NB_SIEGE
  const partie = (geo: THREE.BufferGeometry, teinte: string) => {
    const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: teinte }), NB_AGENTS)
    im.castShadow = !leger
    im.frustumCulled = false
    scene.add(im)
    return im
  }
  // Origine aux pieds ; le haut du corps pivote a la hanche (0,9 m) pour se pencher
  const jambes = partie(new THREE.BoxGeometry(0.5, 0.9, 0.3).translate(0, 0.45, 0), '#27313F')
  const gilets = partie(new THREE.BoxGeometry(0.64, 0.78, 0.38).translate(0, 0.39, 0), '#ffffff')
  const tetes = partie(new THREE.SphereGeometry(0.2, 8, 6).translate(0, 0.98, 0), '#6B4A32')
  const casques = partie(new THREE.SphereGeometry(0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.04, 0), '#ffffff')
  for (let i = 0; i < NB_AGENTS; i++) {
    // Gilets orange (terrain) et quelques verts (bureau d etudes, chef d equipe)
    gilets.setColorAt(i, couleur(i % 4 === 3 ? '#417F62' : '#F28A2E'))
    casques.setColorAt(i, couleur(i % 4 === 3 ? '#FFFFFF' : '#F2C230'))
  }
  // Camionnette d intervention SAFIBRE : fourgon blanc, cabine vitree, roues, pare-chocs, feux,
  // bandes vert / orange, logo sur les flancs, galerie avec echelle, gyrophare orange.
  // Ancienne camionnette (premiere version) : caisse + cabine + pare-brise + bande + gyrophare en blocs
  // const caisse = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 4.2).translate(0, 1.6, -0.6), blanc)
  // const cabine = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 1.6).translate(0, 1.3, 2.3), blanc)
  // const pareBrise = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 0.1).translate(0, 1.85, 3.12), new THREE.MeshLambertMaterial({ color: '#3A4A55' }))
  // const bande = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.35, 4.24).translate(0, 1.4, -0.6), new THREE.MeshLambertMaterial({ color: '#417F62' }))
  // const gyrophare = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.3).translate(0, 2.9, 1.2), new THREE.MeshBasicMaterial({ color: '#FFB020', toneMapped: false }))
  const camionnette = new THREE.Group()
  const gyrophareCamion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.25).translate(0, 2.16, 1.55), new THREE.MeshBasicMaterial({ color: '#FF9A1F', toneMapped: false }))
  {
    const blanc = new THREE.MeshLambertMaterial({ color: '#F4F5F3' })
    const vitre = new THREE.MeshLambertMaterial({ color: '#2E3B45' })
    const gris = new THREE.MeshLambertMaterial({ color: '#3B4046' })
    const noir = new THREE.MeshLambertMaterial({ color: '#16181B' })
    const alu = new THREE.MeshLambertMaterial({ color: '#C9CED3' })
    const bloc = (l: number, h: number, p: number, x: number, y: number, z: number, materiau: THREE.Material) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p).translate(x, y, z), materiau)
      b.castShadow = !leger
      camionnette.add(b)
      return b
    }
    // Caisse, cabine, capot
    bloc(2.1, 2.2, 3.6, 0, 1.55, -0.8, blanc)
    bloc(2.1, 1.6, 1.5, 0, 1.25, 1.75, blanc)
    bloc(2.0, 0.6, 0.65, 0, 0.8, 2.78, blanc)
    // Pare-brise incline et vitres laterales de la cabine
    const pareBrise = bloc(1.9, 0.95, 0.05, 0, 0, 0, vitre)
    pareBrise.position.set(0, 1.72, 2.52)
    pareBrise.rotation.x = -0.38
    bloc(2.12, 0.55, 0.95, 0, 1.68, 1.72, vitre)
    // Bandes de la marque et pare-chocs
    bloc(2.13, 0.3, 3.62, 0, 1.0, -0.8, new THREE.MeshLambertMaterial({ color: '#417F62' }))
    bloc(2.13, 0.08, 3.62, 0, 1.2, -0.8, new THREE.MeshLambertMaterial({ color: '#E46B22' }))
    bloc(2.16, 0.24, 0.16, 0, 0.5, 3.12, gris)
    bloc(2.16, 0.24, 0.16, 0, 0.55, -2.65, gris)
    // Feux avant et arriere
    for (const cote of [-0.72, 0.72]) {
      bloc(0.36, 0.14, 0.04, cote, 0.92, 3.11, new THREE.MeshBasicMaterial({ color: '#FFF6D5', toneMapped: false }))
      bloc(0.16, 0.4, 0.04, cote * 1.3, 1.0, -2.62, new THREE.MeshBasicMaterial({ color: '#D7261E', toneMapped: false }))
    }
    // Roues avec jantes
    for (const x of [-1.0, 1.0])
      for (const z of [1.95, -1.65]) {
        const roue = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18).rotateZ(Math.PI / 2), noir)
        roue.position.set(x, 0.42, z)
        const jante = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12).rotateZ(Math.PI / 2), alu)
        jante.position.copy(roue.position)
        camionnette.add(roue, jante)
      }
    // Logo sur les deux flancs
    const logo = (() => {
      const c = document.createElement('canvas')
      c.width = 512
      c.height = 128
      const ctx = c.getContext('2d')!
      ctx.font = '800 70px Montserrat, sans-serif'
      ctx.fillStyle = '#417F62'
      ctx.textBaseline = 'middle'
      ctx.fillText('SAFIBRE', 14, 52)
      ctx.font = '600 24px Montserrat, sans-serif'
      ctx.fillStyle = '#E46B22'
      ctx.fillText('OPÉRATIONS TERRAIN', 18, 104)
      COULEURS_FIBRES.forEach((teinte, i) => {
        ctx.fillStyle = teinte
        ctx.beginPath()
        ctx.arc(330 + i * 26, 30, 7, 0, Math.PI * 2)
        ctx.fill()
      })
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    })()
    for (const cote of [-1, 1]) {
      const flanc = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshLambertMaterial({ map: logo, transparent: true }))
      flanc.position.set(cote * 1.062, 1.85, -0.8)
      flanc.rotation.y = cote * (Math.PI / 2)
      camionnette.add(flanc)
    }
    // Galerie de toit et echelle
    for (const x of [-0.8, 0.8]) bloc(0.06, 0.06, 3.4, x, 2.72, -0.8, alu)
    bloc(0.5, 0.05, 3.2, 0, 2.8, -0.8, alu)
    camionnette.add(gyrophareCamion)
    camionnette.scale.setScalar(1.2)
  }
  scene.add(camionnette)
  const touret = new THREE.Group()
  {
    const bois = new THREE.MeshLambertMaterial({ color: '#B98A5A' })
    const flasque = new THREE.CylinderGeometry(1.5, 1.5, 0.16, 20).rotateZ(Math.PI / 2)
    const gauche = new THREE.Mesh(flasque, bois)
    gauche.position.x = -0.65
    const droite = new THREE.Mesh(flasque, bois)
    droite.position.x = 0.65
    const enroulement = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.15, 20).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#F07A2A' }))
    const tambour = new THREE.Group()
    tambour.add(gauche, droite, enroulement)
    tambour.position.y = 1.55
    // Support en A de chaque cote
    const pied = new THREE.BoxGeometry(0.12, 1.9, 0.12)
    const metal = new THREE.MeshLambertMaterial({ color: '#4A5058' })
    for (const sx of [-0.95, 0.95])
      for (const sz of [-0.5, 0.5]) {
        const b = new THREE.Mesh(pied, metal)
        b.position.set(sx, 0.85, sz)
        b.rotation.x = sz > 0 ? -0.3 : 0.3
        touret.add(b)
      }
    touret.add(tambour)
    touret.scale.setScalar(1.35)
    for (const o of tambour.children) o.castShadow = !leger
  }
  scene.add(touret)
  const OFFSETS_CONES: [number, number][] = [[9, 4], [9, -4], [-11, 4], [-11, -4], [-1, 6.5]]
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(0.35, 0.95, 10).translate(0, 0.48, 0), new THREE.MeshLambertMaterial({ color: '#F26A1B' }), OFFSETS_CONES.length)
  cones.frustumCulled = false
  scene.add(cones)

  const mAgent = new THREE.Matrix4()
  const mHaut = new THREE.Matrix4()
  const qAgent = new THREE.Quaternion()
  const qPenche = new THREE.Quaternion()
  const echelleAgent = new THREE.Vector3(1.35, 1.35, 1.35)
  const zero = new THREE.Vector3(0.0001, 0.0001, 0.0001)
  const axeY = new THREE.Vector3(0, 1, 0)
  const axeX = new THREE.Vector3(1, 0, 0)
  const pAgent = new THREE.Vector3()
  const hanche = new THREE.Vector3()
  const echelleJambes = new THREE.Vector3()
  /**
   * Place un agent ; penche (0..1) incline le haut du corps vers l avant, accroupi (0..1)
   * replie les jambes : de quoi montrer quelqu un qui creuse, tire ou raccorde.
   */
  const placerAgent = (i: number, x: number, z: number, cap: number, penche: number, visible = true, accroupi = 0) => {
    if (!visible) {
      mAgent.compose(pAgent.set(0, -50, 0), qAgent.identity(), zero)
      for (const im of [jambes, gilets, tetes, casques]) im.setMatrixAt(i, mAgent)
      return
    }
    qAgent.setFromAxisAngle(axeY, cap)
    echelleJambes.copy(echelleAgent).setY(echelleAgent.y * (1 - 0.55 * accroupi))
    mAgent.compose(pAgent.set(x, 0.3, z), qAgent, echelleJambes)
    jambes.setMatrixAt(i, mAgent)
    // Haut du corps : pose sur la hanche puis incline autour d elle
    qPenche.setFromAxisAngle(axeX, penche * 0.9)
    hanche.set(0, 0.9 * echelleJambes.y, 0).applyQuaternion(qAgent).add(pAgent)
    mHaut.compose(hanche, qAgent.clone().multiply(qPenche), echelleAgent)
    gilets.setMatrixAt(i, mHaut)
    tetes.setMatrixAt(i, mHaut)
    casques.setMatrixAt(i, mHaut)
  }
  const tangente = new THREE.Vector3()
  const placerEquipes = (p: number, temps: number) => {
    animerTechnicien(temps)
    // Equipe de tete : de part et d autre du trace, juste derriere la lumiere
    const u = THREE.MathUtils.clamp(p, 0.001, 0.999)
    const ici = courbe.getPointAt(u)
    courbe.getTangentAt(u, tangente)
    tangente.setY(0).normalize()
    const cote = new THREE.Vector3(-tangente.z, 0, tangente.x)
    const capRoute = Math.atan2(tangente.x, tangente.z)
    const enChantier = p > 0.01 && p < 0.94
    // [avant, lateral, phase, accroupi, amplitude du geste] ; le 4e (gilet vert) est le chef d equipe
    const POSTES: [number, number, number, number, number][] = [
      [-2, 3.2, 0.2, 1, 0.35],
      [-7, 3.6, 1.4, 0, 0.8],
      [-4, -3.4, 2.6, 0.6, 0.6],
      [2, -5, 3.9, 0, 0.12],
    ]
    POSTES.forEach(([avant, lateral, phase, accroupi, amplitude], i) => {
      const x = ici.x + tangente.x * avant + cote.x * lateral
      const z = ici.z + tangente.z * avant + cote.z * lateral
      // Face au trace, et un geste regulier : raccorder, tirer le cable, controler
      const cap = Math.atan2(ici.x - x, ici.z - z)
      const geste = 0.15 + Math.max(0, Math.sin(temps * 2.6 + phase)) * amplitude
      // placerAgent(i, x, z, cap, geste, enChantier, accroupi)  (avant : silhouettes en blocs)
      void geste
      void accroupi
      placerAgent(i, x, z, cap, 0, false)
      poserEquipier(i, x, z, cap, temps, enChantier)
    })
    touret.visible = enChantier
    touret.position.set(ici.x - tangente.x * 11 + cote.x * 4.5, 0.3, ici.z - tangente.z * 11 + cote.z * 4.5)
    touret.rotation.y = capRoute + Math.PI / 2
    ;(touret.children[touret.children.length - 1] as THREE.Group).rotation.x = temps * 1.2
    camionnette.visible = enChantier
    camionnette.position.set(ici.x - tangente.x * 18 + cote.x * 9, 0.3, ici.z - tangente.z * 18 + cote.z * 9)
    camionnette.rotation.y = capRoute
    // ;(camionnette.children[4] as THREE.Mesh).visible = Math.sin(temps * 8) > 0  (ancienne camionnette)
    gyrophareCamion.visible = Math.sin(temps * 8) > 0
    OFFSETS_CONES.forEach(([avant, lateral], i) => {
      mAgent.compose(
        pAgent.set(ici.x + tangente.x * avant + cote.x * lateral, 0.3, ici.z + tangente.z * avant + cote.z * lateral),
        qAgent.identity(),
        enChantier ? echelleAgent : zero
      )
      cones.setMatrixAt(i, mAgent)
    })
    cones.instanceMatrix.needsUpdate = true

    // Techniciens aux poteaux des raccordements recents
    let n = 0
    for (let r = 0; r < raccordements.length && n < NB_POTEAUX; r++) {
      const rc = raccordements[r]
      if (rc.recent < 0.15 || rc.eclat < 0.05) continue
      const pied = posPoteaux[r]
      const x = pied.x + 1.6
      const z = pied.z + 1.2
      placerAgent(NB_TETE + n, x, z, Math.atan2(pied.x - x, pied.z - z), 0.15 + Math.max(0, Math.sin(temps * 2 + r)) * 0.25)
      n++
    }
    for (; n < NB_POTEAUX; n++) placerAgent(NB_TETE + n, 0, 0, 0, 0, false)

    // Au siege : deux agents devant l entree une fois la fibre arrivee
    for (let k = 0; k < NB_SIEGE; k++) {
      const recul = emprise.profondeur / 2 + 5
      const ecart = (k - 0.5) * 3
      const x = sx + Math.sin(-emprise.angle) * recul + Math.cos(-emprise.angle) * ecart
      const z = sz + Math.cos(-emprise.angle) * recul - Math.sin(-emprise.angle) * ecart
      placerAgent(NB_TETE + NB_POTEAUX + k, x, z, -emprise.angle + Math.PI, 0, arriveeSiege > 0.3)
    }
    for (const im of [jambes, gilets, tetes, casques]) im.instanceMatrix.needsUpdate = true
  }

  jalon('equipes')
  // ---- Le technicien sur le poteau : le raccordement « vedette » du gros plan ----
  // On prend le raccordement qui se fait au milieu du film : echelle contre le poteau,
  // technicien perche qui travaille au boitier, un collegue tient l echelle en bas.
  // Ancien choix : le raccordement le plus proche de u = 0,49, sans regarder s il est cache
  // par un batiment (la camera finissait dans un mur).
  // const vedette = (() => { ... Math.abs(rc.u - 0.49) ... })()
  /** Distance libre (m) devant le poteau, cote rue, sur un eventail de directions. */
  const dansPolygone = (x: number, z: number, c: number[]) => {
    let dedans = false
    for (let a = 0, b = c.length - 2; a < c.length; b = a, a += 2) {
      if (c[a + 1] > z !== c[b + 1] > z && x < ((c[b] - c[a]) * (z - c[a + 1])) / (c[b + 1] - c[a + 1]) + c[a]) dedans = !dedans
    }
    return dedans
  }
  const degagement = (i: number) => {
    const pied = posPoteaux[i]
    const voisins = donnees.batiments
      .map((b) => b.slice(2))
      .filter((c) => Math.hypot(c[0] - pied.x, c[1] - pied.z) < 60)
    let libre = 16
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
      const d = dirRue[i].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a)
      for (let t = 2; t < libre; t += 0.5) {
        if (voisins.some((c) => dansPolygone(pied.x + d.x * t, pied.z + d.z * t, c))) {
          libre = t
          break
        }
      }
    }
    return libre
  }
  const { vedette, recul } = (() => {
    let meilleur = 0
    let score = -Infinity
    let libreMeilleur = 8
    raccordements.forEach((rc, i) => {
      if (rc.u < 0.44 || rc.u > 0.54) return
      const libre = degagement(i)
      // On privilegie l espace libre, puis la proximite du milieu du plan
      const note = libre - Math.abs(rc.u - 0.49) * 40
      if (note > score) {
        score = note
        meilleur = i
        libreMeilleur = libre
      }
    })
    return { vedette: meilleur, recul: THREE.MathUtils.clamp(libreMeilleur - 1.5, 6, 13) }
  })()
  const piedVedette = posPoteaux[vedette] ?? new THREE.Vector3()
  const capRue = dirRue[vedette] ? Math.atan2(dirRue[vedette].x, dirRue[vedette].z) : 0
  /** Point du repere du poteau (z vers la rue) en coordonnees du monde. */
  const autourPoteau = (x: number, y: number, z: number) =>
    new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), capRue).add(new THREE.Vector3(piedVedette.x, 0, piedVedette.z))
  // Ancien technicien (19/10, premiere version) : bloc a jambes uniques, bras raides
  // const silhouette = (gilet: string, casque: string) => {
    // const corps = new THREE.Group()
    // const jambesT = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.3).translate(0, 0.45, 0), new THREE.MeshLambertMaterial({ color: '#27313F' }))
    // const haut = new THREE.Group()
    // haut.position.y = 0.9
    // const buste = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.78, 0.38).translate(0, 0.39, 0), new THREE.MeshLambertMaterial({ color: gilet }))
    // // Bandes reflechissantes du gilet
    // const bande = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.07, 0.4).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#E8EDEF' }))
    // const tete = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8).translate(0, 0.98, 0), new THREE.MeshLambertMaterial({ color: '#6B4A32' }))
    // const casqueM = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.04, 0), new THREE.MeshLambertMaterial({ color: casque }))
    // // Bras : pivot a l epaule pour lever les mains vers le boitier
    // const bras = [-1, 1].map((cote) => {
      // const pivot = new THREE.Group()
      // pivot.position.set(cote * 0.4, 0.7, 0)
      // pivot.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, 0.15).translate(0, -0.31, 0), new THREE.MeshLambertMaterial({ color: gilet })))
      // haut.add(pivot)
      // return pivot
    // })
    // haut.add(buste, bande, tete, casqueM)
    // corps.add(jambesT, haut)
    // corps.scale.setScalar(1.25)
    // corps.traverse((o) => {
      // if (o instanceof THREE.Mesh) o.castShadow = !leger
    // })
    // return { corps, haut, bras }
  // }
  // // Le boitier (PBO) fait face a +z dans le repere du poteau : le technicien se place de ce cote
  // const perche = silhouette('#F28A2E', '#F2C230')
  // perche.corps.position.set(0, 5.2, 1.05)
  // perche.corps.rotation.y = Math.PI
  // // Harnais : la longe qui le tient au poteau
  // const longe = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 6, 24), new THREE.MeshLambertMaterial({ color: '#1E2328' }))
  // longe.rotation.x = Math.PI / 2
  // longe.position.set(0, 6.6, 0.45)
  // const aide = silhouette('#417F62', '#FFFFFF')
  // aide.corps.position.set(0.9, 0.3, 3.4)
  // aide.corps.rotation.y = Math.PI + 0.3
  // aide.bras.forEach((b) => (b.rotation.x = -1.2))
  /**
   * Technicien articule : jambes et bras a pivots (hanche, epaule, coude), gilet a bandes,
   * harnais croise, ceinture a outils, casque a visiere, gants et bottes.
   */
  const silhouette = (gilet: string, casque: string) => {
    const mat = (couleurM: string) => new THREE.MeshLambertMaterial({ color: couleurM })
    const pantalon = mat('#27313F')
    const noir = mat('#1C1F24')
    const peau = mat('#5A3A26')
    const manche = mat('#2B3A55')
    const corps = new THREE.Group()
    // Jambes : pivot a la hanche, botte au bout
    const jambes = [-1, 1].map((cote) => {
      const hanche = new THREE.Group()
      hanche.position.set(cote * 0.13, 0.92, 0)
      hanche.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.82, 0.22).translate(0, -0.41, 0), pantalon))
      hanche.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.34).translate(0, -0.86, 0.05), noir))
      corps.add(hanche)
      return hanche
    })
    corps.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.26).translate(0, 0.95, 0), pantalon))
    const haut = new THREE.Group()
    haut.position.y = 1
    // Buste : gilet, deux bandes reflechissantes, bretelles du harnais, ceinture a outils
    haut.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28).translate(0, 0.31, 0), mat(gilet)))
    for (const y of [0.2, 0.38]) haut.add(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.3).translate(0, y, 0), new THREE.MeshBasicMaterial({ color: '#E8EDEF' })))
    for (const cote of [-1, 1]) {
      const bretelle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.31), noir)
      bretelle.position.set(cote * 0.08, 0.32, 0)
      bretelle.rotation.z = cote * 0.38
      haut.add(bretelle)
    }
    haut.add(new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.1, 0.31).translate(0, 0.03, 0), mat('#3A2E24')))
    haut.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12).translate(0.24, -0.04, 0.12), mat('#4A3A2C')))
    // Tete : cou, visage, casque a visiere ; groupe a part pour lever les yeux
    const tete = new THREE.Group()
    tete.position.y = 0.62
    tete.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8).translate(0, 0.04, 0), peau))
    tete.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10).translate(0, 0.19, 0.01), peau))
    tete.add(new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.22, 0), mat(casque)))
    tete.add(new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.02, 16).translate(0, 0.22, 0.02), mat(casque)))
    tete.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.1).translate(0, 0.22, 0.17), mat(casque)))
    haut.add(tete)
    // Bras : epaule puis coude, gant au bout
    const bras = [-1, 1].map((cote) => {
      const epaule = new THREE.Group()
      epaule.position.set(cote * 0.31, 0.56, 0)
      epaule.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.13).translate(0, -0.17, 0), manche))
      const coude = new THREE.Group()
      coude.position.y = -0.33
      coude.add(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.11).translate(0, -0.15, 0), manche))
      coude.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.12).translate(0, -0.34, 0), noir))
      epaule.add(coude)
      haut.add(epaule)
      return { epaule, coude }
    })
    corps.add(haut)
    corps.scale.setScalar(1.15)
    corps.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = !leger
    })
    return { corps, haut, tete, bras, jambes }
  }
  // Le boitier (PBO) fait face a +z dans le repere du poteau : le technicien se place de ce cote
  const perche = silhouette('#F28A2E', '#F2C230')
  perche.corps.position.set(0, 5.05, 1.1)
  perche.corps.rotation.y = Math.PI
  // Sur l echelle : un pied un barreau plus haut
  perche.jambes[0].rotation.x = -0.55
  perche.jambes[1].rotation.x = 0.12
  // Soudeuse a fibre dans la main droite
  const soudeuse = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.16), new THREE.MeshLambertMaterial({ color: '#F2C230' }))
  soudeuse.position.y = -0.42
  perche.bras[1].coude.add(soudeuse)
  // Jarretiere : du presse-etoupe du boitier jusqu a ses mains
  const jarretiere = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.1, 6.6, 0.45), new THREE.Vector3(0.25, 6.45, 0.7), new THREE.Vector3(0.2, 7, 0.78)]), 12, 0.025, 5, false),
    new THREE.MeshLambertMaterial({ color: '#1E2328' })
  )
  // Harnais : la longe qui le tient au poteau, a hauteur de taille
  const longe = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 28), new THREE.MeshLambertMaterial({ color: '#1E2328' }))
  longe.rotation.x = Math.PI / 2
  longe.position.set(0, 6.25, 0.55)
  const aide = silhouette('#417F62', '#FFFFFF')
  aide.corps.position.set(0.75, 0.3, 3.45)
  aide.corps.rotation.y = Math.PI + 0.25
  // Il tient l echelle a deux mains et surveille son collegue
  aide.bras.forEach((b) => {
    b.epaule.rotation.x = -1.25
    b.coude.rotation.x = -0.45
  })
  aide.tete.rotation.x = -0.55
  aide.jambes[0].rotation.x = 0.15
  aide.jambes[1].rotation.x = -0.15

  // Equipe de tete, avec la meme silhouette articulee que le technicien
  // (avant : silhouettes instanciees en blocs, voir placerAgent). Chacun a son role.
  const equipeTete = [
    silhouette('#F28A2E', '#F2C230'), // raccorde, accroupi a la chambre de tirage
    silhouette('#F28A2E', '#F2C230'), // tire le cable depuis le touret
    silhouette('#F28A2E', '#F2C230'), // creuse la tranchee
    silhouette('#417F62', '#FFFFFF'), // chef d equipe, tablette en main
  ]
  // Pelle dans les mains du terrassier
  const pelle = new THREE.Group()
  pelle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6).translate(0, -0.5, 0), new THREE.MeshLambertMaterial({ color: '#8A6A4A' })))
  pelle.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.03).translate(0, -1.3, 0), new THREE.MeshLambertMaterial({ color: '#5B6168' })))
  pelle.position.y = -0.36
  equipeTete[2].bras[1].coude.add(pelle)
  // Tablette du chef d equipe
  const tablette = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.02), new THREE.MeshLambertMaterial({ color: '#20262C' }))
  tablette.position.set(0, -0.38, 0.06)
  tablette.rotation.x = -1.1
  equipeTete[3].bras[0].coude.add(tablette)
  // Chambre de tirage ouverte, ou l on raccorde : cadre beton, fond sombre, tampon pose a cote
  const chambre = new THREE.Group()
  {
    const beton = new THREE.MeshLambertMaterial({ color: '#B9B4AA' })
    chambre.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 1).translate(0, 0.11, 0), beton))
    chambre.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.24, 0.76).translate(0, 0.12, 0), new THREE.MeshBasicMaterial({ color: '#141618' })))
    const tampon = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.76), new THREE.MeshLambertMaterial({ color: '#4B5056' }))
    tampon.position.set(1.3, 0.06, 0)
    chambre.add(tampon)
  }
  for (const a of equipeTete) scene.add(a.corps)
  scene.add(chambre)
  /** Pose et geste de chaque equipier, autour de la tete de la fibre. */
  const poserEquipier = (i: number, x: number, z: number, cap: number, temps: number, visible: boolean) => {
    const a = equipeTete[i]
    a.corps.visible = visible
    if (i === 0) chambre.visible = visible
    if (!visible) return
    a.corps.position.set(x, 0.3, z)
    a.corps.rotation.y = cap
    const t = temps
    if (i === 0) {
      // Accroupi, penche sur la chambre, les mains dedans
      a.corps.position.y = 0.3 - 0.42
      a.jambes[0].rotation.x = -1.35
      a.jambes[1].rotation.x = -1.1
      a.haut.rotation.x = 0.55
      a.bras.forEach((b, k) => {
        b.epaule.rotation.x = -0.75 + Math.sin(t * 3 + k) * 0.15
        b.coude.rotation.x = -0.55
      })
      a.tete.rotation.x = 0.3
      chambre.visible = true
      chambre.position.set(x + Math.sin(cap) * 1.1, 0.3, z + Math.cos(cap) * 1.1)
      chambre.rotation.y = cap
    } else if (i === 1) {
      // Tire le cable : jambes ecartees, buste en arriere, a-coups reguliers
      a.jambes[0].rotation.x = 0.35
      a.jambes[1].rotation.x = -0.3
      a.haut.rotation.x = -0.18 + Math.max(0, Math.sin(t * 2)) * -0.12
      a.bras.forEach((b) => {
        b.epaule.rotation.x = -1.35 + Math.sin(t * 2) * 0.12
        b.coude.rotation.x = -0.15
      })
    } else if (i === 2) {
      // Creuse : le buste plonge et remonte avec la pelle
      const coup = Math.max(0, Math.sin(t * 2.4))
      a.jambes[0].rotation.x = 0.25
      a.jambes[1].rotation.x = -0.2
      a.haut.rotation.x = 0.3 + coup * 0.45
      a.bras[0].epaule.rotation.x = -0.7 - coup * 0.4
      a.bras[1].epaule.rotation.x = -0.5 - coup * 0.5
      a.bras.forEach((b) => (b.coude.rotation.x = -0.5))
    } else {
      // Chef d equipe : consulte sa tablette, leve parfois les yeux vers l equipe
      a.bras[0].epaule.rotation.x = -0.75
      a.bras[0].coude.rotation.x = -1.15
      a.bras[1].epaule.rotation.x = -0.1
      a.bras[1].coude.rotation.x = -0.2
      a.tete.rotation.x = Math.sin(t * 0.5) > 0.3 ? -0.05 : 0.45
      a.haut.rotation.y = Math.sin(t * 0.4) * 0.2
    }
  }
  // Echelle appuyee au poteau, pied a 2,6 m
  const echelle = new THREE.Group()
  {
    const alu = new THREE.MeshLambertMaterial({ color: '#C9CED3' })
    const longueur = 8
    for (const cote of [-0.3, 0.3]) {
      const montant = new THREE.Mesh(new THREE.BoxGeometry(0.08, longueur, 0.08).translate(0, longueur / 2, 0), alu)
      montant.position.x = cote
      echelle.add(montant)
    }
    for (let k = 1; k < 16; k++) {
      const barreau = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), alu)
      barreau.position.y = k * 0.5
      echelle.add(barreau)
    }
    echelle.position.set(0, 0.3, 2.6)
    echelle.rotation.x = -Math.asin(2.3 / longueur)
    echelle.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = !leger
    })
  }
  // Petit voyant sur le boitier : rouge pendant l intervention, vert une fois l abonne en service
  const voyantPbo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#FF3B30', toneMapped: false }))
  voyantPbo.position.set(0.4, 7.9, 0.9)
  const vedetteGroupe = new THREE.Group()
  vedetteGroupe.add(perche.corps, longe, jarretiere, aide.corps, echelle, voyantPbo)
  vedetteGroupe.visible = posPoteaux.length > 0
  vedetteGroupe.position.set(piedVedette.x, 0, piedVedette.z)
  vedetteGroupe.rotation.y = capRue
  scene.add(vedetteGroupe)
  const animerTechnicien = (temps: number) => {
    // Mains levees vers le boitier, petits gestes de soudure / connexion
    // perche.bras[0].rotation.x = -2.2 + Math.sin(temps * 3.1) * 0.18  (ancienne silhouette)
    // perche.bras[1].rotation.x = -2.0 + Math.sin(temps * 2.3 + 1) * 0.25
    // Main gauche au boitier, main droite tient la soudeuse ; il regarde ce qu il fait
    perche.bras[0].epaule.rotation.x = -2.05 + Math.sin(temps * 3.1) * 0.12
    perche.bras[0].coude.rotation.x = -0.55 + Math.sin(temps * 4.2) * 0.15
    perche.bras[1].epaule.rotation.x = -1.45 + Math.sin(temps * 2.3 + 1) * 0.08
    perche.bras[1].coude.rotation.x = -0.95
    perche.haut.rotation.x = -0.1 + Math.sin(temps * 1.3) * 0.04
    perche.tete.rotation.x = -0.25 + Math.sin(temps * 0.9) * 0.08
    aide.haut.rotation.y = Math.sin(temps * 0.6) * 0.12
    const rc = raccordements[vedette]
    if (rc) (voyantPbo.material as THREE.MeshBasicMaterial).color.set(rc.eclat > 0.5 ? '#3DDC84' : '#FF3B30')
  }

  jalon('technicien')
  // ---- Camera : survol de la cote, puis elle suit la fibre jusqu aux bureaux ----
  let progression = 0
  let arriveeSiege = 0
  let progressionAffichee = 0
  const posCamera = new THREE.Vector3(-1900, 900, 1400)
  const visee = new THREE.Vector3(0, 0, 0)
  const tmp = new THREE.Vector3()
  const dir = new THREE.Vector3()

  // Le depart de la fibre, cote Corniche : la mer est de ce cote-la
  const depart = courbe.getPointAt(0)

  /**
   * Un film en six plans, enchaines au fil du defilement. Chaque plan donne une
   * position et un point vise pour la progression p ; on fond un plan dans le
   * suivant sur une courte plage pour que les raccords soient doux.
   */
  type Plan = { fin: number; cadre: (p: number, temps: number) => [THREE.Vector3, THREE.Vector3] }
  const surFibre = (p: number) => {
    const u = Math.min(Math.max(p, 0.0001), 1)
    const ici = courbe.getPointAt(u)
    const devant = courbe.getPointAt(Math.min(u + 0.035, 1))
    dir.subVectors(devant, courbe.getPointAt(Math.max(u - 0.035, 0))).setY(0).normalize()
    return { ici, devant, cote: new THREE.Vector3(-dir.z, 0, dir.x) }
  }
  const PLANS: Plan[] = [
    // 1. Vue aerienne plongeante, facon maquette : la mer, la Corniche, puis rapprochement de la cote
    {
      fin: 0.12,
      cadre: (p) => {
        const k = THREE.MathUtils.smoothstep(p, 0, 0.12)
        return [
          // Ancienne ouverture, plus rasante : new THREE.Vector3(-1500, 620, 1150) -> (depart.x - 700, 300, depart.z + 520)
          new THREE.Vector3(-1350, 1250, 1250).lerp(new THREE.Vector3(depart.x - 650, 380, depart.z + 520), k),
          new THREE.Vector3(-200, 0, -300).lerp(depart, k),
        ]
      },
    },
    // 2. Rase-mottes sur la Corniche, au-dessus des pirogues, travelling lateral
    {
      fin: 0.3,
      cadre: (p) => {
        const { ici, devant, cote } = surFibre(p)
        return [ici.clone().addScaledVector(cote, -190).addScaledVector(dir, -60).setY(55), devant.clone().setY(10)]
      },
    },
    // 3. Poursuite derriere la lumiere de la fibre, avec un balancement dans les virages
    {
      fin: 0.44,
      cadre: (p) => {
        const { ici, devant, cote } = surFibre(p)
        const balancement = Math.sin(p * 18) * 110
        return [ici.clone().addScaledVector(dir, -230).addScaledVector(cote, balancement).setY(150), devant]
      },
    },
    // Premier essai de gros plan : l equipe au sol autour de la tete de la fibre (refuse : pas ca)
    // cadre: (p) => { const { ici, cote } = surFibre(p); const k = smoothstep(p, 0.44, 0.58)
    //   angle lerp(-0.9, 0.7), distance lerp(26, 19), hauteur lerp(12, 7) ; vise ici - dir * 4 a 1,8 m }
    // 3 bis. Gros plan sur le technicien perche au poteau pendant qu il raccorde la maison
    // (le texte « Sur le terrain » est affiche a ce moment-la)
    {
      fin: 0.58,
      cadre: (p) => {
        const k = THREE.MathUtils.smoothstep(p, 0.44, 0.58)
        const angle = THREE.MathUtils.lerp(0.35, 1.25, k)
        // Ancien cadrage, sans tenir compte des batiments :
        // const distance = THREE.MathUtils.lerp(15, 10, k)
        // const pos = new THREE.Vector3(piedVedette.x + Math.sin(angle) * distance, ..., piedVedette.z + Math.cos(angle) * distance)
        const distance = THREE.MathUtils.lerp(recul, recul * 0.8, k)
        const balayage = angle - 0.8
        const pos = autourPoteau(Math.sin(balayage) * distance, THREE.MathUtils.lerp(6.5, 8.5, k), Math.cos(balayage) * distance)
        return [pos, autourPoteau(0, 6.6, 0.6)]
      },
    },
    // 4. Vue plan : presque a la verticale, le trace se lit comme un plan du bureau d etudes
    {
      fin: 0.76,
      cadre: (p) => {
        const { ici } = surFibre(p)
        const angle = p * 2.2
        return [ici.clone().add(new THREE.Vector3(Math.cos(angle) * 90, 720, Math.sin(angle) * 90)), ici.clone()]
      },
    },
    // 5. Descente en pique vers les bureaux
    {
      fin: 0.9,
      cadre: (p) => {
        const { ici, cote } = surFibre(p)
        const k = THREE.MathUtils.smoothstep(p, 0.76, 0.9)
        const hauteur = THREE.MathUtils.lerp(420, 110, k)
        return [ici.clone().addScaledVector(dir, -180).addScaledVector(cote, 140).setY(hauteur), new THREE.Vector3(sx, hSiege * 0.5, sz)]
      },
    },
    // Ancienne orbite : autour de la colonne, rayon 260 -> 420, hauteur 120 -> 300, visee (bx, 60, bz)
    // 6. Orbite lente autour du siege allume : on reste assez pres pour lire l etiquette
    {
      fin: 1.01,
      cadre: (p, temps) => {
        const k = THREE.MathUtils.smoothstep(p, 0.9, 1)
        const angle = temps * 0.06 + k * 1.2
        const rayon = THREE.MathUtils.lerp(120, 105, k)
        return [new THREE.Vector3(sx + Math.cos(angle) * rayon, THREE.MathUtils.lerp(60, 48, k), sz + Math.sin(angle) * rayon), new THREE.Vector3(sx, hSiege * 0.75, sz)]
      },
    },
  ]
  const FONDU = 0.035

  const placerCamera = (p: number, temps: number, lissage: number) => {
    const i = PLANS.findIndex((plan) => p < plan.fin)
    const indice = i < 0 ? PLANS.length - 1 : i
    let [voulu, viseeVoulue] = PLANS[indice].cadre(p, temps)
    // Raccord : dans les derniers pourcents d un plan, on glisse vers le suivant
    const suivant = PLANS[indice + 1]
    if (suivant) {
      const f = THREE.MathUtils.smoothstep(p, PLANS[indice].fin - FONDU, PLANS[indice].fin)
      if (f > 0) {
        const [pos2, vis2] = suivant.cadre(p, temps)
        voulu = voulu.lerp(pos2, f)
        viseeVoulue = viseeVoulue.lerp(vis2, f)
      }
    }
    // Leger tremble de camera portee : la scene respire meme a l arret
    voulu.add(tmp.set(Math.sin(temps * 0.7) * 3, Math.sin(temps * 0.9) * 2, Math.cos(temps * 0.6) * 3))
    posCamera.lerp(voulu, lissage)
    visee.lerp(viseeVoulue, lissage)
    // La zone d ombre suit ce que regarde la camera : nette la ou l on regarde
    soleil.target.position.copy(visee)
    soleil.position.copy(visee).addScaledVector(directionSoleil, 1800)
    camera.position.copy(posCamera)
    camera.lookAt(visee)
    ciel.position.copy(posCamera)
  }

  const appliquerProgression = (p: number, immediat = false) => {
    uniformesFibre.uTete.value = Math.min(Math.max(p, 0), 1)
    const u = Math.min(Math.max(p, 0.0001), 1)
    const point = courbe.getPointAt(u)
    tete.position.copy(point)
    lumiereTete.position.copy(point).setY(30)
    const visible = p > 0.005 && p < 0.995
    tete.visible = visible
    lumiereTete.intensity = visible ? 3500 : 0
    for (const c of connecteurs) {
      const cible = p >= c.u ? 1 : 0.001
      c.dome.scale.setScalar(immediat ? cible : THREE.MathUtils.lerp(c.dome.scale.x, cible, 0.15))
    }
    for (const b of branches) {
      const k = THREE.MathUtils.clamp((p - b.u) / 0.16, 0, 1)
      b.geo.setDrawRange(0, Math.floor(k * b.n) * RADIAL * 6)
    }
    for (const rc of raccordements) {
      // Le cable monte juste apres le passage de la lumiere, puis le voyant passe au vert
      const k = THREE.MathUtils.clamp((p - rc.u - 0.004) / 0.025, 0, 1)
      rc.cable.uniforms.uK.value = k
      rc.cable.uniforms.uVert.value = rc.eclat
      const raccorde = k >= 1
      ;(rc.voyant.material as THREE.MeshBasicMaterial).color.copy(raccorde ? vert : gris)
      // La balise jaillit a la connexion (petit depassement, comme un ping), et disparait si on remonte
      rc.eclat = immediat ? (raccorde ? 1 : 0) : THREE.MathUtils.lerp(rc.eclat, raccorde ? 1 : 0, 0.12)
      // Une fois la fibre loin devant, la balise se fait discrete : la ville ne se couvre pas de marqueurs
      rc.recent = THREE.MathUtils.clamp(1 - (p - rc.u - 0.03) / 0.1, 0, 1)
      const pop = rc.eclat * (1 + Math.sin(rc.eclat * Math.PI) * 0.35) * (0.45 + 0.55 * rc.recent)
      rc.faisceau.scale.y = Math.max(rc.eclat * (0.35 + 0.65 * rc.recent), 0.001)
      rc.pin.scale.set(0.032 * pop, 0.04 * pop, 1)
      // Le batiment s allume en vert avec sa balise
      if (Math.abs(rc.eclat - rc.eclatApplique) > 0.01 || (immediat && rc.eclat !== rc.eclatApplique)) {
        rc.eclatApplique = rc.eclat
        allumer(rc.plage, rc.eclat)
      }
    }
    // Gros plan sur le technicien : les faisceaux des balises voisines s effacent pour ne pas boucher l image
    const grosPlan = THREE.MathUtils.smoothstep(p, 0.43, 0.46) * (1 - THREE.MathUtils.smoothstep(p, 0.56, 0.59))
    matFaisceau.opacity = 1 - grosPlan * 0.85
    // Arrivee : le dernier cable rejoint le siege, qui s allume, puis la colonne et l etiquette
    const cable = THREE.MathUtils.clamp((p - 0.93) / 0.03, 0, 1)
    cableSiege.setDrawRange(0, Math.floor(cable * 24) * 6 * 6)
    // Ancienne arrivee : colonne verte epaisse et etiquette, sur le batiment OSM d origine
    // const arrivee = THREE.MathUtils.smoothstep(p, 0.9, 1)
    // ;(colonne.material as THREE.MeshBasicMaterial).opacity = arrivee * 0.55
    // ;(etiquette.material as THREE.SpriteMaterial).opacity = arrivee
    // allumer(bati.plages[siege], arrivee)  (le batiment OSM est maintenant remplace par le siege)
    const arrivee = THREE.MathUtils.smoothstep(p, 0.955, 0.99)
    // Les etages s allument du bas vers le haut, puis l etiquette se pose
    const etages = THREE.MathUtils.smoothstep(p, 0.95, 0.985)
    uniformesSiege.uNiveau.value = etages
    for (const mt of materiauxSiege) mt.emissiveIntensity = etages > 0 ? 1.1 : 0
    ;(colonne.material as THREE.MeshBasicMaterial).opacity = arrivee * 0.85
    colonne.scale.y = Math.max(arrivee, 0.001)
    const popSiege = arrivee * (1 + Math.sin(arrivee * Math.PI) * 0.25)
    ;(etiquette.material as THREE.SpriteMaterial).opacity = arrivee
    etiquette.scale.set(0.28 * popSiege, 0.105 * popSiege, 1)
    arriveeSiege = arrivee
  }

  const redimensionner = () => {
    const l = canvas.clientWidth
    const h = canvas.clientHeight
    if (!l || !h) return
    rendu.setSize(l, h, false)
    camera.aspect = l / h
    camera.fov = l < h ? 58 : 42
    camera.updateProjectionMatrix()
  }

  const horloge = new THREE.Clock()
  let image = 0
  let enMarche = false
  const pos = new THREE.Vector3()
  const cap = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const echelle1 = new THREE.Vector3(1, 1, 1)
  const haut = new THREE.Vector3(0, 1, 0)

  const animer = () => {
    const dt = Math.min(horloge.getDelta(), 0.05)
    const temps = horloge.elapsedTime
    progressionAffichee = THREE.MathUtils.lerp(progressionAffichee, progression, 0.08)
    appliquerProgression(progressionAffichee)
    placerEquipes(progressionAffichee, temps)
    placerCamera(progressionAffichee, temps, 0.06)

    mobiles.forEach((mo, i) => {
      mo.s = (mo.s + mo.vitesse * dt + mo.trajet.total) % mo.trajet.total
      pointSurTrajet(mo.trajet, mo.s, pos, cap)
      if (mo.vitesse < 0) cap.negate()
      // On roule a droite : decalage d une voie
      pos.x += -cap.z * 2.6
      pos.z += cap.x * 2.6
      const car = i >= nbVoitures
      pos.y = car ? 1.7 : 1
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cap)
      m.compose(pos, q, echelle1)
      if (car) cars.setMatrixAt(i - nbVoitures, m)
      else voitures.setMatrixAt(i, m)
    })
    voitures.instanceMatrix.needsUpdate = true
    cars.instanceMatrix.needsUpdate = true

    pirogues.forEach((pi, i) => {
      pos.copy(pi.position)
      pos.x += Math.cos(pi.cap) * Math.sin(temps * 0.05 * pi.derive + pi.phase) * 40
      pos.z += Math.sin(pi.cap) * Math.sin(temps * 0.05 * pi.derive + pi.phase) * 40
      pos.y = Math.sin(temps * 1.4 + pi.phase) * 0.35
      q.setFromAxisAngle(haut, pi.cap).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(temps * 1.1 + pi.phase) * 0.06))
      m.compose(pos, q, echelle1)
      coque.setMatrixAt(i, m)
    })
    coque.instanceMatrix.needsUpdate = true

    raccordements.forEach((rc, i) => {
      rc.pin.position.y = rc.hauteur + Math.sin(temps * 2 + i) * 2.5
      // Onde sur le toit tant que le raccordement est recent
      const force = rc.eclat * rc.recent
      rc.onde.visible = force > 0.02
      if (rc.onde.visible) {
        const t = (temps * 0.7 + i * 0.37) % 1
        rc.onde.scale.setScalar(4 + t * 26)
        ;(rc.onde.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9 * force
      }
    })
    ondesSiege.forEach((o, i) => {
      const t = (temps * 0.45 + i / 3) % 1
      o.visible = arriveeSiege > 0.02
      o.scale.setScalar(10 + t * 110)
      ;(o.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85 * arriveeSiege
    })

    uniformesFibre.uTemps.value = temps
    houle.offset.set(temps * 0.004, temps * 0.0025)
    nuages.forEach((n, i) => {
      n.position.x += dt * (4 + (i % 4))
    })
    // Etincelles : renaissent a la tete tant que la fibre avance, retombent sous la gravite
    const avance = Math.abs(progression - progressionAffichee) > 0.0004 && tete.visible
    for (let k = 0; k < NB_ETINCELLES; k++) {
      vieEtincelles[k] -= dt
      if (vieEtincelles[k] <= 0) {
        if (!avance) {
          posEtincelles[k * 3 + 1] = -100
          continue
        }
        vieEtincelles[k] = 0.4 + hasard(k + temps) * 0.5
        posEtincelles[k * 3] = tete.position.x
        posEtincelles[k * 3 + 1] = tete.position.y
        posEtincelles[k * 3 + 2] = tete.position.z
        vitEtincelles[k * 3] = (hasard(k * 3 + temps) - 0.5) * 40
        vitEtincelles[k * 3 + 1] = 15 + hasard(k * 5 + temps) * 30
        vitEtincelles[k * 3 + 2] = (hasard(k * 7 + temps) - 0.5) * 40
      }
      vitEtincelles[k * 3 + 1] -= 60 * dt
      posEtincelles[k * 3] += vitEtincelles[k * 3] * dt
      posEtincelles[k * 3 + 1] += vitEtincelles[k * 3 + 1] * dt
      posEtincelles[k * 3 + 2] += vitEtincelles[k * 3 + 2] * dt
    }
    geoEtincelles.attributes.position.needsUpdate = true

    rendu.render(scene, camera)
    if (enMarche) image = requestAnimationFrame(animer)
  }

  redimensionner()
  placerCamera(0, 0, 1)
  appliquerProgression(0)
  placerEquipes(0, 0)
  // Avant : rendu immediat, qui compilait tous les shaders d un coup et gelait la page plusieurs secondes
  // rendu.render(scene, camera)
  // Les shaders se compilent en parallele (KHR_parallel_shader_compile) sans bloquer la page,
  // puis la premiere image est dessinee
  const pret = rendu
    .compileAsync(scene, camera)
    .catch(() => undefined)
    .then(() => {
      rendu.render(scene, camera)
      jalon('premier rendu')
      if (import.meta.env.DEV) (window as unknown as { __chronoDakar?: unknown }).__chronoDakar = chrono
      // En developpement : acces a la camera pour inspecter un detail de la scene
      if (import.meta.env.DEV) (window as unknown as { __vueDakar?: unknown }).__vueDakar = { camera, rendu, scene, courbe }
    })

  return {
    pret,
    definirProgression: (p) => {
      progression = Math.min(Math.max(p, 0), 1)
    },
    figer: (p) => {
      progression = progressionAffichee = Math.min(Math.max(p, 0), 1)
      appliquerProgression(progression, true)
      placerEquipes(progression, 0.6)
      placerCamera(progression, 0, 1)
      rendu.render(scene, camera)
    },
    redimensionner: () => {
      redimensionner()
      if (!enMarche) rendu.render(scene, camera)
    },
    demarrer: () => {
      if (enMarche) return
      enMarche = true
      horloge.getDelta()
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
        const objet = o as THREE.Mesh
        objet.geometry?.dispose()
        const mat = objet.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      rendu.dispose()
    },
  }
}
