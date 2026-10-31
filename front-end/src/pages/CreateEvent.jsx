import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api.js'
import CreatedEventsContext from '../CreatedEventsContext.js'
import Layout from '../components/Layout.jsx'
import TextField from '../components/TextField.jsx'
import Button from '../components/Button.jsx'

function CreateEvent() {
  const navigate = useNavigate()
  const { addEvent } = useContext(CreatedEventsContext)
  const nameRef = useRef(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const requestRef = useRef(null)

  // leaving with Cancel while saving must not jump to the new event afterwards
  useEffect(() => () => requestRef.current?.abort(), [])

  function handleSubmit(event) {
    event.preventDefault()
    const eventName = name.trim()
    if (!eventName) {
      setNameError('Enter a name for your event.')
      nameRef.current.focus()
      return
    }
    setSaving(true)
    setSubmitError('')
    requestRef.current = new AbortController()
    // stands in for POST /events; the reply gives the new id and invite code
    api
      .get('/create-event.json', { signal: requestRef.current.signal })
      .then(response => {
        addEvent({ ...response.data, name: eventName })
        // replace, so Back from the new event goes to My events, not this form
        navigate(`/events/${response.data.id}`, {
          replace: true,
          state: {
            invite: { eventName, inviteCode: response.data.inviteCode },
          },
        })
      })
      .catch(() => {
        setSubmitError('Could not create the event. Try again.')
        setSaving(false)
      })
  }

  return (
    <Layout title="New event" left={<Link to="/">Cancel</Link>}>
      <h1 className="text-heading font-bold">Create an event</h1>
      <form noValidate onSubmit={handleSubmit} className="mt-4">
        <TextField
          ref={nameRef}
          label="Event name"
          placeholder="e.g. Lisbon trip"
          autoComplete="off"
          value={name}
          onChange={event => {
            setName(event.target.value)
            setNameError('')
          }}
          helper="You’ll get an invite link to share with your group."
          error={nameError}
        />
        {submitError && (
          <p role="alert" className="mt-4 text-sm font-semibold">
            {submitError}
          </p>
        )}
        <Button type="submit" disabled={saving} className="mt-4">
          {saving ? 'Creating…' : 'Create event'}
        </Button>
      </form>
    </Layout>
  )
}

export default CreateEvent
