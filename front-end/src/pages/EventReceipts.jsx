import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import InviteSheet from '../components/InviteSheet.jsx'
import ListRow from '../components/ListRow.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'

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

  let totalCents = 0
  if (event) {
    for (const receipt of event.receipts) {
      totalCents = totalCents + receipt.totalCents
    }
  }

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

      {/* no receipts yet (wireframe 12) */}
      {event && event.receipts.length === 0 && (
        <EmptyState
          title="No receipts yet"
          description={'Add the first shared expense for ' + event.name + '.'}
        >
          <Button to={`/events/${eventId}/receipts/new`}>Add receipt</Button>
        </EmptyState>
      )}

      {/* the receipt list (wireframes 20 and 30) */}
      {event && event.receipts.length > 0 && (
        <>
          <p className="mt-2 text-body text-muted">
            {event.receipts.length}{' '}
            {event.receipts.length === 1 ? 'receipt' : 'receipts'} ·{' '}
            {formatMoney(totalCents)} total
          </p>
          <Button to={`/events/${eventId}/receipts/new`} className="mt-4">
            Add receipt
          </Button>
          <ul className="mt-1">
            {event.receipts.map(receipt => (
              <ListRow
                key={receipt.id}
                title={receipt.merchant}
                subtitle={
                  'Paid by ' +
                  nameOf(receipt.payerId) +
                  ' · ' +
                  formatDate(receipt.date)
                }
                right={formatMoney(receipt.totalCents)}
                to={`/events/${eventId}/receipts/${receipt.id}`}
              />
            ))}
          </ul>
        </>
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
