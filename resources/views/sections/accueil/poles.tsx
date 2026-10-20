import { Link } from '@inertiajs/react'
import { IconeFleche, IconeFlecheDiagonale } from '~/views/composants/icones'
import photoEtudes from '~/assets/photos/etude-1.webp'
import photoTerrain from '~/assets/photos/terrain-poteau.webp'
import { chiffres, expertises, methode } from '~/scripts/contenu'
import { Plus, Titre } from '~/views/composants/titre'

export function Poles() {
  const poles = [
    {
      code: 'etudes',
      titre: "Bureau d'études",
      sous: 'Telecom engineering',
      texte: 'Études FTTH / FTTO, routes optiques, dossiers BLO et DOE, centre d’activités télécoms.',
      photo: photoEtudes,
      lien: '/bureau_etude',
      teinte: 'from-vert via-vert/60',
      // bouton: 'bg-vert hover:bg-white hover:text-vert',  (vert sur degrade vert : ne ressortait pas)
      bouton: 'bg-white text-vert group-hover:bg-vert group-hover:text-white',
    },
    {
      code: 'terrain',
      titre: 'Opérations terrain',
      sous: 'Telecom field operations',
      texte: 'Déploiement, raccordements, mesures, maintenance et dépannage de vos réseaux.',
      photo: photoTerrain,
      lien: '/operations-telecoms',
      teinte: 'from-orange via-orange/55',
      // bouton: 'bg-orange hover:bg-white hover:text-orange',
      bouton: 'bg-white text-orange group-hover:bg-orange group-hover:text-white',
    },
  ]

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="conteneur flex flex-col gap-14">
        {/* Titre a gauche, une phrase a droite : la ligne ne reste plus a moitie vide */}
        <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <Titre surtitre="Deux pôles" fin="Une société," fort="deux métiers" />
          <p data-apparition="monte" className="max-w-md text-[15px] leading-relaxed text-encre/65 md:justify-self-end">
            Un bureau d'études qui dessine le réseau, des équipes terrain qui le posent : les mêmes
            données, du premier plan au dernier raccordement.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {poles.map((p) => {
            const services = expertises.filter((e) => e.pole === p.code)
            return (
              <article
                key={p.lien}
                // data-apparition="carte"  (entree basculee + sortie qui retrecit : retiree le 20/10 a la demande)
                data-apparition="monte"
                className="group relative isolate flex min-h-[560px] flex-col justify-end overflow-hidden rounded-[28px] p-7 text-white md:min-h-[620px] md:p-10"
              >
                <img
                  src={p.photo}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[1400ms] ease-sortie group-hover:scale-105"
                />
                <div className={`absolute inset-0 -z-10 bg-gradient-to-t ${p.teinte} to-transparent opacity-95`} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{p.sous}</span>
                <h3 className="mt-2 text-3xl font-extrabold uppercase md:text-4xl">
                  {/* Toute la carte mene au pole : le lien couvre la carte, les services restent cliquables au-dessus */}
                  <Link href={p.lien} className="after:absolute after:inset-0 after:content-['']">
                    {p.titre}
                  </Link>
                </h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/85">{p.texte}</p>

                {/* Les services du pole, chacun mene a sa section */}
                <ul className="relative z-10 mt-6 flex flex-col border-t border-white/25">
                  {services.map((s) => (
                    <li key={s.code}>
                      <Link
                        href={s.lien}
                        className="flex items-center justify-between gap-4 border-b border-white/25 py-3 text-sm font-semibold transition-[padding] duration-300 hover:pl-2"
                      >
                        {s.titre}
                        <IconeFleche size={16} className="shrink-0 opacity-70" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <span
                  className={`pointer-events-none relative z-10 mt-7 inline-flex h-12 items-center gap-2 self-start rounded-full px-6 text-[13px] font-bold uppercase tracking-wider shadow-lg transition-colors ${p.bouton}`}
                  aria-hidden
                >
                  Découvrir le pôle
                  <IconeFlecheDiagonale size={16} />
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Ancienne section des poles (avant le 20/10) : deux cartes photo, titre et texte seuls
// function Poles() {
//   const poles = [
//     {
//       titre: "Bureau d'études",
//       sous: 'Telecom engineering',
//       texte: 'Études FTTH / FTTO, routes optiques, dossiers BLO et DOE, centre d’activités télécoms.',
//       photo: photoEtudes,
//       lien: '/bureau_etude',
//       teinte: 'from-vert/95',
//     },
//     {
//       titre: 'Opérations terrain',
//       sous: 'Telecom field operations',
//       texte: 'Déploiement, raccordements, mesures, maintenance et dépannage de vos réseaux.',
//       photo: photoTerrain,
//       lien: '/operations-telecoms',
//       teinte: 'from-orange/95',
//     },
//   ]

//   return (
//     <section className="bg-white py-24 md:py-32">
//       <div className="conteneur flex flex-col gap-14">
//         <Titre surtitre="Deux pôles" fin="Une société," fort="deux métiers" />
//         <div className="grid gap-5 md:grid-cols-2">
//           {poles.map((p) => (
//             <Link
//               key={p.lien}
//               href={p.lien}
//               data-apparition="carte"
//               className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[28px] p-7 text-white sm:aspect-[5/4] md:aspect-[4/5] md:p-10 lg:aspect-[5/4]"
//             >
//               <img
//                 src={p.photo}
//                 alt=""
//                 loading="lazy"
//                 className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[1400ms] ease-sortie group-hover:scale-105"
//               />
//               <div className={`absolute inset-0 -z-10 bg-gradient-to-t ${p.teinte} via-encre/30 to-transparent opacity-90`} />
//               <span className="absolute right-6 top-6 grid size-14 place-items-center rounded-full border border-white/60 transition-all duration-500 group-hover:rotate-45 group-hover:border-white group-hover:bg-white group-hover:text-encre md:right-8 md:top-8">
//                 <IconeFlecheDiagonale size={22} />
//               </span>
//               <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{p.sous}</span>
//               <h3 className="mt-2 text-3xl font-extrabold uppercase md:text-4xl">{p.titre}</h3>
//               <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/85">{p.texte}</p>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }
