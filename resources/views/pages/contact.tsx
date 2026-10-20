import { useForm } from '@inertiajs/react'
import { FormEvent, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react'
import { toast } from 'sonner'
import photoEnTete from '~/assets/photos/etude-casque.webp'
import { coordonnees } from '~/scripts/contenu'
import { cn } from '~/scripts/utils/css'
import { IconeCourriel, IconeFleche, IconeHorloge, IconeLieu, IconeTelephone } from '~/views/composants/icones'
import { Plus } from '~/views/composants/titre'
import { Vitrine } from '~/views/layouts/vitrine'

// Les demandes les plus frequentes : un clic remplit l objet, on peut toujours le reecrire
const objetsCourants = ['Étude FTTH / FTTO', 'Raccordement', 'Maintenance', 'Dossiers opérateur', 'Autre demande']

export default function Contact() {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    subject: '',
    message: '',
    // Champ piege : invisible pour les visiteurs, rempli par les robots de spam
    site_web: '',
  })
  const [envoye, setEnvoye] = useState(false)

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    post('/contact', {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        setEnvoye(true)
        toast.success('Message envoyé. Nous vous répondons sous 24 h ouvrées.')
      },
      onError: () => toast.error('Certains champs sont à corriger.'),
    })
  }

  return (
    <Vitrine
      titre="Contact"
      description="Contactez SAFIBRE : étude, raccordement, maintenance de réseaux fibre optique. +221 33 801 86 40, contact@safibre.sn."
    >
      <section className="relative isolate overflow-hidden bg-encre pb-40 pt-32 text-white lg:pt-44">
        <img
          src={photoEnTete}
          alt=""
          className="absolute inset-0 -z-10 size-full animate-[poser_2.4s_cubic-bezier(.16,1,.3,1)_both] object-cover object-[70%_30%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre via-encre/80 to-encre/30" />
        <div className="conteneur relative flex flex-col gap-6">
          <span data-apparition="monte" className="surtitre text-accent-clair">
            <Plus className="size-2.5" />
            Contact
          </span>
          <h1 data-apparition="titre" className="text-[clamp(2.1rem,5.6vw,4.3rem)] uppercase leading-[1]">
            <span className="ligne-masque">
              <span className="font-light">Un projet, une panne,</span>
            </span>
            <span className="ligne-masque">
              <span className="font-extrabold">
                une question<span className="text-orange"> ?</span>
              </span>
            </span>
          </h1>
          <p data-apparition="monte" className="max-w-xl text-[15px] leading-relaxed text-white/75 md:text-base">
            Décrivez votre besoin en quelques lignes : un ingénieur vous répond sous 24 heures ouvrées
            avec les bonnes questions, ou directement une proposition.
          </p>
        </div>
      </section>

      <section className="relative pb-24 md:pb-32">
        <div className="conteneur -mt-28 grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          {/* Coordonnees */}
          <aside data-apparition="monte" className="flex flex-col gap-1 self-start rounded-[28px] bg-encre-2 p-3 text-white">
            <LigneContact icone={<IconeTelephone size={18} />} titre="Téléphone" lien={coordonnees.telephoneLien}>
              {coordonnees.telephone}
            </LigneContact>
            <LigneContact icone={<IconeCourriel size={18} />} titre="Courriel" lien={`mailto:${coordonnees.email}`}>
              {coordonnees.email}
            </LigneContact>
            <LigneContact icone={<IconeLieu size={18} />} titre="Adresse">
              {coordonnees.adresse.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
              <span className="mt-1 block text-xs text-white/50">Sur rendez-vous</span>
            </LigneContact>
            <LigneContact icone={<IconeHorloge size={18} />} titre="Horaires">
              {coordonnees.horaires}
            </LigneContact>
          </aside>

          {/* Formulaire */}
          <form
            onSubmit={envoyer}
            noValidate
            data-apparition="monte"
            data-delai="0.1"
            className="flex flex-col gap-6 rounded-[28px] border border-encre/10 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(18,26,23,0.35)] md:p-10"
          >
            {envoye && (
              <div role="status" className="flex items-start gap-3 rounded-2xl bg-vert/10 p-4 text-sm text-vert">
                <Plus className="mt-1 text-vert" />
                <span>
                  <strong className="block">Merci, votre message est bien parti.</strong>
                  Nous revenons vers vous sous 24 heures ouvrées.
                </span>
              </div>
            )}

            {/* Piege a robots : hors ecran, ignore par les lecteurs d ecran et le remplissage automatique */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Ne pas remplir
                <input type="text" name="site_web" tabIndex={-1} autoComplete="off" value={data.site_web} onChange={(e) => setData('site_web', e.target.value)} />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Champ
                libelle="Prénom et nom"
                name="name"
                autoComplete="name"
                value={data.name}
                erreur={errors.name}
                onChange={(e) => setData('name', e.target.value)}
              />
              <Champ
                libelle="Adresse e-mail"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={data.email}
                erreur={errors.email}
                onChange={(e) => setData('email', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Champ
                libelle="Objet"
                name="subject"
                value={data.subject}
                erreur={errors.subject}
                onChange={(e) => setData('subject', e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {objetsCourants.map((objet) => (
                  <button
                    key={objet}
                    type="button"
                    onClick={() => {
                      setData('subject', objet)
                      clearErrors('subject')
                    }}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                      data.subject === objet
                        ? 'border-accent bg-accent text-white'
                        : 'border-encre/15 text-encre/70 hover:border-encre hover:text-encre'
                    )}
                  >
                    {objet}
                  </button>
                ))}
              </div>
            </div>

            <ChampTexte
              libelle="Votre message"
              name="message"
              rows={6}
              placeholder="Lieu, nombre de raccordements, délais souhaités…"
              value={data.message}
              erreur={errors.message}
              onChange={(e) => setData('message', e.target.value)}
            />

            <div className="flex flex-col-reverse items-stretch gap-4 border-t border-encre/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-encre/50">
                Vos informations servent uniquement à vous répondre.
              </p>
              <button type="submit" disabled={processing} className="bouton-plein shrink-0 disabled:opacity-60">
                {processing ? 'Envoi…' : 'Envoyer le message'}
                {!processing && <IconeFleche size={18} />}
              </button>
            </div>
          </form>
        </div>
      </section>
    </Vitrine>
  )
}

function LigneContact({
  icone,
  titre,
  lien,
  children,
}: {
  icone: React.ReactNode
  titre: string
  lien?: string
  children: React.ReactNode
}) {
  const contenu = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-clair">{icone}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{titre}</span>
        <span className="text-[15px] font-medium">{children}</span>
      </span>
    </>
  )
  const classes = 'flex items-start gap-4 rounded-2xl p-4 transition-colors'
  return lien ? (
    <a href={lien} className={cn(classes, 'hover:bg-white/5')}>
      {contenu}
    </a>
  ) : (
    <div className={classes}>{contenu}</div>
  )
}

type ChampProps = InputHTMLAttributes<HTMLInputElement> & { libelle: string; erreur?: string; name: string }

function Champ({ libelle, erreur, name, ...props }: ChampProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-encre/70">{libelle}</span>
      <input
        name={name}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? `${name}-erreur` : undefined}
        className={cn(
          'h-12 rounded-xl border bg-papier/60 px-4 text-[15px] outline-none transition-colors focus:border-accent focus:bg-white',
          erreur ? 'border-red-500' : 'border-encre/15'
        )}
        {...props}
      />
      {erreur && (
        <span id={`${name}-erreur`} className="text-xs font-medium text-red-600">
          {erreur}
        </span>
      )}
    </label>
  )
}

type ChampTexteProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { libelle: string; erreur?: string; name: string }

function ChampTexte({ libelle, erreur, name, ...props }: ChampTexteProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-encre/70">{libelle}</span>
      <textarea
        name={name}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? `${name}-erreur` : undefined}
        className={cn(
          'resize-y rounded-xl border bg-papier/60 px-4 py-3 text-[15px] outline-none transition-colors focus:border-accent focus:bg-white',
          erreur ? 'border-red-500' : 'border-encre/15'
        )}
        {...props}
      />
      {erreur && (
        <span id={`${name}-erreur`} className="text-xs font-medium text-red-600">
          {erreur}
        </span>
      )}
    </label>
  )
}
