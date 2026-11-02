import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ListRow from '../components/ListRow.jsx'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function balanceLabel(netCents) {
  if (netCents > 0) return `is owed ${money.format(netCents / 100)}`
  if (netCents < 0) return `owes ${money.format(Math.abs(netCents) / 100)}`
  return 'settled up'
}

function Balances() {
  const { eventId } = useParams()
  const [result, setResult] = useState(null)

  useEffect(() => {
    let ignore = false
    api
      .get(`/events/${encodeURIComponent(eventId)}.json`)
      .then(response => {
        if (!ignore) setResult({ eventId, event: response.data })
      })
      .catch(() => {
        if (!ignore)
          setResult({
            eventId,
            error: 'Could not load balances for this event.',
          })
      })
    return () => {
      ignore = true
    }
  }, [eventId])

  const loaded = result?.eventId === eventId
  const event = loaded ? result.event : null
  const totalCents = event?.receipts.reduce(
    (total, receipt) => total + receipt.totalCents,
    0,
  )

  return (
    <Layout
      title={event?.name ?? 'Balances'}
      nav={<BottomNav eventId={eventId} />}
    >
      <h1 className="text-heading font-bold">Balances</h1>
      {!loaded ? (
        <p role="status" className="mt-4 text-body text-muted">
          Loading balances…
        </p>
      ) : result.error ? (
        <p role="alert" className="mt-4 text-body font-semibold">
          {result.error}
        </p>
      ) : (
        <>
          <p className="mt-2 text-body text-muted">
            Across {event.receipts.length}{' '}
            {event.receipts.length === 1 ? 'receipt' : 'receipts'} ·{' '}
            {money.format(totalCents / 100)} total
          </p>
          <ul>
            {event.participants.map(participant => {
              const balance = event.balances.find(
                item => item.participantId === participant.id,
              )
              return (
                <ListRow
                  key={participant.id}
                  title={participant.name}
                  subtitle={
                    balance
                      ? `Paid ${money.format(balance.paidCents / 100)} · Share ${money.format(balance.shareCents / 100)}`
                      : undefined
                  }
                  right={
                    balance
                      ? balanceLabel(balance.netCents)
                      : 'Balance unavailable'
                  }
                />
              )
            })}
          </ul>
        </>
      )}
    </Layout>
  )
}

export default Balances
