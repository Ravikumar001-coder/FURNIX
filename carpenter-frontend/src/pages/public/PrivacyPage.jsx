const PrivacyPage = () => {
  return (
    <>
      <section className="pt-28 pb-12 px-6 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-screen-xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-primary/70 font-semibold">Policies</span>
          <h1 className="font-headline text-4xl md:text-5xl text-primary mt-3">Privacy Policy</h1>
          <p className="font-body text-on-surface-variant mt-4 max-w-2xl">
            How Furnix collects, uses, and protects your information.
          </p>
        </div>
      </section>

      <main className="max-w-screen-xl mx-auto px-6 py-14 md:px-12">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 md:p-10 space-y-8">
          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">What We Collect</h2>
            <p className="text-on-surface-variant">Name, phone number, email, delivery address, and order details submitted through inquiries and orders.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">How We Use Data</h2>
            <p className="text-on-surface-variant">We use your information to process orders, provide project updates, handle support, and improve product quality.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Data Security</h2>
            <p className="text-on-surface-variant">We limit access to customer information and apply reasonable safeguards to prevent unauthorized access or misuse.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Contact</h2>
            <p className="text-on-surface-variant">For privacy concerns, contact our support team through the Contact page or official WhatsApp line.</p>
          </section>
        </div>
      </main>
    </>
  )
}

export default PrivacyPage
