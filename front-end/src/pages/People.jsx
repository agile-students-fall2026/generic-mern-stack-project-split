import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'
import Button from '../components/Button.jsx'
import Sheet from '../components/Sheet.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import TextField from '../components/TextField.jsx'

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

  // is this person the payer or in the split of any receipt?
  let onAReceipt = false
  for (const receipt of receipts) {
    if (receipt.payerId === person.id) {
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

  // the person whose Options menu is open (null means closed)
  const [selected, setSelected] = useState(null)

  // the rename dialog: is it open, what is typed, and any error
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')

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

  function openRename() {
    setNewName(selected.name)
    setNameError('')
    setRenameOpen(true)
  }

  function closeRename() {
    setRenameOpen(false)
    setSelected(null)
  }

  function saveRename() {
    if (newName.trim() === '') {
      setNameError('Enter a name.')
      return
    }
    // make a new list where only the selected person has the new name
    const updated = participants.map(person =>
      person.id === selected.id ? { ...person, name: newName.trim() } : person,
    )
    setParticipants(updated)
    closeRename()
  }

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
                right={
                  person.role !== 'organizer' && (
                    <Button
                      variant="outline"
                      small
                      onClick={() => setSelected(person)}
                    >
                      Options
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        </>
      )}

      {/* Options menu (wireframe 32) */}
      {selected && !renameOpen && (
        <Sheet
          title={selected.name}
          description={getSubtitle(selected, event.receipts)}
          onClose={() => setSelected(null)}
        >
          <Button variant="outline" onClick={openRename}>
            Rename
          </Button>
          {/* Merge into is built in #53 */}
          <Button variant="outline">Merge into…</Button>
        </Sheet>
      )}

      {/* Rename dialog (wireframe 33) */}
      {renameOpen && (
        <ConfirmDialog
          title="Rename participant"
          confirmLabel="Save"
          onConfirm={saveRename}
          onClose={closeRename}
        >
          <TextField
            label="Name"
            value={newName}
            onChange={e => {
              setNewName(e.target.value)
              setNameError('')
            }}
            error={nameError}
          />
        </ConfirmDialog>
      )}
    </Layout>
  )
}

export default People