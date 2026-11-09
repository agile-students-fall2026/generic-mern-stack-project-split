import { useContext, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import api from '../api.js'
import JoinedEventsContext from '../JoinedEventsContext.js'
import Layout from '../components/Layout.jsx'

function ReturnLink() {
  const { returnToken } = useParams()
  const { joinedAs, addJoin } = useContext(JoinedEventsContext)
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState(null)

  useEffect(() => {
    let ignore = false
    async function loadLink() {
      try {
        const response = await api.get('/return-links.json')
        let link = null
        for (const item of response.data) {
          if (item.token === returnToken) {
            link = item
            break
          }
        }
        if (!link) {
          if (!ignore)
            setFailure({
              returnToken,
              message: "This personal link isn't valid.",
            })
          return
        }
        const eventResponse = await api.get(
          `/events/${encodeURIComponent(link.eventId)}.json`,
        )
        const event = eventResponse.data
        let participant = null
        for (const person of event.participants) {
          if (person.id === link.participantId) {
            participant = person
            break
          }
        }
        if (ignore) return
        if (!participant || event.id !== link.eventId) {
          setFailure({
            returnToken,
            message: "This personal link isn't valid.",
          })
          return
        }
        setResult({
          returnToken,
          eventId: event.id,
          participantId: participant.id,
        })
      } catch {
        if (!ignore)
          setFailure({
            returnToken,
            message: 'Could not open your personal link. Please try again.',
          })
      }
    }
    loadLink()
    return () => {
      ignore = true
    }
  }, [returnToken])

  useEffect(() => {
    if (
      result &&
      result.returnToken === returnToken &&
      joinedAs[result.eventId] !== result.participantId
    ) {
      addJoin({ id: result.participantId, eventId: result.eventId })
    }
  }, [result, returnToken, joinedAs, addJoin])

  if (
    result &&
    result.returnToken === returnToken &&
    joinedAs[result.eventId] === result.participantId
  ) {
    return (
      <Navigate to={`/events/${encodeURIComponent(result.eventId)}`} replace />
    )
  }
  let error = null
  if (failure && failure.returnToken === returnToken) error = failure.message
  return (
    <Layout title="Split">
      <h1 tabIndex={-1} className="text-heading font-bold">
        {error || 'Opening your event...'}
      </h1>
      {error && (
        <>
          <p className="mt-2">
            Check your saved personal link, or ask the organizer for an invite
            link to join.
          </p>
          <Link className="mt-4 inline-block underline" to="/">
            Back to My Events
          </Link>
        </>
      )}
    </Layout>
  )
}

export default ReturnLink
