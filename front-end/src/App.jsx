import { Routes, Route } from 'react-router-dom'
import SignIn from './pages/SignIn.jsx'
import Register from './pages/Register.jsx'
import MyEvents from './pages/MyEvents.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import JoinEvent from './pages/JoinEvent.jsx'
import EventReceipts from './pages/EventReceipts.jsx'
import AddReceipt from './pages/AddReceipt.jsx'
import ReceiptDetails from './pages/ReceiptDetails.jsx'
import Balances from './pages/Balances.jsx'
import SettleUp from './pages/SettleUp.jsx'
import People from './pages/People.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MyEvents />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/events/new" element={<CreateEvent />} />
      <Route path="/join/:inviteCode" element={<JoinEvent />} />
      <Route path="/events/:eventId" element={<EventReceipts />} />
      <Route path="/events/:eventId/receipts/new" element={<AddReceipt />} />
      <Route
        path="/events/:eventId/receipts/:receiptId"
        element={<ReceiptDetails />}
      />
      <Route path="/events/:eventId/balances" element={<Balances />} />
      <Route path="/events/:eventId/settle-up" element={<SettleUp />} />
      <Route path="/events/:eventId/people" element={<People />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
