import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Layout from '../components/Layout.jsx'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'

import './JoinEvent.css'

function JoinEvent() {
  const [invites, setInvites] = useState(null)
  const [joined, setJoined] = useState(null)

  const [request, setRequest] = useState(null)
  const [reply, setReply] = useState(null)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const { inviteCode } = useParams()
  const busy = submitting && request && request.code === inviteCode
  const { joinedAs, addJoin } = useContext(JoinedEventsContext)

  useEffect(() => {
    let ignore = false
    if (!request || request.code !== inviteCode) return
    api
      .get('/join-event.json')
      .then(res => {
        if (ignore) return
        if (res.data.eventId === request.eventId) {
          setReply({ code: request.code, participant: res.data })
        } else {
          setJoined({
            code: request.code,
            eventId: request.eventId,
            name: request.name,
          })
        }
        setSubmitting(false)
      })
      .catch(() => {
        if (!ignore) {
          setMessage('Could not join this event. Please try again.')
          setSubmitting(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [request, inviteCode])

  useEffect(() => {
    if (reply && reply.code === inviteCode) {
      const participant = reply.participant
      if (joinedAs[participant.eventId] !== participant.id) {
        addJoin(participant)
      } else {
        navigate(`/events/${encodeURIComponent(participant.eventId)}`, {
          state: { personalLink: true },
        })
      }
    }
  }, [reply, inviteCode, joinedAs, addJoin, navigate])

  useEffect(() => {
    api.get('/invites.json').then(res => {
      setInvites(res.data)
    })
  }, [])

  let invite = null

  if (invites === null) {
    invite = null
  } else {
    for (const item of invites) {
      if (item.code === inviteCode) {
        invite = item
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const name = event.target.guestName.value.trim()
    if (busy) return

    if (name === '') {
      setMessage('Please enter your name.')
    } else {
      setSubmitting(true)
      setMessage('')
      setRequest({ code: inviteCode, eventId: invite.eventId, name: name })
    }
  }

  let showJoined

  if (joined === null) {
    showJoined = false
  } else {
    if (joined.code === inviteCode) {
      showJoined = true
    } else {
      showJoined = false
    }
  }

  if (invites === null) {
    return (
      <Layout title="Split">
        <p>Loading invitation...</p>
      </Layout>
    )
  } else if (invite === null) {
    return (
      <Layout title="Split">
        <h1 className="text-heading font-bold">This link isn't valid</h1>
        <p>Invalid link.</p>
      </Layout>
    )
  } else if (showJoined === true) {
    return (
      <Layout title="Split">
        <h1 className="text-heading font-bold">Join {invite.eventName}</h1>
        <p>Mock join checked for {joined.name}.</p>
        <Link to={'/events/' + joined.eventId}>Continue to event</Link>
      </Layout>
    )
  } else {
    return (
      <Layout title="Split">
        <h1 className="text-heading font-bold">Join {invite.eventName}</h1>
        <p>
          {invite.organizerName} invited you to split costs for this trip. No
          account needed.
        </p>
        <form className="join-form" onSubmit={handleSubmit}>
          <label htmlFor="guestName">Your name</label>
          <br />
          <input type="text" name="guestName" id="guestName" />
          <br />
          <input
            className="join-submit"
            type="submit"
            disabled={busy}
            value={busy ? 'Joining...' : 'Join event'}
          />
          <p className="join-error">{message}</p>
        </form>
        <p>Others in the event will see this name.</p>
      </Layout>
    )
  }
}

export default JoinEvent
