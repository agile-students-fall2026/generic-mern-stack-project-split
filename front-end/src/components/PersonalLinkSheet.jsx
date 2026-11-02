import Sheet from './Sheet.jsx'

function PersonalLinkSheet({ participantName, returnToken, onClose }) {
  const returnPath = '/r/' + returnToken

  return (
    <Sheet title="Your personal link" closeLabel="Done" onClose={onClose}>
      <p>{participantName}</p>
      <p>{returnPath}</p>
      <p>Select the path above and copy it manually.</p>
    </Sheet>
  )
}

export default PersonalLinkSheet
