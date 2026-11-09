import { useState } from 'react'
import Sheet from './Sheet.jsx'
import Button from './Button.jsx'

function PersonalLinkSheet({ participantName, returnToken, onClose }) {
  const [copyStatus, setCopyStatus] = useState('')
  const link = `${window.location.origin}/r/${encodeURIComponent(returnToken)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <Sheet
      title="Your personal link"
      description={`Open this link on any device to come back as ${participantName}. Keep it to yourself. New people should use the invite link instead.`}
      closeLabel="Done"
      onClose={onClose}
    >
      <input
        readOnly
        aria-label="Personal return link"
        value={link}
        className="h-[46px] w-full rounded-lg border border-line bg-white px-3 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-hidden"
      />
      <Button onClick={copyLink}>
        {copyStatus === 'copied' ? 'Copied' : 'Copy link'}
      </Button>
      <p role="status" className="text-sm text-muted">
        {copyStatus === 'copied' && 'Link copied'}
        {copyStatus === 'failed' &&
          'Could not copy the link. Copy it from the field above.'}
      </p>
    </Sheet>
  )
}

export default PersonalLinkSheet
