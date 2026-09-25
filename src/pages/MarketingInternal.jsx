import React, { useMemo, useState } from 'react'
import ModalCloseButton from '../components/ModalCloseButton'
import { useMarketing } from '../hooks/useMarketing'
import { useAuth } from '../context/AuthContext'

const DEFAULT_SUBJECT = 'PCRED - Your One-Stop Corporate Advisory Partner'

function buildDefaultContent(item, profile) {
  const fileUrl = item?.fileUrl || ''
  const sender =
    profile?.displayName ||
    profile?.email ||
    'PCRED Venture Pvt. Ltd.'

  const mobile = profile?.phoneNo

  return [
    'Dear Sir/Ma’am,',
    '',
    'Greetings from PCRED.',
    '',
    'We are pleased to introduce PCRED, a leading corporate advisory firm with over a decade of experience, partnering with 400+ businesses across diverse industries. We specialize in helping startups, MSMEs, and enterprises strengthen their financial foundation, raise capital, and accelerate sustainable business growth through strategic financial and risk advisory.',
    '',
    'Our core services include:',
    '✅ Working Capital Solutions',
    '✅ Export Finance & Supply Chain Finance',
    '✅ Government Schemes & MSME Advisory',
    '✅ Retail Loans',
    '✅ IPO Advisory & Equity Financing',
    '✅ Debt Syndication & Project Finance',
    '✅ One-Time Settlement (OTS) & Bill Discounting',
    '',
    'At PCRED, we believe every business has unique financial needs. Our experienced team works closely with clients to identify the right funding solutions, optimize capital structures, and leverage government-backed initiatives to support long-term growth and financial resilience.',
    '',
    'We look forward to the opportunity to partner with you and contribute to your business success.',
    '',
    'Should you have any questions or require any assistance, please feel free to reach out to us.',
    '',
    'Warm Regards,',
    sender,
    mobile,
    'PCRED Venture Pvt. Ltd.',
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
}

function attachmentLabel(item) {
  if (!item?.fileUrl) return 'No file'
  try {
    const raw = decodeURIComponent(item.fileUrl.split('/').pop()?.split('?')[0] || '')
    return item.name ? `${item.name} (${raw})` : raw || item.name || 'Attachment'
  } catch {
    return item.name || 'Attachment'
  }
}

function MarketingInternal() {
  const { marketing } = useMarketing()
  const { profile } = useAuth()

  const [shareOpen, setShareOpen] = useState(false)
  const [shareItem, setShareItem] = useState(null)
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const attachmentName = useMemo(() => attachmentLabel(shareItem), [shareItem])

  function openShare(item) {
    setShareItem(item)
    setToEmail('')
    setSubject(DEFAULT_SUBJECT)
    setContent(buildDefaultContent(item, profile))
    setError('')
    setMessage('')
    setShareOpen(true)
  }

  function closeShare() {
    if (sending) return
    setShareOpen(false)
    setShareItem(null)
    setError('')
    setMessage('')
  }

  async function handleShareSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    const to = toEmail.trim()
    if (!to || !to.includes('@')) {
      setError('Please enter a valid To email address.')
      return
    }
    if (!content.trim()) {
      setError('Please enter email content.')
      return
    }
    if (!shareItem?.fileUrl) {
      setError('This material has no file to attach.')
      return
    }

    setSending(true)
    try {
      const res = await fetch(
        'https://us-central1-crm-lead-b18f5.cloudfunctions.net/shareMarketingMail',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            cc: profile.email,
            subject: subject.trim() || DEFAULT_SUBJECT,
            content: content.trim(),
            attachmentUrl: shareItem.fileUrl,
            attachmentName: shareItem.name
              ? `${shareItem.name}.pdf`
              : attachmentName,
            fromName: profile?.displayName || '',
          }),
        },
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Could not send email.')
      }

      setMessage('Email sent successfully.')
      setTimeout(() => {
        closeShare()
      }, 1200)
    } catch (err) {
      setError(err?.message || 'Could not send email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Marketing Material</h1>
            <p className="mt-1 text-sm text-slate-400">
              View files or share them by email with attachment.
            </p>
          </div>
        </div>

        <div className="max-w-full min-w-0">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              {marketing.length === 0 ? (
                <p className="col-span-full text-sm text-slate-400">
                  No marketing materials yet.
                </p>
              ) : (
                marketing.map((item) => (
                  <div key={item.id} className="col-span-1">
                    <div className="overflow-hidden rounded-2xl border border-blue-600">
                      <div className="rounded-2xl border-r-3 border-b-3 border-blue-600 px-3 py-4">
                        <div className="pb-2">
                          <h2 className="text-center text-lg font-bold">{item.name}</h2>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-center text-base text-white"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => openShare(item)}
                            className="w-full cursor-pointer rounded-lg border border-blue-600 px-3 py-1 text-base"
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {shareOpen && shareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-marketing-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="share-marketing-title"
                  className="text-lg font-semibold text-white"
                >
                  Share marketing material
                </h2>
                <p className="mt-1 text-sm text-slate-400">{shareItem.name}</p>
              </div>
              <ModalCloseButton onClick={closeShare} />
            </div>

            <form onSubmit={handleShareSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="share-to"
                  className="block text-sm font-medium text-slate-300"
                >
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  id="share-to"
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="share-subject"
                  className="block text-sm font-medium text-slate-300"
                >
                  Subject
                </label>
                <input
                  id="share-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="share-content"
                  className="block text-sm font-medium text-slate-300"
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="share-content"
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Attachment
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <span className="truncate">{attachmentName}</span>
                  {shareItem.fileUrl ? (
                    <a
                      href={shareItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-blue-300 underline"
                    >
                      Preview file
                    </a>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  This file will be attached to the email when you send.
                </p>
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeShare}
                  disabled={sending}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default MarketingInternal
