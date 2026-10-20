import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { RefObject, useEffect } from 'react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export { gsap, ScrollTrigger, useGSAP }

const EASE = 'expo.out'

/**
 * Anime tout element de la page qui porte data-apparition.
 * Un seul point d entree : les pages declarent l effet voulu dans le HTML
 * et n ont aucune logique d animation a ecrire.
 *
 *  titre    lignes .ligne-masque > span qui sortent de leur masque
 *  monte    l element monte et apparait
 *  gauche   glisse depuis la gauche (comme les textes de Stelogy)
 *  cascade  les enfants directs arrivent les uns apres les autres
 *  image    rideau qui s ouvre + l image qui se pose
 *  elargir  la carte se redresse et s elargit en suivant le defilement
 *  carte    entree et sortie des cartes au fil du defilement (Lusion)
 *  pile     des photos empilees qui s ouvrent en eventail
 *  glisse   une rangee de photos qui file a l horizontale
 *  compteur le nombre defile jusqu a sa valeur (data-valeur)
 *  trait    soulignement qui se trace de gauche a droite
 */
export function useApparitions(portee: RefObject<HTMLElement>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-apparition]', { autoAlpha: 1 })
        portee.current?.querySelectorAll<HTMLElement>('[data-apparition="compteur"]').forEach((el) => {
          el.textContent = formaterNombre(Number(el.dataset.valeur ?? 0), el.dataset.annee !== undefined)
        })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Ecouteurs poses a la main (survols) : retires quand on quitte la page
        const nettoyages: Array<() => void> = []
        const elements = gsap.utils.toArray<HTMLElement>('[data-apparition]')

        elements.forEach((el) => {
          const effet = el.dataset.apparition
          const delai = Number(el.dataset.delai ?? 0)
          const declencheur = { trigger: el, start: 'top 98%', once: true }

          gsap.set(el, { visibility: 'visible' })

          switch (effet) {
            case 'titre': {
              const lignes = el.querySelectorAll('.ligne-masque > span')
              gsap.from(lignes, {
                yPercent: 110,
                rotate: 2,
                duration: 1.2,
                ease: EASE,
                stagger: 0.09,
                delay: delai,
                scrollTrigger: declencheur,
              })
              break
            }
            case 'monte':
              gsap.from(el, {
                y: 40,
                autoAlpha: 0,
                duration: 1.1,
                ease: EASE,
                delay: delai,
                scrollTrigger: declencheur,
              })
              break
            case 'gauche':
              gsap.from(el, {
                x: -80,
                autoAlpha: 0,
                duration: 1.3,
                ease: EASE,
                delay: delai,
                scrollTrigger: declencheur,
              })
              break
            case 'cascade':
              gsap.from(el.children, {
                y: 70,
                scale: 0.96,
                autoAlpha: 0,
                duration: 1.1,
                ease: EASE,
                stagger: 0.1,
                delay: delai,
                scrollTrigger: { ...declencheur, start: 'top 96%' },
              })
              break
            case 'image': {
              const img = el.querySelector('img')
              const tl = gsap.timeline({ scrollTrigger: declencheur, delay: delai })
              tl.fromTo(
                el,
                { clipPath: 'inset(100% 0% 0% 0%)' },
                { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }
              )
              if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease: EASE }, 0)
              break
            }
            case 'elargir':
              // Inspire de Lusion : la carte arrive inclinee et etroite, puis se pose
              // a plat sur toute la largeur au rythme du doigt ou de la molette.
              gsap.fromTo(
                el,
                { scale: 0.88, rotateX: 8, transformPerspective: 1400 },
                {
                  scale: 1,
                  rotateX: 0,
                  ease: 'none',
                  scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 15%', scrub: 0.6 },
                }
              )
              break
            case 'carte': {
              // Repris des cartes de Lusion : tout suit le defilement. La carte arrive
              // par le bas etroite et basculee en arriere, se pose a plat au milieu de
              // l ecran, puis bascule dans l autre sens et retrecit en sortant par le haut.
              gsap.set(el, { transformPerspective: 1100, willChange: 'transform' })
              gsap.fromTo(
                el,
                { scale: 0.8, rotateX: 22, yPercent: 10, transformOrigin: '50% 100%' },
                {
                  scale: 1,
                  rotateX: 0,
                  yPercent: 0,
                  ease: 'none',
                  scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: 0.5 },
                }
              )
              gsap.fromTo(
                el,
                { scale: 1, rotateX: 0 },
                {
                  // En sortant, la carte retrecit sans palir : elle reste lisible jusqu au bout
                  scale: 0.82,
                  rotateX: -14,
                  transformOrigin: '50% 0%',
                  ease: 'none',
                  immediateRender: false,
                  scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom top', scrub: 0.5 },
                }
              )
              // L image glisse dans son cadre : la profondeur sans effet gadget
              const image = el.querySelector('img')
              if (image) {
                gsap.fromTo(
                  image,
                  { yPercent: -6, scale: 1.14 },
                  {
                    yPercent: 6,
                    scale: 1.14,
                    ease: 'none',
                    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
                  }
                )
              }
              break
            }
            case 'glisse': {
              // Une rangee de photos qui file a l horizontale pendant qu on descend
              const rangee = el.firstElementChild as HTMLElement | null
              if (!rangee) break
              gsap.fromTo(
                rangee,
                { x: () => el.clientWidth * 0.15 },
                {
                  x: () => -(rangee.scrollWidth - el.clientWidth * 0.85),
                  ease: 'none',
                  scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                  },
                }
              )
              // Chaque photo bouge un peu a contre-sens dans son cadre : de la profondeur, sans effet gadget
              el.querySelectorAll<HTMLElement>('[data-glisse-image]').forEach((image) => {
                gsap.fromTo(
                  image,
                  { xPercent: 6, scale: 1.15 },
                  {
                    xPercent: -6,
                    scale: 1.15,
                    ease: 'none',
                    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
                  }
                )
              })
              break
            }
            case 'pile': {
              // Les cartes arrivent empilees bien droites, puis celles du dessous
              // s ouvrent en eventail : on comprend qu il y a plusieurs dossiers
              const cartes = Array.from(el.children) as HTMLElement[]
              const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
              tl.from(el, { y: 60, autoAlpha: 0, duration: 1, ease: EASE })
              cartes.forEach((carte, i) => {
                tl.fromTo(
                  carte,
                  { rotate: 0, xPercent: 0 },
                  {
                    rotate: Number(carte.dataset.rotation ?? 0),
                    xPercent: Number(carte.dataset.decalage ?? 0),
                    duration: 1.2,
                    ease: 'power3.out',
                  },
                  0.45 + i * 0.08
                )
              })

              // Au survol, l eventail s ouvre un peu plus et la photo se souleve
              const survoler = (dedans: boolean) => {
                if (tl.isActive()) return
                cartes.forEach((carte) => {
                  const d = carte.dataset
                  gsap.to(carte, {
                    rotate: Number((dedans ? d.survolRotation : d.rotation) ?? 0),
                    xPercent: Number((dedans ? d.survolDecalage : d.decalage) ?? 0),
                    yPercent: dedans ? Number(d.survolMonte ?? 0) : 0,
                    scale: dedans && d.survolMonte ? 1.01 : 1,
                    duration: 0.7,
                    ease: 'power3.out',
                    overwrite: 'auto',
                  })
                })
              }
              const entrer = () => survoler(true)
              const sortir = () => survoler(false)
              el.addEventListener('pointerenter', entrer)
              el.addEventListener('pointerleave', sortir)
              nettoyages.push(() => {
                el.removeEventListener('pointerenter', entrer)
                el.removeEventListener('pointerleave', sortir)
              })
              break
            }
            case 'compteur': {
              const cible = Number(el.dataset.valeur ?? 0)
              const annee = el.dataset.annee !== undefined
              // Une annee ne se compte pas depuis zero : on part de pres pour garder du sens
              const depart = annee ? cible - 20 : 0
              const etat = { n: depart }
              el.textContent = formaterNombre(depart, annee)
              gsap.to(etat, {
                n: cible,
                duration: 2,
                ease: 'power3.out',
                scrollTrigger: declencheur,
                onUpdate: () => {
                  el.textContent = formaterNombre(Math.round(etat.n), annee)
                },
              })
              break
            }
            case 'trait':
              gsap.fromTo(
                el,
                { scaleX: 0, transformOrigin: 'left center' },
                { scaleX: 1, duration: 1.2, ease: 'expo.inOut', delay: delai, scrollTrigger: declencheur }
              )
              break
            default:
              gsap.set(el, { autoAlpha: 1 })
          }
        })

        return () => nettoyages.forEach((nettoyer) => nettoyer())
      })

      // Les images chargees apres coup decalent la page : on recalcule les seuils
      const recalculer = () => ScrollTrigger.refresh()
      window.addEventListener('load', recalculer)
      return () => window.removeEventListener('load', recalculer)
    },
    { scope: portee }
  )
}

export function formaterNombre(n: number, annee = false) {
  // Les annees s ecrivent sans separateur de milliers
  if (annee) return String(n)
  return new Intl.NumberFormat('fr-FR').format(n)
}

/**
 * Defilement amorti (Lenis), comme chez Lusion : la molette glisse au lieu de
 * sauter, et tout ce qui suit le defilement (fibre, cartes) en devient fluide.
 * Branche sur l horloge de GSAP pour que les deux avancent au meme rythme.
 */
export function useDefilementFluide() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.15, anchors: { offset: -80 }, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    const avancer = (temps: number) => lenis.raf(temps * 1000)
    gsap.ticker.add(avancer)
    gsap.ticker.lagSmoothing(0)
    ;(window as unknown as { lenis?: Lenis }).lenis = lenis
    return () => {
      gsap.ticker.remove(avancer)
      lenis.destroy()
      delete (window as unknown as { lenis?: Lenis }).lenis
    }
  }, [])
}
