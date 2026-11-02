import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Layout from '../components/Layout.jsx'
import api from '../api.js'

import './JoinEvent.css'

function JoinEvent() {
  const [invites, setInvites] = useState(null)
  const [joined, setJoined] = useState(null)

  const [message, setMessage] = useState('')
  const { inviteCode } = useParams()

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
    const name = event.target.guestName.value

    if (name === '') {
      setMessage('Please enter your name.')
    } else {
      api.get('/join-event.json').then(() => {
        setJoined({
          code: inviteCode,
          eventId: invite.eventId,
          name: name,
        })
      })
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
          <input className="join-submit" type="submit" value="Join event" />
          <p className="join-error">{message}</p>
        </form>
        <p>Others in the event will see this name.</p>
      </Layout>
    )
  }
}

export default JoinEvent
