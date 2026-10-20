

/** Bande de balisage de chantier sous l en-tete. Refusee par le proprietaire le 20/10 : plus affichee, gardee ici. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BandeBalisage() {
  const mots = ['Déploiement', 'Raccordement FttH / FttO', 'Maintenance', 'Mesures OTDR', 'Recette', 'Suivi des incidents 24/7']
  return (
    <div aria-hidden className="relative bg-encre text-white">
      <div className="balisage h-2.5" />
      <div className="conteneur flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] md:justify-between md:text-xs">
        {mots.map((m, i) => (
          <span key={m} className="flex items-center gap-6">
            {i > 0 && <span className="hidden size-1.5 rotate-45 bg-orange md:block" />}
            {m}
          </span>
        ))}
      </div>
      <div className="balisage h-2.5" />
    </div>
  )
}
