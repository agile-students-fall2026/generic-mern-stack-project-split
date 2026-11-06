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

// Keep monetary amounts intact: merging identities must not re-split receipts.
function mergeParticipants(event, sourceId, targetId) {
  const source = event.participants.find(person => person.id === sourceId)
  const target = event.participants.find(person => person.id === targetId)
  if (
    !source ||
    !target ||
    sourceId === targetId ||
    source.role === 'organizer'
  ) {
    return event
  }
  const resolveId = id => (id === sourceId ? targetId : id)
  return {
    ...event,
    participants: event.participants.filter(person => person.id !== sourceId),
    receipts: event.receipts.map(receipt => {
      const shares = []
      for (const share of receipt.shares) {
        const participantId = resolveId(share.participantId)
        const existing = shares.find(
          item => item.participantId === participantId,
        )
        if (existing) {
          existing.amountCents += share.amountCents
          if (existing.percent != null && share.percent != null) {
            existing.percent += share.percent
          }
        } else {
          shares.push({ ...share, participantId })
        }
      }
      return { ...receipt, payerId: resolveId(receipt.payerId), shares }
    }),
    balances: event.balances
      .filter(balance => balance.participantId !== sourceId)
      .map(balance => {
        if (balance.participantId !== targetId) return balance
        const sourceBalance = event.balances.find(
          item => item.participantId === sourceId,
        )
        return {
          ...balance,
          paidCents: balance.paidCents + (sourceBalance?.paidCents ?? 0),
          shareCents: balance.shareCents + (sourceBalance?.shareCents ?? 0),
          netCents: balance.netCents + (sourceBalance?.netCents ?? 0),
        }
      }),
    // Preserve individual records and their statuses, including internal transfers.
    // A shared settlement service will need to distinguish history from new plans.
    settlement: Object.fromEntries(
      Object.entries(event.settlement).map(([plan, payments]) => [
        plan,
        payments.map(payment => ({
          ...payment,
          fromId: resolveId(payment.fromId),
          toId: resolveId(payment.toId),
        })),
      ]),
    ),
  }
}

function People() {
  const { eventId } = useParams()

  // data loaded from the mock files
  const [event, setEvent] = useState(null)
  const participants = event?.participants ?? []
  const [error, setError] = useState('')

  // the person whose Options menu is open (null means closed)
  const [selected, setSelected] = useState(null)

  // the rename dialog: is it open, what is typed, and any error
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [mergeOpen, setMergeOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [confirmMergeOpen, setConfirmMergeOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const target = participants.find(person => person.id === targetId)

  // load the event when the page opens
  useEffect(() => {
    let cancelled = false
    api
      .get(`/events/${encodeURIComponent(eventId)}.json`)
      .then(response => {
        if (cancelled) return
        setEvent(response.data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this event.')
      })
    return () => {
      cancelled = true
    }
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
    setEvent({ ...event, participants: updated })
    closeRename()
  }

  function closeMerge() {
    setMergeOpen(false)
    setConfirmMergeOpen(false)
    setTargetId('')
    setSelected(null)
  }

  function saveMerge() {
    if (!selected || !target) return
    setEvent(current => mergeParticipants(current, selected.id, target.id))
    setNotice(`${selected.name} merged into ${target.name}`)
    closeMerge()
  }

  // the organizer is "you" for now, since only the organizer sees this page
  const organizer = participants.find(person => person.role === 'organizer')

  return (
    <Layout
      title={mergeOpen ? 'Merge' : event ? event.name : 'People'}
      subtitle={!mergeOpen && organizer ? 'You: ' + organizer.name : undefined}
      left={
        mergeOpen ? (
          <button onClick={closeMerge}>Cancel</button>
        ) : (
          <Link to="/">Back</Link>
        )
      }
      nav={!mergeOpen && <BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        {mergeOpen ? `Merge ${selected.name} into…` : 'People'}
      </h1>

      {error && <p className="mt-2 font-semibold">{error}</p>}

      {!event && !error && <p className="mt-2 text-muted">Loading people…</p>}

      {mergeOpen && (
        <>
          <p className="mt-2 text-body text-muted">
            Pick the person {selected.name} really is. Their receipts and
            payments will move to that person.
          </p>
          <fieldset className="mt-4">
            <legend className="sr-only">Merge into</legend>
            {participants
              .filter(person => person.id !== selected.id)
              .map(person => (
                <label
                  key={person.id}
                  className="flex min-h-16 cursor-pointer items-center gap-3 border-b border-line py-3"
                >
                  <input
                    type="radio"
                    name="merge-target"
                    value={person.id}
                    checked={targetId === person.id}
                    onChange={() => setTargetId(person.id)}
                    className="h-5 w-5 accent-black"
                  />
                  <span>
                    <span className="block font-semibold">{person.name}</span>
                    {person.name.trim().split(/\s+/)[0].toLowerCase() ===
                      selected.name.trim().split(/\s+/)[0].toLowerCase() && (
                      <span className="block text-body text-muted">
                        Same first name
                      </span>
                    )}
                  </span>
                </label>
              ))}
          </fieldset>
          <Button
            className="mt-4 w-full"
            disabled={!target}
            onClick={() => setConfirmMergeOpen(true)}
          >
            Continue
          </Button>
        </>
      )}

      {event && !mergeOpen && (
        <>
          {notice && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-line bg-surface p-3 font-semibold"
            >
              {notice}
            </p>
          )}
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
                      onClick={() => {
                        setSelected(person)
                        setNotice('')
                      }}
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
      {selected && !renameOpen && !mergeOpen && (
        <Sheet
          title={selected.name}
          description={getSubtitle(selected, event.receipts)}
          onClose={() => setSelected(null)}
        >
          <Button variant="outline" onClick={openRename}>
            Rename
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTargetId('')
              setMergeOpen(true)
            }}
          >
            Merge into…
          </Button>
        </Sheet>
      )}

      {confirmMergeOpen && target && (
        <ConfirmDialog
          title={`Merge ${selected.name} into ${target.name}?`}
          description={`${selected.name} will be removed. Their receipts and payments move to ${target.name}. This can't be undone.`}
          confirmLabel="Merge"
          onConfirm={saveMerge}
          onClose={() => setConfirmMergeOpen(false)}
        />
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