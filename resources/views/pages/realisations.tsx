import { Senegal3D } from '~/views/composants/senegal_3d'
import { Vitrine } from '~/views/layouts/vitrine'

/** Nos realisations : le film 3D du deploiement Dakar -> Tambacounda, et c est tout (demande du 20/10). */
export default function Realisations() {
  return (
    <Vitrine
      logo="terrain"
      titre="Nos réalisations"
      description="Le déploiement fibre de SAFIBRE de Dakar à Tambacounda, par Diourbel et Kaolack, en 3D."
    >
      <Senegal3D />
    </Vitrine>
  )
}
