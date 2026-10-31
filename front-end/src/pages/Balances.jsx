import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import BottomNav from '../components/BottomNav.jsx'

function Balances() {
  const { eventId } = useParams()

  return (
    <Layout title="Balances" nav={<BottomNav eventId={eventId} />}>
      <h1 className="text-heading font-bold">Balances</h1>
      <p className="mt-2 text-body text-muted">
        What each person paid versus their share.
      </p>
    </Layout>
  )
}

export default Balances
