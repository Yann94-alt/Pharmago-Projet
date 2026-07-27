const STYLES = {
  en_attente: 'bg-amber-100 text-amber-700',
  acceptee: 'bg-blue-100 text-blue-700',
  prete: 'bg-brand-100 text-brand-700',
  remise: 'bg-brand-600 text-white',
  annulee: 'bg-red-100 text-red-600',
  validee: 'bg-brand-100 text-brand-700',
  rejetee: 'bg-red-100 text-red-600',
  generee: 'bg-blue-100 text-blue-700',
  envoyee: 'bg-amber-100 text-amber-700',
  payee: 'bg-brand-600 text-white',
}

const LABELS = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  prete: 'Prête',
  remise: 'Remise',
  annulee: 'Annulée',
  validee: 'Validée',
  rejetee: 'Rejetée',
  generee: 'Générée',
  envoyee: 'Envoyée',
  payee: 'Payée',
}

export default function StatutBadge({ statut }) {
  return (
    <span className={`badge ${STYLES[statut] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[statut] || statut}
    </span>
  )
}
