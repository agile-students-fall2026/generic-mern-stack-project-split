import { useEffect, useState } from 'react'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import ListRow from '../components/ListRow.jsx'

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
  const dates =
    event.status === 'closed'
      ? `Closed ${shortDate.format(new Date(event.closedAt))}`
      : shortDate
          .formatRange(new Date(event.startDate), new Date(event.endDate))
          // same month: "Oct 10–14", not "Oct 10 – 14"
          .replace(/(\d)\s–\s(\d)/, '$1–$2')
  const people = event.participantCount === 1 ? 'person' : 'people'
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
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

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
        <button type="button" className="py-2">
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
            events.filter(event => event.status === 'active'),
            'No active events.',
          )}
          <SectionLabel>Past</SectionLabel>
          {renderEventList(
            events.filter(event => event.status === 'closed'),
            'No past events yet.',
          )}
        </>
      )}
    </Layout>
  )
}

export default MyEvents
