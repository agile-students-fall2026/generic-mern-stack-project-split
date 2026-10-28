import { useEffect, useRef } from 'react'

// Shared shell for Sheet and Dialog. Render it only while it is open.
// showModal() gives role="dialog", aria-modal, the backdrop, and keeps focus
// inside; this adds Escape and backdrop close and gives focus back on close.
function Modal({ titleId, descriptionId, onClose, className, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      opener?.focus()
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
      onClick={event => {
        // the dialog element itself is only hit when clicking the backdrop
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {children}
    </dialog>
  )
}

export default Modal
