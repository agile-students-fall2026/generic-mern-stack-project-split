import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
// import ListRow from '../components/ListRow.jsx'
// import SectionLabel from '../components/SectionLabel.jsx'

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

function ReceiptDetails() {
  const { eventId, receiptId } = useParams()

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
        setError('Could not load this receipt.')
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

  // TODO: find the receipt whose id matches receiptId
  console.log('looking for receipt', receiptId)
  let receipt = event ? event.receipts[0] : null

  // the name of a participant, from their id
  function nameOf(participantId) {
    for (const person of event.participants) {
      if (person.id === participantId) {
        return person.name
      }
    }
    return 'Someone'
  }

  return (
    <Layout
      title={event ? event.name : 'Receipt'}
      subtitle={me ? 'You: ' + me.name : undefined}
      left={<Link to={`/events/${eventId}`}>Back</Link>}
      nav={<BottomNav eventId={eventId} />}
    >
      {error && <p className="font-semibold">{error}</p>}

      {!event && !error && <p className="text-muted">Loading receipt…</p>}

      {event && !receipt && (
        <p className="font-semibold">This receipt doesn't exist.</p>
      )}

      {receipt && (
        <>
          <h1 tabIndex={-1} className="text-heading font-bold">
            {receipt.merchant}
          </h1>
          <p className="mt-2 text-[32px] leading-10 font-bold">
            {formatMoney(receipt.totalCents)}
          </p>

          {/* TODO: a <ul> with three <ListRow> */ }

          {/* TODO: <SectionLabel>Shares</SectionLabel>, then a <ul>
              that maps over receipt.shares and draws one <ListRow> each. */}
              
          <ul className="mt-4">
            <li>
              {nameOf(receipt.payerId)} / {formatDate(receipt.date)} /{' '}
              {receipt.split}
            </li>
            {receipt.shares.map(share => (
              <li key={share.participantId}>
                {nameOf(share.participantId)} / {formatMoney(share.amountCents)}
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  )
}

export default ReceiptDetails