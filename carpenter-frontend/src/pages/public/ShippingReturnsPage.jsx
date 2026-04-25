const ShippingReturnsPage = () => {
  return (
    <>
      <section className="pt-28 pb-12 px-6 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-screen-xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-primary/70 font-semibold">Policies</span>
          <h1 className="font-headline text-4xl md:text-5xl text-primary mt-3">Shipping & Returns</h1>
          <p className="font-body text-on-surface-variant mt-4 max-w-2xl">
            Transparent delivery and return terms for all Furnix orders.
          </p>
        </div>
      </section>

      <main className="max-w-screen-xl mx-auto px-6 py-14 md:px-12">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 md:p-10 space-y-8">
          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Delivery Timeline</h2>
            <p className="text-on-surface-variant">In-stock pieces: 5-10 business days. Custom commissions: 6-10 weeks depending on design complexity and material availability.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Shipping Coverage</h2>
            <p className="text-on-surface-variant">We currently deliver across major cities in India. Remote-area delivery schedules may vary and are confirmed before dispatch.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Returns & Exchanges</h2>
            <p className="text-on-surface-variant">Custom-made furniture is non-returnable once production begins. In-stock products may be returned within 7 days if unused and in original packaging.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl text-primary mb-3">Damaged in Transit</h2>
            <p className="text-on-surface-variant">If your order arrives damaged, report it within 24 hours with photos. We will repair, replace, or refund based on inspection outcome.</p>
          </section>
        </div>
      </main>
    </>
  )
}

export default ShippingReturnsPage
