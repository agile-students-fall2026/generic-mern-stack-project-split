import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

// Turns 2100 (cents) into "$21.00"
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function SettleUp() {
  const { eventId } = useParams()

  // data loaded from the mock files
  const [event, setEvent] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [transfers, setTransfers] = useState([])
  const [confirming, setConfirming] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const { joinedAs } = useContext(JoinedEventsContext)

  // load the event and the signed in user when the page opens
  useEffect(() => {
    Promise.all([
      api.get(`/events/${encodeURIComponent(eventId)}.json`),
      api.get('/user.json'),
    ])
      .then(([eventResponse, userResponse]) => {
        setEvent(eventResponse.data)
        setUser(userResponse.data)
        setTransfers(eventResponse.data.settlement.all)
      })
      .catch(() => {
        setError('Could not load this event.')
      })
  }, [eventId])

  // which participant in this event is me: the guest I joined as in this
  // session, otherwise the signed in user
  const joinedId = joinedAs[eventId]
  let me = null
  if (event && user) {
    for (const person of event.participants) {
      if (joinedId ? person.id === joinedId : person.userId === user.id) {
        me = person
      }
    }
  }

  // "you" for me, otherwise the person's name
  function nameOf(participantId) {
    if (me && participantId === me.id) {
      return 'you'
    }
    for (const person of event.participants) {
      if (person.id === participantId) {
        return person.name
      }
    }
    return 'Someone'
  }

  // "You pay Alex", "Sam pays you", "Sam pays Jordan"
  function rowTitle(transfer) {
    const from = nameOf(transfer.fromId)
    const to = nameOf(transfer.toId)
    if (from === 'you') {
      return 'You pay ' + to
    }
    return from + ' pays ' + to
  }

  // the grey status line under each payment
  function rowSubtitle(transfer) {
    if (transfer.status === 'confirmed') {
      return 'Settled'
    }
    if (transfer.status === 'pending' && me && transfer.toId === me.id) {
      return nameOf(transfer.fromId) + ' marked this paid'
    }
    if (transfer.status === 'pending') {
      return 'Pending – waiting for ' + nameOf(transfer.toId)
    }
    // unpaid
    if (me && transfer.fromId === me.id) {
      return 'You owe this'
    }
    if (me && transfer.toId === me.id) {
      return 'Waiting for ' + nameOf(transfer.fromId) + ' to pay'
    }
    return 'Not paid yet'
  }

  // the small button under the amount, only on payments waiting on me
  function rowButton(transfer) {
    if (transfer.status === 'pending' && me && transfer.toId === me.id) {
      return (
        <Button small onClick={() => setConfirming(transfer)}>
          Confirm received
        </Button>
      )
    }
    if (transfer.status === 'unpaid' && me && transfer.fromId === me.id) {
      return (
        <Button small onClick={() => setMarkingPaid(transfer)}>
          Mark paid
        </Button>
      )
    }
    return null
  }

  // change the status of one payment, keeping it the same row
  function setStatus(target, status) {
    const updated = transfers.map(transfer => {
      if (transfer.fromId === target.fromId && transfer.toId === target.toId) {
        return { ...transfer, status: status }
      }
      return transfer
    })
    setTransfers(updated)
  }

  // mark the payment in the dialog as settled (wireframe 28)
  function confirmPayment() {
    setStatus(confirming, 'confirmed')
    setConfirming(null)
  }

  // I paid outside the app, now it waits for the other person (wireframe 26)
  function markPaid() {
    setStatus(markingPaid, 'pending')
    setAnnouncement(
      'Marked ' +
        formatMoney(markingPaid.amountCents) +
        ' to ' +
        nameOf(markingPaid.toId) +
        ' as paid. Waiting for ' +
        nameOf(markingPaid.toId) +
        ' to confirm.',
    )
    setMarkingPaid(null)
  }

  return (
    <Layout
      title={event ? event.name : 'Settle up'}
      subtitle={me ? 'You: ' + me.name : undefined}
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        Settle up
      </h1>

      {error && <p className="mt-2 font-semibold">{error}</p>}

      {!event && !error && <p className="mt-2 text-muted">Loading payments…</p>}

      {event && (
        <>
          <p className="mt-2 text-body text-muted">
            Pay each other outside the app, then mark it here.
          </p>
          {transfers.length === 0 && (
            <p className="mt-4 text-body text-muted">
              No payments yet. Add receipts to see who owes whom.
            </p>
          )}
          <ul className="mt-1">
            {transfers.map(transfer => (
              <ListRow
                key={transfer.fromId + '-' + transfer.toId}
                title={rowTitle(transfer)}
                subtitle={rowSubtitle(transfer)}
                right={
                  <div className="flex flex-col items-end gap-2">
                    {formatMoney(transfer.amountCents)}
                    {rowButton(transfer)}
                  </div>
                }
              />
            ))}
          </ul>
          <p role="status" className="sr-only">
            {announcement}
          </p>
        </>
      )}

      {markingPaid && (
        <ConfirmDialog
          title={
            'Mark ' +
            formatMoney(markingPaid.amountCents) +
            ' to ' +
            nameOf(markingPaid.toId) +
            ' as paid?'
          }
          description={
            'Only do this after you’ve paid ' +
            nameOf(markingPaid.toId) +
            ' outside the app. ' +
            nameOf(markingPaid.toId) +
            ' will be asked to confirm it.'
          }
          confirmLabel="Mark paid"
          onConfirm={markPaid}
          onClose={() => setMarkingPaid(null)}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={
            'Confirm ' +
            formatMoney(confirming.amountCents) +
            ' from ' +
            nameOf(confirming.fromId) +
            '?'
          }
          description="Confirm only once the money has arrived. This settles the payment for everyone."
          confirmLabel="Confirm"
          onConfirm={confirmPayment}
          onClose={() => setConfirming(null)}
        />
      )}
    </Layout>
  )
}

export default SettleUp
