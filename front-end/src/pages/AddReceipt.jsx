import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api.js'
import Layout from '../components/Layout.jsx'

function readCents(text, allowZero) {
  const parts = text.trim().split('.')
  if (parts.length > 2 || parts[0] === '') return null

  let decimals = ''
  if (parts.length === 2) decimals = parts[1]
  if (decimals.length > 2) return null

  const digits = parts[0] + decimals
  for (const digit of digits) {
    if (digit < '0' || digit > '9') return null
  }

  if (decimals.length === 0) decimals = '00'
  if (decimals.length === 1) decimals = decimals + '0'

  const cents = Number(parts[0]) * 100 + Number(decimals)
  if (!Number.isSafeInteger(cents)) return null
  if (cents <= 0 && !allowZero) return null
  return cents
}

function money(cents) {
  let pennies = String(cents % 100)
  if (pennies.length === 1) pennies = '0' + pennies
  return '$' + Math.floor(cents / 100) + '.' + pennies
}

function AddReceipt({ addReceipt }) {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState('')
  const [payerId, setPayerId] = useState('')
  const [included, setIncluded] = useState([])
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(null)

  const [split, setSplit] = useState('equal')
  const [percentages, setPercentages] = useState([])

  useEffect(() => {
    api
      .get('/events/' + encodeURIComponent(eventId) + '.json')
      .then(response => {
        const data = response.data
        if (data.id !== eventId || !Array.isArray(data.participants)) {
          setError({ eventId, message: 'Could not load this event.' })
          return
        }

        const selected = []
        const inputs = []
        for (const person of data.participants) {
          selected.push(person.id)
          inputs.push({ id: person.id, value: '' })
        }
        setPercentages(inputs)
        setSplit('equal')

        setIncluded(selected)
        setTotal('')
        setPayerId('')
        setMessage('')
        setSaved(null)
        setError(null)
        setEvent(data)
      })
      .catch(() => {
        setError({ eventId, message: 'Could not load this event.' })
      })
  }, [eventId])

  function isIncluded(id) {
    for (const selectedId of included) {
      if (selectedId === id) return true
    }
    return false
  }

  function changeIncluded(id, checked) {
    const selected = []
    for (const selectedId of included) {
      if (selectedId !== id) selected.push(selectedId)
    }
    if (checked) selected.push(id)
    setIncluded(selected)
  }

  function getPercent(id) {
    for (const item of percentages) {
      if (item.id === id) return item.value
    }
    return ''
  }

  function changePercent(id, value) {
    const updated = []
    for (const item of percentages) {
      if (item.id === id) {
        updated.push({ id: id, value: value })
      } else {
        updated.push(item)
      }
    }
    setPercentages(updated)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (saved) return

    if (!event || event.id !== eventId || event.status !== 'active') {
      setMessage('This event is not available.')
      return
    }

    const totalCents = readCents(total)
    if (totalCents === null) {
      setMessage('Enter a positive amount with at most two decimal places.')
      return
    }

    let payerFound = false
    const people = []
    for (const person of event.participants) {
      if (person.id === payerId) payerFound = true
      if (isIncluded(person.id)) people.push(person)
    }

    if (!payerFound) {
      setMessage('Choose who paid.')
      return
    }
    if (people.length === 0) {
      setMessage('Choose at least one participant.')
      return
    }

    const shares = []

    if (split === 'equal') {
      const each = Math.floor(totalCents / people.length)
      const extra = totalCents % people.length

      for (let i = 0; i < people.length; i++) {
        let amountCents = each
        if (i < extra) amountCents = amountCents + 1
        shares.push({
          participantId: people[i].id,
          amountCents: amountCents,
          percent: null,
        })
      }
    } else {
      const units = []
      let percentageTotal = 0

      for (const person of people) {
        const value = readCents(getPercent(person.id), true)
        if (value === null || value > 10000) {
          setMessage(
            'Enter a percentage from 0 to 100 for each selected person.',
          )
          return
        }
        units.push(value)
        percentageTotal = percentageTotal + value
      }

      if (percentageTotal !== 10000) {
        setMessage('The selected percentages must add up to 100%.')
        return
      }

      let assigned = 0
      for (let i = 0; i < people.length; i++) {
        const amountCents =
          Math.floor(totalCents / 10000) * units[i] +
          Math.floor(((totalCents % 10000) * units[i]) / 10000)

        shares.push({
          participantId: people[i].id,
          amountCents: amountCents,
          percent: units[i] / 100,
        })
        assigned = assigned + amountCents
      }

      let remaining = totalCents - assigned
      for (let i = 0; i < shares.length; i++) {
        if (remaining > 0 && units[i] > 0) {
          shares[i].amountCents = shares[i].amountCents + 1
          remaining = remaining - 1
        }
      }
    }

    const now = new Date()
    let month = String(now.getMonth() + 1)
    let day = String(now.getDate())
    if (month.length === 1) month = '0' + month
    if (day.length === 1) day = '0' + day

    const receipt = {
      eventId: eventId,
      merchant: 'Shared expense',
      date: now.getFullYear() + '-' + month + '-' + day,
      totalCents: totalCents,
      payerId: payerId,
      split: split,
      photoUrl: null,
      shares: shares,
    }

    addReceipt(receipt)
    setMessage('')
    setSaved(receipt)
  }

  let content
  if (error && error.eventId === eventId) {
    content = <p role="alert">{error.message}</p>
  } else if (!event || event.id !== eventId) {
    content = <p>Loading event...</p>
  } else if (event.status !== 'active') {
    content = <p>This event is closed. New receipts cannot be added.</p>
  } else if (saved) {
    content = (
      <div className="space-y-3">
        <p>Receipt saved temporarily.</p>
        <p>Total: {money(saved.totalCents)}</p>
        <ul>
          {saved.shares.map(share => {
            let name = share.participantId
            for (const person of event.participants) {
              if (person.id === share.participantId) name = person.name
            }
            return (
              <li key={share.participantId}>
                {name}: {money(share.amountCents)}
              </li>
            )
          })}
        </ul>
        <p className="text-sm">Refreshing clears this temporary receipt.</p>
      </div>
    )
  } else {
    content = (
      <form className="space-y-5" onSubmit={handleSubmit}>
        <p>{event.name}</p>
        <label className="block">
          <span className="block font-semibold">Total (USD)</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-2 min-h-12 w-full rounded-lg border p-3"
            placeholder="0.00"
            value={total}
            onChange={e => setTotal(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block font-semibold">Who paid?</span>
          <select
            className="mt-2 min-h-12 w-full rounded-lg border p-3"
            value={payerId}
            onChange={e => setPayerId(e.target.value)}
          >
            <option value="">Choose a participant</option>
            {event.participants.map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="font-semibold">Split equally between</legend>
          {event.participants.map(person => (
            <label
              key={person.id}
              className="flex min-h-12 items-center gap-3 py-2"
            >
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isIncluded(person.id)}
                onChange={e => changeIncluded(person.id, e.target.checked)}
              />
              <span>{person.name}</span>
            </label>
          ))}

          <label className="block">
            <span className="block font-semibold">split method</span>
            <select
              className="mt-2 min-h-12 w-full rounded-lg border p-3"
              value={split}
              onChange={e => {
                setSplit(e.target.value)
                setMessage('')
              }}
            >
              <option value="equal">equl split</option>
              <option value="percent">percentage split</option>
            </select>
          </label>
        </fieldset>
        {split === 'percent' && (
          <fieldset className="space-y-3">
            <legend className="font-semibold">Percentages</legend>
            <p>The total must be 100%.</p>
            {event.participants.map(person =>
              isIncluded(person.id) ? (
                <label key={person.id} className="block">
                  <span>{person.name} (%)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-2 min-h-12 w-full rounded-lg border p-3"
                    value={getPercent(person.id)}
                    onChange={e => changePercent(person.id, e.target.value)}
                  />
                </label>
              ) : null,
            )}
          </fieldset>
        )}
        {message && <p role="alert">{message}</p>}
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white"
        >
          Save receipt
        </button>
      </form>
    )
  }

  return (
    <Layout
      title="Add receipt"
      left={<Link to={'/events/' + eventId}>Cancel</Link>}
    >
      <h1 className="text-heading font-bold">Add receipt</h1>
      <div className="mt-4">{content}</div>
    </Layout>
  )
}

export default AddReceipt
