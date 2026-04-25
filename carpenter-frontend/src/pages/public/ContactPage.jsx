import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BUSINESS_INFO } from '../../utils/constants'
import { BUSINESS_DATA } from '../../utils/businessData'
import api from '../../services/api'

const ContactPage = () => {
  const [settings, setSettings] = useState({})

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings')
        if (data && data.data) {
          setSettings(data.data)
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    fetchSettings()
  }, [])


  return (
    <>
      {/* ── Hero Banner ────────────────────────────── */}
      <div className="pt-24 md:pt-28 pb-10 md:pb-12 px-4 md:px-6 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-screen-2xl mx-auto">
          <p className="font-body text-xs text-on-surface-variant/50 tracking-widest uppercase mb-3">
            Home › Get In Touch
          </p>
          <h1 className="font-headline text-4xl md:text-6xl text-primary tracking-wide">
            Let's talk
          </h1>
          <p className="font-body text-lg text-on-surface-variant mt-4 max-w-xl leading-relaxed">
            Questions, custom requests, or support—we're here.
          </p>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 max-w-3xl mx-auto">

          {/* ── Left: Contact Info + Map ─────────── */}
          <div className="space-y-6">

            {/* Contact Details Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="font-headline text-xs tracking-widest uppercase text-on-surface-variant text-center mb-2">
                Our Details
              </h2>
              <h3 className="font-headline text-2xl text-primary text-center mb-8">
                Workshop Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Phone</span>
                  </div>
                  {settings['contact.phone'] ? (
                    <p className="font-body text-sm text-on-surface">{settings['contact.phone']}</p>
                  ) : (
                    BUSINESS_INFO.phone.map(p => (
                      <p key={p} className="font-body text-sm text-on-surface">{p}</p>
                    ))
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Address</span>
                  </div>
                  <p className="font-body text-sm text-on-surface">{BUSINESS_INFO.address}</p>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Email</span>
                  </div>
                  {settings['contact.email'] ? (
                    <p className="font-body text-sm text-on-surface break-all">{settings['contact.email']}</p>
                  ) : (
                    BUSINESS_INFO.email.map(e => (
                      <p key={e} className="font-body text-sm text-on-surface break-all">{e}</p>
                    ))
                  )}
                </div>

                {/* Hours */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Hours</span>
                  </div>
                  <p className="font-body text-sm text-on-surface">{BUSINESS_DATA.hours.weekdays}</p>
                  <p className="font-body text-sm text-on-surface">{BUSINESS_DATA.hours.saturday}</p>
                  <p className="font-body text-sm text-on-surface">{BUSINESS_DATA.hours.sunday}</p>
                  {BUSINESS_DATA.hours.notes && (
                    <p className="font-body text-xs text-on-surface-variant italic mt-1">{BUSINESS_DATA.hours.notes}</p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-outline-variant/20">
                <span className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Follow us</span>
                <a
                  href={BUSINESS_INFO.social.facebook}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-body text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-sm">language</span>
                  Facebook
                </a>
                <a
                  href={BUSINESS_INFO.social.instagram}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-body text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  Instagram
                </a>
              </div>
            </div>

            {/* Google Map */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">map</span>
                <h3 className="font-body text-xs tracking-widest uppercase text-on-surface-variant">
                  Workshop Location
                </h3>
              </div>
              <iframe
                src={BUSINESS_INFO.mapEmbed}
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Workshop Location"
              />
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${BUSINESS_INFO.phone[0]?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 bg-[#1a362d] hover:bg-[#122620] text-white py-4 rounded-2xl font-body font-medium tracking-wide transition-colors duration-300 shadow-sm"
            >
              <span className="material-symbols-outlined">chat</span>
              Chat on WhatsApp
            </a>
          </div>

          {/* ── Removed Simulated Contact Form ───────────────── */}
        </div>
      </main>

    </>
  )
}

export default ContactPage