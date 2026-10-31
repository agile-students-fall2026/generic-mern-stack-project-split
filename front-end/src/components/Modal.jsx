import { useEffect, useRef } from 'react'

// Shared shell for Sheet and Dialog. Render it only while it is open.
// showModal() gives role="dialog", aria-modal, the backdrop, and keeps focus
// inside; this adds Escape and backdrop close and gives focus back on close.
function Modal({ titleId, descriptionId, onClose, className, children }) {
  const dialogRef = useRef(null)
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      // the opener can be gone by now (e.g. the form that opened it), so fall
      // back to the page heading; give that h1 tabIndex={-1} to make it focusable
      const target =
        opener?.isConnected && opener !== document.body
          ? opener
          : document.querySelector('main h1')
      target?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`bg-white p-0 text-ink backdrop:bg-black/45 ${className}`}
      onCancel={event => {
        // let the parent unmount us instead of the browser hiding the dialog
        event.preventDefault()
        onClose()
      }}
      onPointerDown={event => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={event => {
        // the dialog element itself is only hit on the backdrop; also require the
        // press to start there, so a text selection dragged outside doesn't close it
        if (pressedBackdrop.current && event.target === event.currentTarget)
          onClose()
      }}
    >
      {children}
    </dialog>
  )
}

export default Modal
