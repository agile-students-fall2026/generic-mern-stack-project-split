import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'

function People() {
  const { eventId } = useParams()

  return (
    <Layout title="People" nav={<BottomNav eventId={eventId} isOrganizer />}>
      <h1 className="text-heading font-bold">People</h1>
      <p className="mt-2 text-body text-muted">Everyone in this event.</p>
    </Layout>
  )
}

export default People
