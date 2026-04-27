import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  getContactEmails,
  getContactPhones,
  getSiteSetting,
  getWhatsAppNumber,
} from '../../utils/siteSettings'

const ContactPage = () => {
  const { settings } = useSiteSettings()

  const phones = getContactPhones(settings)
  const emails = getContactEmails(settings)
  const address = getSiteSetting(settings, 'location.address', '')
  const mapEmbedUrl = getSiteSetting(settings, 'location.mapEmbedUrl', '')
  const weekdays = getSiteSetting(settings, 'hours.weekdays', '')
  const saturday = getSiteSetting(settings, 'hours.saturday', '')
  const sunday = getSiteSetting(settings, 'hours.sunday', '')
  const hoursNotes = getSiteSetting(settings, 'hours.notes', '')
  const facebookUrl = getSiteSetting(settings, 'social.facebook', '')
  const instagramUrl = getSiteSetting(settings, 'social.instagram', '')
  const whatsappNumber = getWhatsAppNumber(settings)

  return (
    <>
      {/* Hero Banner */}
      <div className="pt-24 md:pt-28 pb-10 md:pb-12 px-4 md:px-6 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-screen-2xl mx-auto">
          <p className="font-body text-xs text-on-surface-variant/50 tracking-widest uppercase mb-3">
            Home › Get In Touch
          </p>
          <h1 className="font-headline text-4xl md:text-6xl text-primary tracking-wide">
            Let's talk
          </h1>
          <p className="font-body text-lg text-on-surface-variant mt-4 max-w-xl leading-relaxed">
            Questions, custom requests, or support-we're here.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 max-w-3xl mx-auto">

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
                  {phones.map((phone) => (
                    <p key={phone} className="font-body text-sm text-on-surface">{phone}</p>
                  ))}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Address</span>
                  </div>
                  <p className="font-body text-sm text-on-surface">{address}</p>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Email</span>
                  </div>
                  {emails.map((email) => (
                    <p key={email} className="font-body text-sm text-on-surface break-all">{email}</p>
                  ))}
                </div>

                {/* Hours */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="font-body text-xs tracking-widest uppercase text-on-surface-variant">Hours</span>
                  </div>
                  <p className="font-body text-sm text-on-surface">{weekdays}</p>
                  <p className="font-body text-sm text-on-surface">{saturday}</p>
                  <p className="font-body text-sm text-on-surface">{sunday}</p>
                  {hoursNotes && (
                    <p className="font-body text-xs text-on-surface-variant italic mt-1">{hoursNotes}</p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-outline-variant/20">
                <span className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Follow us</span>
                <a
                  href={facebookUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-body text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-sm">language</span>
                  Facebook
                </a>
                <a
                  href={instagramUrl}
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
                src={mapEmbedUrl}
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
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 bg-[#1a362d] hover:bg-[#122620] text-white py-4 rounded-2xl font-body font-medium tracking-wide transition-colors duration-300 shadow-sm"
            >
              <span className="material-symbols-outlined">chat</span>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </main>

    </>
  )
}

export default ContactPage
