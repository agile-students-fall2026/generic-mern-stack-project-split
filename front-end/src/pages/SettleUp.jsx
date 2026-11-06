import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'

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

  // load the event and the signed in user when the page opens
  useEffect(() => {
    Promise.all([
      api.get(`/events/${encodeURIComponent(eventId)}.json`),
      api.get('/user.json'),
    ])
      .then(([eventResponse, userResponse]) => {
        setEvent(eventResponse.data)
        setUser(userResponse.data)
      })
      .catch(() => {
        setError('Could not load this event.')
      })
  }, [eventId])

  // which participant in this event is the signed in user
  let me = null
  if (event && user) {
    for (const person of event.participants) {
      if (person.userId === user.id) {
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
          {event.settlement.all.length === 0 && (
            <p className="mt-4 text-body text-muted">
              No payments yet. Add receipts to see who owes whom.
            </p>
          )}
          <ul className="mt-1">
            {event.settlement.all.map(transfer => (
              <ListRow
                key={transfer.fromId + '-' + transfer.toId}
                title={rowTitle(transfer)}
                subtitle={rowSubtitle(transfer)}
                right={formatMoney(transfer.amountCents)}
              />
            ))}
          </ul>
        </>
      )}
    </Layout>
  )
}

export default SettleUp
