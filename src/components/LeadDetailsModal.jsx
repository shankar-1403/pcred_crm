import ModalCloseButton from './ModalCloseButton'
import { ROLES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useAmbassador } from '../hooks/useAmbassador'
import { useProducts } from '../hooks/useProducts'
import { useStatuses } from '../hooks/useStatuses'
import { assignedUids } from '../lib/leads'

/**
 * @param {boolean} [showPartner=true] When true, show elite ambassador / ambassador sourcing rows when data exists.
 */
export default function LeadDetailsModal({
  lead,
  usersById,
  onClose,
  showPartner = true,
}) {
  const { profile } = useAuth()
  const role = String(profile?.role ?? '').trim().toLowerCase()
  const isRestrictedExternalRole =
    role === ROLES.ELITE_AMBASSADOR || role === ROLES.AMBASSADOR

  const { products } = useProducts()
  const { eliteAmbassador } = useEliteAmbassador()
  const { ambassador: ambassadorRows } = useAmbassador()
  const { statuses } = useStatuses()
  if (!lead) return null

  const titleTrim = String(lead.title ?? '').trim()
  const referredByUid = String(lead.referredByUid ?? '').trim()

  const userName = (uid) => {
    const u = usersById?.[uid]
    return u?.displayName || u?.email || uid || '—'
  }

  const assignees = assignedUids(lead.assignedTo)
  const salesAssignees = assignedUids(lead.salesAssignedTo)
  const salesAssignedBy =
    salesAssignees.length > 0
      ? salesAssignees.map((uid) => userName(uid)).join(', ')
      : null
  const statusMap = new Map()
  statuses.forEach((s) => {
    const label = String(s?.label ?? '').trim()
    const id = String(s?.id ?? '').trim()
    const legacyValue = String(s?.value ?? '').trim()
    if (id && label) statusMap.set(id, label)
    if (legacyValue && label) statusMap.set(legacyValue, label)
  })
  const statusLabel = statusMap.get(lead.status) || lead.status || '—'

  const processedBy = assignees.length
    ? assignees.map((uid) => userName(uid)).join(', ')
    : 'Unassigned'
  const productName = getProductName(lead.productId, products)
  const eliteAmbassadorOrgName = getEliteAmbassadorOrgName(
    lead.eliteAmbassadorId,
    lead.eliteAmbassadorName,
    eliteAmbassador,
  )
  const ambassadorName = getAmbassadorName(
    lead.ambassadorId,
    lead.ambassadorName,
    ambassadorRows,
  )

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="mx-auto my-6 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-semibold text-white">Lead Details</h2>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="crm-thin-scrollbar max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-8 md:grid-cols-2">
            <section className="space-y-3">
              <p className="text-sm font-semibold text-slate-400">Lead Information</p>
              {titleTrim ? <Row label="Title" value={titleTrim} /> : null}
              {showPartner &&
              (lead.eliteAmbassadorId || lead.eliteAmbassadorName) ? (
                <Row label="Elite ambassador" value={eliteAmbassadorOrgName} />
              ) : null}
              {showPartner && (lead.ambassadorId || lead.ambassadorName) ? (
                <Row label="Ambassador" value={ambassadorName} />
              ) : null}
              {referredByUid ? (
                <Row label="Referred by" value={userName(referredByUid)} />
              ) : null}
              {lead.viaName ? (
                <Row label="Via" value={lead.viaName} />
              ) : null}
              <Row label="Company" value={lead.company || '—'} />
              <Row label="Client Name" value={lead.clientName || '—'} />
              <Row label="Sales Owner" value={userName(lead.createdBy)} />
              <Row label="Processed By" value={processedBy} />
              {salesAssignedBy ? (
                <Row label="Sales assigned" value={salesAssignedBy} />
              ) : null}
              <Row label="Status" value={statusLabel} />
              <Row label="Date" value={lead.leadDate || '—'} />
              <Row
                label="Updated status date"
                value={lead.updatedStatusDate || '—'}
              />
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold text-slate-400">Company Details</p>
              <Row label="Location" value={lead.location || '—'} />
              {isRestrictedExternalRole ? null : (
                <Row label="Bank Name" value={lead.bankName || '—'} />
              )}
              <Row label="Product" value={productName} />
              {isRestrictedExternalRole ? null : (
                <Row
                  label="One Pager Link"
                  value={lead.onePagerLink || 'N/A'}
                  isLink={Boolean(lead.onePagerLink)}
                />
              )}
            </section>
            
            <section className="space-y-3">
              <p className="text-sm font-semibold text-slate-400">Financial Information</p>
              <Row label="Requirement Amount" value={formatAmount(lead.totalAmount)} />
              {isRestrictedExternalRole ? null : (
                <>
                  <Row label="Bank Payout %" value={formatPercent(lead.bankPayoutPercent)} />
                  <Row label="Bank Payout Amount" value={formatAmount(lead.bankPayoutAmount)} />
                </>
              )}
            </section>

            {isRestrictedExternalRole ? null : (
              <section className="space-y-3">
                <p className="text-sm font-semibold text-slate-400">Revenue Details</p>
                <Row label="Mandate Signed" value={lead.mandateSigned ? 'Yes' : 'No'} />
                <Row
                  label="Mandate Payout %"
                  value={
                    lead.mandateSigned
                      ? formatPercent(lead.mandatePayoutPercent)
                      : 'N/A'
                  }
                />
                <Row
                  label="Mandate Payout Amount"
                  value={
                    lead.mandateSigned ? formatAmount(lead.mandatePayoutAmount) : 'N/A'
                  }
                />
                <Row
                  label="Total Revenue"
                  value={formatAmount(totalRevenue(lead))}
                />
              </section>
            )}
          </div>

          <section className="mt-8">
            <p className="mb-2 text-sm font-semibold text-slate-400">Description</p>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
              {lead.description || '—'}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, isLink = false }) {
  return (
    <div className="text-sm text-slate-300 sm:text-base">
      <span className="font-semibold text-slate-200">{label}: </span>
      {isLink ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          className="break-all text-blue-300 underline-offset-2 hover:underline"
        >
          {String(value)}
        </a>
      ) : (
        <span className="break-all text-slate-300">{String(value)}</span>
      )}
    </div>
  )
}

function formatAmount(v) {
  const num = Number(v)
  if (!Number.isFinite(num)) return 'N/A'
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatPercent(v) {
  if (v === '' || v == null) return 'N/A'
  const num = Number(v)
  if (!Number.isFinite(num)) return 'N/A'
  return `${num}%`
}

function totalRevenue(lead) {
  const bank = Number(lead.bankPayoutAmount) || 0
  const mandate = Number(lead.mandatePayoutAmount) || 0
  return bank + mandate
}

function getProductName(productId, products) {
  if (!productId) return 'N/A'
  const item = products.find((p) => p.id === productId)
  return item?.name?.trim() || productId
}

function getEliteAmbassadorOrgName(orgId, fallbackName, eliteAmbassadorRows) {
  if (fallbackName) return fallbackName
  if (!orgId) return 'N/A'
  const item = eliteAmbassadorRows.find((p) => p.id === orgId)
  return item?.name?.trim() || orgId
}

function getAmbassadorName(ambassadorId, fallbackName, ambassadorRows) {
  if (fallbackName) return fallbackName
  if (!ambassadorId) return 'N/A'
  const item = ambassadorRows.find((a) => a.id === ambassadorId)
  return item?.name?.trim() || ambassadorId
}

