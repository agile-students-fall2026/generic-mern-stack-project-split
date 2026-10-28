import { useId } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

// Centered "are you sure" dialog with Cancel and a confirm button.
// children go between the text and the buttons, e.g. the rename field.
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  children,
}) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Modal
      titleId={titleId}
      descriptionId={description ? descriptionId : undefined}
      onClose={onClose}
      className="m-auto w-[calc(100%-64px)] max-w-[329px] rounded-2xl"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-3 text-body text-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
