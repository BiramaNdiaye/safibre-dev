import { coordonnees } from '~/scripts/contenu'
import { Vitrine } from '~/views/layouts/vitrine'

export default function MentionsLegales() {
  return (
    <Vitrine titre="Mentions légales">
      <section className="bg-encre pb-16 pt-32 text-white lg:pt-40">
        <div className="conteneur">
          <h1 data-apparition="titre" className="text-[clamp(2rem,5vw,3.6rem)] uppercase leading-none">
            <span className="ligne-masque">
              <span className="font-light">Mentions</span>
            </span>
            <span className="ligne-masque">
              <span className="font-extrabold">légales</span>
            </span>
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <article className="conteneur prose prose-neutral max-w-3xl prose-headings:font-extrabold prose-headings:uppercase prose-h2:text-lg prose-a:text-accent">
          <h2>Éditeur du site</h2>
          <p>
            SAFIBRE SUARL
            <br />
            {coordonnees.adresse.join(', ')}
            <br />
            {coordonnees.telephone} · <a href={`mailto:${coordonnees.email}`}>{coordonnees.email}</a>
          </p>

          <h2>Hébergement</h2>
          <p>Fly.io, Inc. — 321 N Clark St, Suite 2550, Chicago, IL 60654, États-Unis.</p>

          <h2>Accès au site</h2>
          <p>
            Le site est accessible en tout endroit, 24 h/24 et 7 j/7, sauf cas de force majeure ou
            interruption, programmée ou non, liée à une maintenance.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Le site SAFIBRE et l'ensemble de son contenu (textes, images, vidéos, logos) sont protégés
            par les lois du Sénégal sur la propriété intellectuelle. Toute reproduction,
            représentation, modification, publication ou transmission, totale ou partielle, par
            quelque procédé que ce soit, est interdite sans autorisation écrite.
          </p>

          <h2>Données personnelles</h2>
          <p>
            Les informations transmises par le formulaire de contact servent uniquement à répondre à
            votre demande. Elles ne sont jamais communiquées à des tiers sans votre consentement
            préalable. Pour les consulter, les corriger ou les supprimer, écrivez à{' '}
            <a href={`mailto:${coordonnees.email}`}>{coordonnees.email}</a>.
          </p>

          <h2>Responsabilité</h2>
          <p>
            SAFIBRE s'efforce de fournir des informations fiables et à jour, sans pouvoir garantir
            l'absence d'erreurs, d'omissions ou d'indisponibilités. L'utilisateur reste seul
            responsable de l'usage qu'il fait du site.
          </p>
        </article>
      </section>
    </Vitrine>
  )
}
