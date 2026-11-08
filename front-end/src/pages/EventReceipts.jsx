import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import InviteSheet from '../components/InviteSheet.jsx'
// TODO:
// import ListRow from '../components/ListRow.jsx'
// import Button from '../components/Button.jsx'
// import EmptyState from '../components/EmptyState.jsx'

// Turns 3600 (cents) into "$36.00"
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}
 
// Turns "2026-10-13" into "Oct 13"
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function EventReceipts() {
  const { eventId } = useParams()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  // set by Create event, so a new event opens with the invite sheet
  const invite = state?.invite
 
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
 
  // the name of a participant, from their id
  function nameOf(participantId) {
    for (const person of event.participants) {
      if (person.id === participantId) {
        return person.name
      }
    }
    return 'Someone'
  }
 
  // TODO: add up every receipt's totalCents into totalCents.
  let totalCents = 0
 
  return (
    <Layout
      title={event ? event.name : 'Receipts'}
      subtitle={me ? 'You: ' + me.name : undefined}
      left={<Link to="/">Back</Link>}
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 tabIndex={-1} className="text-heading font-bold">
        Receipts
      </h1>
 
      {error && <p className="mt-2 font-semibold">{error}</p>}
 
      {!event && !error && <p className="mt-2 text-muted">Loading receipts…</p>}
 
      {/* TODO: no receipts yet (wireframe 12) */}
 
      {/* TODO: the receipt list (wireframes 20 and 30) */}
      
      {event && (
        <ul className="mt-4">
          {event.receipts.map(receipt => (
            <li key={receipt.id}>
              {receipt.merchant} / {nameOf(receipt.payerId)} /{' '}
              {formatDate(receipt.date)} / {formatMoney(receipt.totalCents)}
            </li>
          ))}
          <li>Total so far: {formatMoney(totalCents)}</li>
        </ul>
      )}
 
      {invite && (
        <InviteSheet
          eventName={invite.eventName}
          inviteCode={invite.inviteCode}
          // drop the state so Back or a reload doesn't reopen the sheet
          onClose={() => navigate(pathname, { replace: true })}
        />
      )}
    </Layout>
  )
}
 
export default EventReceipts