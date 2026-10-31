import { useId } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

// Bottom sheet, also used for every menu (Account, event Menu, Invite people).
// children are the sheet's buttons or fields; closeLabel is "Cancel" or "Done".
function Sheet({
  title,
  description,
  closeLabel = 'Cancel',
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
      className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-2xl"
    >
      <div className="px-4 pt-2.5 pb-10">
        <div className="mx-auto h-[5px] w-9 rounded-full bg-track" />
        <h2 id={titleId} className="mt-2.5 text-xl font-bold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2.5 text-body text-muted">
            {description}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-3">{children}</div>
        <Button variant="text" className="mt-3.5" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default Sheet
