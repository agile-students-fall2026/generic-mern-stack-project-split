import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import Button from './Button.jsx'

// "Invite people" sheet, shown after creating an event.
function InviteSheet({ eventName, inviteCode, onClose }) {
  // '' until a copy is tried, then 'copied' or 'failed'
  const [copyStatus, setCopyStatus] = useState('')
  const linkRef = useRef(null)
  const link = `${window.location.origin}/join/${inviteCode}`

  useEffect(() => {
    if (copyStatus !== 'copied') return
    const timer = setTimeout(() => setCopyStatus(''), 2000)
    return () => clearTimeout(timer)
  }, [copyStatus])

  async function copyLink() {
    try {
      // navigator.clipboard is missing on plain http, which also lands in catch
      await navigator.clipboard.writeText(link)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
      // the sheet may have closed while the clipboard was still answering
      linkRef.current?.select()
    }
  }

  async function shareLink() {
    if (!navigator.share) return copyLink()
    try {
      await navigator.share({ title: eventName, url: link })
    } catch (error) {
      // AbortError means the share menu was closed on purpose
      if (error.name !== 'AbortError') copyLink()
    }
  }

  return (
    <Sheet
      title="Invite people"
      description={`Anyone with this link can join ${eventName} by entering their name.`}
      closeLabel="Done"
      onClose={onClose}
    >
      <input
        ref={linkRef}
        readOnly
        aria-label="Invite link"
        value={link}
        className="h-[46px] w-full rounded-lg border border-line bg-white px-3 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
      />
      <p
        role="status"
        className={
          copyStatus === 'failed' ? 'text-sm font-semibold' : 'sr-only'
        }
      >
        {copyStatus === 'copied' && 'Link copied'}
        {copyStatus === 'failed' &&
          'Could not copy the link. Copy it from the field above.'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={copyLink}>
          {copyStatus === 'copied' ? 'Copied' : 'Copy link'}
        </Button>
        <Button variant="outline" onClick={shareLink}>
          Share
        </Button>
      </div>
    </Sheet>
  )
}

export default InviteSheet
