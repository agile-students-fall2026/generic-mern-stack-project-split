import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'
// import Button from '../components/Button.jsx'
// import Sheet from '../components/Sheet.jsx'
// import ConfirmDialog from '../components/ConfirmDialog.jsx'
// import TextField from '../components/TextField.jsx'

// Turns "2026-10-14" into "Oct 14"
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// The grey line under each name, like "Joined Oct 14 · no receipts"
function getSubtitle(person, receipts) {
  if (person.role === 'organizer') {
    return 'Organizer · you'
  }

  // find out if this person is on any receipt.
  // A person is "on a receipt" if receipt.payerId is their id,
  // OR if any share in receipt.shares has participantId equal to their id.

  let onAReceipt = false
  for (const receipt of receipts) {
    if (receipt.playerId === person.id) {
      onAReceipt = true
    }
    for (const share of receipt.shares) {
      if (share.participantId === person.id) {
        onAReceipt = true
      }
    }
  }

  const joined = 'Joined ' + formatDate(person.joinedAt)
  return onAReceipt ? joined : joined + ' · no receipts'
}

function People() {
  const { eventId } = useParams()

  // data loaded from the mock files
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [error, setError] = useState('')

  // add state for the person whose Options menu is open.
  // It should start as null, which means "no menu open".

  // TODO: add state for the rename dialog:
  //   renameOpen (true or false), newName (text), nameError (text)

  // load the event when the page opens
  useEffect(() => {
    api
      .get(`/events/${encodeURIComponent(eventId)}.json`)
      .then(response => {
        setEvent(response.data)
        setParticipants(response.data.participants)
      })
      .catch(() => {
        setError('Could not load this event.')
      })
  }, [eventId])

  // TODO: write openRename()

  // TODO: write closeRename()

  // TODO: write saveRename()
  //   if newName is empty (after .trim()), set nameError to 'Enter a name.'
  //   and stop. Otherwise build a NEW list where only the selected person
  //   has the new name, save it with setParticipants, then closeRename().

  // the organizer is "you" for now, since only the organizer sees this page
  const organizer = participants.find(person => person.role === 'organizer')

  return (
    <Layout
      title={event ? event.name : 'People'}
      subtitle={organizer ? 'You: ' + organizer.name : undefined}
      left={<Link to="/">Back</Link>}
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        People
      </h1>

      {error && <p className="mt-2 font-semibold">{error}</p>}

      {!event && !error && <p className="mt-2 text-muted">Loading people…</p>}

      {event && (
        <>
          <p className="mt-2 text-body text-muted">
            {participants.length}{' '}
            {participants.length === 1 ? 'person' : 'people'} in this event
          </p>
          <ul className="mt-1">
            {participants.map(person => (
              <ListRow
                key={person.id}
                title={person.name}
                subtitle={getSubtitle(person, event.receipts)}
                // TODO: add right={...} with a small outline Button
                // that says Options. Only show it when the person is NOT the
                // organizer. Clicking it should remember this person in state.
              />
            ))}
          </ul>
        </>
      )}

      {/* TODO: Options menu (wireframe 32)
          Show a <Sheet> only while a person is selected (and rename is closed).
          title: the person's name
          description: getSubtitle(...) for that person
          onClose: clear the selected person
          Inside: two outline Buttons, "Rename" (runs openRename)
          and "Merge into…" (does nothing yet, that is #53) */}

      {/* TODO: Rename dialog (wireframe 33)
          Show a <ConfirmDialog> only while renameOpen is true.
          title "Rename participant", confirmLabel "Save",
          onConfirm runs saveRename, onClose runs closeRename.
          Inside: a <TextField> with label "Name", value newName,
          onChange that updates newName and clears nameError,
          and error={nameError} */}
    </Layout>
  )
}

export default People