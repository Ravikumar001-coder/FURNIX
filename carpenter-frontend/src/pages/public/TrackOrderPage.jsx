import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BUSINESS_DATA } from '../../utils/businessData'

const TrackOrderPage = () => {
  const [orderRef, setOrderRef] = useState('')

  return (
    <>
      <section className="pt-28 pb-12 px-6 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-screen-xl mx-auto text-center">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-primary/70 font-semibold mb-3">Order Support</span>
          <h1 className="font-headline text-5xl md:text-6xl text-primary tracking-wide">Track Your Order</h1>
          <p className="font-body text-lg text-on-surface-variant mt-4 max-w-2xl mx-auto">
            Enter your order reference to quickly contact our support desk for real-time status updates.
          </p>
        </div>
      </section>

      <main className="max-w-screen-xl mx-auto px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="font-headline text-2xl text-primary mb-4">Need a status update?</h2>
            <p className="font-body text-on-surface-variant mb-6">
              We currently provide status updates through WhatsApp and phone so you can talk to a real person from the workshop team.
            </p>
            <label className="block text-sm font-medium text-on-surface mb-2" htmlFor="orderRef">Order Reference</label>
            <input
              id="orderRef"
              type="text"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder="Example: ORD-2026-014"
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
            />

            <a
              href={`https://wa.me/${BUSINESS_DATA.contact.whatsapp}?text=${encodeURIComponent(`Hi Furnix, I want to track my order: ${orderRef || '[enter order id]'}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-6 py-3 text-on-primary font-semibold tracking-wide hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              Track via WhatsApp
              <span className="material-symbols-outlined text-sm">chat</span>
            </a>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/20">
            <h3 className="font-headline text-2xl text-primary mb-6">What to keep ready</h3>
            <ul className="space-y-4 font-body text-on-surface-variant">
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>Order reference from your confirmation message</li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>Registered phone number or email</li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>Any recent change requests for your order</li>
            </ul>
            <div className="mt-8 rounded-xl bg-white p-5 border border-outline-variant/20">
              <p className="text-sm text-on-surface-variant">
                Need to place a new order instead? <Link to="/order" className="text-primary font-semibold hover:underline">Start a custom order request</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default TrackOrderPage
