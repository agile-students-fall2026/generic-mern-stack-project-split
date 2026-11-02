import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import CreatedEventsContext from '../CreatedEventsContext.js'
import Layout from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import ListRow from '../components/ListRow.jsx'
import Sheet from '../components/Sheet.jsx'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})
// Mock dates are plain YYYY-MM-DD, which JavaScript reads as UTC midnight
const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function eventSubtitle(event) {
  const people = event.participantCount === 1 ? 'person' : 'people'
  // a new event has no dates until its first receipt
  if (event.status === 'active' && !event.startDate) {
    return `${event.participantCount} ${people}`
  }
  const dates =
    event.status === 'closed'
      ? `Closed ${shortDate.format(new Date(event.closedAt))}`
      : shortDate
          .formatRange(new Date(event.startDate), new Date(event.endDate))
          // same month: "Oct 10–14", not "Oct 10 – 14"
          .replace(/(\d)\s–\s(\d)/, '$1–$2')
  return `${dates} · ${event.participantCount} ${people}`
}

function renderEventList(events, emptyText) {
  if (events.length === 0) {
    return <p className="mt-3.5 text-body text-muted">{emptyText}</p>
  }
  return (
    <ul>
      {events.map(event => (
        <ListRow
          key={event.id}
          title={event.name}
          subtitle={eventSubtitle(event)}
          right={money.format(event.totalCents / 100)}
          to={`/events/${event.id}`}
        />
      ))}
    </ul>
  )
}

function MyEvents() {
  const [events, setEvents] = useState([])
  const { createdEvents } = useContext(CreatedEventsContext)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)

  // the signed in account, for "Signed in as" in the Account menu
  useEffect(() => {
    let ignore = false
    api
      .get('/user.json')
      .then(response => {
        if (!ignore) setUser(response.data)
      })
      // without it the menu still offers Sign out, just without the email
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  function signOut() {
    // stands in for POST /auth/sign-out; replace, so Back doesn't return here
    navigate('/sign-in', { replace: true })
  }

  useEffect(() => {
    let ignore = false
    api
      .get('/events.json')
      .then(response => {
        if (!ignore) setEvents(response.data)
      })
      .catch(() => {
        if (!ignore) setError('Could not load your events.')
      })
      .finally(() => {
        if (!ignore) setLoaded(true)
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <Layout
      title="My events"
      right={
        <button
          type="button"
          className="py-2"
          onClick={() => setAccountOpen(true)}
        >
          Account
        </button>
      }
    >
      <h1 className="sr-only">My events</h1>
      <Button to="/events/new">Create event</Button>
      {!loaded ? (
        <p role="status" className="mt-4 text-body text-muted">
          Loading events…
        </p>
      ) : error ? (
        <p role="alert" className="mt-4 text-body font-semibold">
          {error}
        </p>
      ) : (
        <>
          <SectionLabel>Active</SectionLabel>
          {renderEventList(
            [...createdEvents, ...events].filter(
              event => event.status === 'active',
            ),
            'No active events.',
          )}
          <SectionLabel>Past</SectionLabel>
          {renderEventList(
            events.filter(event => event.status === 'closed'),
            'No past events yet.',
          )}
        </>
      )}
      {accountOpen && (
        <Sheet
          title="Account"
          description={user ? `Signed in as ${user.email}` : undefined}
          onClose={() => setAccountOpen(false)}
        >
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </Sheet>
      )}
    </Layout>
  )
}

export default MyEvents