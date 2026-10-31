import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'

function SettleUp() {
  const { eventId } = useParams()

  return (
    <Layout title="Settle up" nav={<BottomNav eventId={eventId} />}>
      <h1 className="text-heading font-bold">Settle up</h1>
      <p className="mt-2 text-body text-muted">
        Who owes whom, and which payments are settled.
      </p>
    </Layout>
  )
}

export default SettleUp
