import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'
import SectionLabel from '../components/SectionLabel.jsx'

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
      })
      .catch(() => {
        setError('Could not load this receipt.')
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

  // find the receipt from the address, like /receipts/r_pingo
  let receipt = null
  if (event) {
    for (const item of event.receipts) {
      if (item.id === receiptId) {
        receipt = item
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

          <ul className="mt-1">
            <ListRow title="Paid by" right={nameOf(receipt.payerId)} />
            <ListRow title="Date" right={formatDate(receipt.date)} />
            <ListRow
              title="Split"
              right={receipt.split === 'percent' ? 'Percentage' : 'Equal'}
            />
          </ul>

          <SectionLabel>Shares</SectionLabel>
          <ul>
            {receipt.shares.map(share => (
              <ListRow
                key={share.participantId}
                title={nameOf(share.participantId)}
                subtitle={
                  share.percent !== null ? share.percent + '%' : undefined
                }
                right={formatMoney(share.amountCents)}
              />
            ))}
          </ul>
        </>
      )}
    </Layout>
  )
}

export default ReceiptDetails