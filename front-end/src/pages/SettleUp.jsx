import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
// import ListRow from '../components/ListRow.jsx'

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

  // "you" for me, otherwise the person's name. Example: nameOf('p_sam') is "Sam"
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

  function rowTitle(transfer) {
    return 'TODO ' + nameOf(transfer.fromId)
  }

  function rowSubtitle(transfer) {
    return 'TODO ' + transfer.status
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

          {/* TODO if event.settlement.all is empty, show
              "No payments yet. Add receipts to see who owes whom." */}

          {/* TODO 
              Look at People.jsx for the same pattern. */}
          <ul className="mt-4">
            {event.settlement.all.map(transfer => (
              <li key={transfer.fromId + '-' + transfer.toId}>
                {rowTitle(transfer)} / {rowSubtitle(transfer)} /{' '}
                {formatMoney(transfer.amountCents)}
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  )
}

export default SettleUp