import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const HomePage = () => {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings()

  const heroTitle = settings['hero.title'] || 'Built to last. <br />Designed to belong.'
  const heroSubtitle = settings['hero.subtitle'] || 'Furnix creates handcrafted furniture that balances precision engineering with timeless design-pieces made to live with you, not be replaced.'
  const homesFurnished = settings['stats.homesFurnished'] || '500+'
  const deliveryReach = settings['stats.deliveryReach'] || '300+'
  const warrantyYears = settings['stats.warrantyYears'] || '5'
  const serviceArea = settings['stats.serviceArea'] || 'India'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await productService.getAll()
        const items = Array.isArray(productsRes) ? productsRes : (productsRes.content || []);
        setCollection(items.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {/* ── Hero ───────────────────────────────── */}
      <header className="relative flex min-h-[88vh] md:min-h-screen w-full items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            alt="Handcrafted walnut dining table in a minimalist sunlit room"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwKRc6BF4IxFlTnm84uUeRsI3dlRVJglvOCGbCAc57wXHhtn4m4EFoPoXQmyceYqRNPwYTGAGVN9La4XryHRIy2Ht-WA2LXGihDqtZgbusJ18tO3mEgpwFLw-XA2GD7s6Kx7Jd6wvL056RCkf-UUEHIYiMKDNgzd44MoIPb5bfiCeXpw02i0JNYRkNibuBViapLJQ78sKpbRZf--PSpa0YDBqNoR-2jYptxOaQl4fOaibbD1CXx4pFRngRjPZcYRFj2sGYmxtPPUY"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/72 via-transparent to-surface-container/24" />
          <div className="absolute inset-x-0 bottom-0 h-[24rem] bg-gradient-to-t from-surface-bright/88 via-surface-bright/58 via-45% to-surface-bright/0" />
          <div className="absolute inset-x-0 bottom-0 h-[36rem] [background:radial-gradient(90%_105%_at_50%_100%,rgba(251,249,244,0.86)_0%,rgba(251,249,244,0.72)_32%,rgba(251,249,244,0.44)_56%,rgba(251,249,244,0.16)_74%,rgba(251,249,244,0)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-5xl -translate-y-1 md:-translate-y-5 flex-col items-center px-4 md:px-6 text-center pt-16 md:pt-20">
          <div className="flex flex-col items-center gap-2 mb-7">
              <span className="rounded-2xl border border-emerald-900/10 bg-emerald-50/90 px-5 py-1.5 font-headline text-xs md:text-sm uppercase tracking-[0.18em] text-emerald-900 shadow-sm backdrop-blur-sm">
                Crafted for modern living
              </span>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1">
                  <div className="flex text-[#F59E0B] text-sm">
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: "16px"}}>star</span>
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: "16px"}}>star</span>
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: "16px"}}>star</span>
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: "16px"}}>star</span>
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: "16px"}}>star</span>
                  </div>
                  <span className="text-white text-xs font-medium tracking-wide">Trusted by {homesFurnished} homes</span>
              </div>
          </div>
          
          <h1
            className="mb-5 md:mb-6 font-headline text-4xl sm:text-5xl leading-[1.05] tracking-tight text-white drop-shadow-lg md:text-7xl lg:text-[5.35rem]"
            style={{ textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />
          <p className="mb-8 md:mb-10 max-w-[780px] font-body text-base sm:text-lg md:text-xl font-light text-white/95 drop-shadow-md">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center items-center w-full sm:w-auto">
            <Link
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-body font-semibold text-sm uppercase tracking-wider text-on-primary shadow-xl shadow-primary/30 transition-all duration-500 ease-out hover:bg-primary-container hover:text-on-primary-container hover:-translate-y-1"
              to="/gallery"
            >
              View Collection
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-surface/90 backdrop-blur-md px-8 py-4 font-body font-semibold text-sm uppercase tracking-wider text-primary hover:bg-surface transition-all duration-300 hover:-translate-y-1 shadow-lg"
              to="/order"
            >
              Get Custom Quote
            </Link>
          </div>
          <p className="mt-6 text-white/80 font-body text-sm font-medium tracking-wide shadow-sm">
              Solid wood collections handcrafted with precision
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white/15 border border-white/20 px-4 py-1 text-xs text-white/90">Delivered to {deliveryReach} homes</span>
            <span className="rounded-full bg-white/15 border border-white/20 px-4 py-1 text-xs text-white/90">{warrantyYears}-year durability promise</span>
          </div>
        </div>
      </header>

      {/* ── Trust Strip ─────────────────────────── */}
      <div className="bg-emerald-950 text-emerald-50/80 py-5 overflow-hidden border-y border-emerald-900">
        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap px-6 font-body text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-medium">
          {['Solid Wood', 'Handcrafted', 'Built for Years', 'Minimal Waste', 'Precision Joinery'].map((item, i) => (
            <span key={item} className="flex items-center gap-4 md:gap-8">
              {item}
              {i < 4 && <span className="text-emerald-500/50">•</span>}
            </span>
          ))}
        </div>
      </div>

      <main>
        {/* ── Featured Pieces (Collection) ──────── */}
        <section className="mx-auto max-w-screen-2xl px-4 md:px-6 py-16 md:py-32" id="collection">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">Discover</span>
              <h2 className="font-headline text-3xl md:text-5xl tracking-wide text-emerald-950">
                Featured Collection
              </h2>
            </div>
            <Link to="/gallery" className="text-emerald-800 font-medium hover:text-emerald-600 transition-colors flex items-center gap-1 border-b border-emerald-800/30 pb-1 w-max">
                View All Collections <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {!loading && collection.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                  {collection.map(product => (
                      <Link key={product.id} to={`/products/${product.id}`} className="group flex flex-col items-center bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 border border-outline-variant/30">
                          <div className="w-full h-80 overflow-hidden bg-surface-container flex items-center justify-center p-8">
                              <img 
                                src={product.imageUrl || "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                              />
                          </div>
                          <div className="w-full p-8 flex flex-col items-center text-center">
                              <h3 className="font-headline text-2xl text-emerald-950 mb-3 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                              <p className="text-on-surface-variant font-body text-sm mb-6 line-clamp-2">{product.description || 'Handcrafted solid wood furniture built to last generations.'}</p>
                              <div className="mt-auto flex flex-col items-center gap-4 w-full">
                                  <button className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-900 font-medium tracking-wide border border-emerald-900/10 group-hover:bg-emerald-900 group-hover:text-white transition-colors duration-300">
                                      View Piece
                                  </button>
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          ) : (
              <div className="w-full py-20 flex justify-center text-stone-500 font-body">Loading our best pieces...</div>
          )}
        </section>

        {/* ── Before / After Spaces ──────────────── */}
        <section className="py-24 md:py-32 border-y border-outline-variant/20 bg-surface-container-low">
          <div className="mx-auto max-w-screen-2xl px-6 md:px-12">
            <div className="max-w-3xl mb-14">
              <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">Real Spaces</span>
              <h2 className="font-headline text-4xl md:text-5xl text-emerald-950">Before & After Transformations</h2>
              <p className="mt-4 text-on-surface-variant font-body text-lg">See how thoughtful furniture changes the entire feel of a room, not just one corner.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <article className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1616593969747-4797dc75033e?auto=format&fit=crop&w=1200&q=80"
                  alt="Living room before Furnix setup"
                  className="w-full h-72 object-cover"
                />
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-2">Before</p>
                  <h3 className="font-headline text-2xl text-emerald-950 mb-2">Unplanned Living Room</h3>
                  <p className="text-on-surface-variant">Mismatched furniture, weak focal point, and limited storage for daily use.</p>
                </div>
              </article>

              <article className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=80"
                  alt="Living room after Furnix setup"
                  className="w-full h-72 object-cover"
                />
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-2">After</p>
                  <h3 className="font-headline text-2xl text-emerald-950 mb-2">Cohesive Furnix Space</h3>
                  <p className="text-on-surface-variant">Unified material palette, integrated storage, and a premium handcrafted centerpiece.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── Social Proof / Trust Layer ───────────── */}
        <section className="bg-surface-container-low py-24 border-y border-outline-variant/30">
            <div className="max-w-screen-2xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl text-emerald-950 mb-4">Loved by {homesFurnished} Homes Across {serviceArea}</h2>
                    <p className="font-body text-stone-600 max-w-2xl mx-auto">Don't just take our word for it. Here is what our community of design lovers has to say.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Review 1 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/20">
                        <div className="flex text-[#F59E0B] text-sm mb-4">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        </div>
                        <p className="font-body text-stone-700 italic mb-6 leading-relaxed">"The craftsmanship is genuinely unmatched. I bought the walnut dining table and it completely transformed our space. It feels incredibly solid and you can tell no shortcuts were taken."</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-headline font-bold text-lg">AS</div>
                            <div>
                                <p className="font-headline text-emerald-950">Aarav S., Mumbai</p>
                                <p className="font-body text-xs text-stone-500">Bespoke Client</p>
                            </div>
                        </div>
                    </div>
                    {/* Review 2 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/20">
                        <div className="flex text-[#F59E0B] text-sm mb-4">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        </div>
                        <p className="font-body text-stone-700 italic mb-6 leading-relaxed">"I was hesitant about ordering a custom piece online, but the team guided me through the wood selection. The final bed frame is an absolute masterpiece. Worth every rupee."</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-headline font-bold text-lg">NK</div>
                            <div>
                                <p className="font-headline text-emerald-950">Neha K., Delhi</p>
                                <p className="font-body text-xs text-stone-500">Custom Order</p>
                            </div>
                        </div>
                    </div>
                    {/* Review 3 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/20">
                        <div className="flex text-[#F59E0B] text-sm mb-4">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        </div>
                                <p className="font-body text-on-surface-variant italic mb-6 leading-relaxed">"You simply can't find this level of quality in commercial furniture stores anymore. The joinery details on our lounge chair are beautiful. It's truly a generational piece."</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-headline font-bold text-lg">RM</div>
                            <div>
                                <p className="font-headline text-emerald-950">Rahul M., Bangalore</p>
                                <p className="font-body text-xs text-stone-500">Bespoke Client</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ── Why Furnix ───────────────────────────── */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-screen-2xl px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">Why Furnix</span>
                <h2 className="mb-8 font-headline text-4xl leading-tight text-emerald-950 lg:text-5xl">
                  Why our furniture lasts 10+ years
                </h2>
                <div className="space-y-5 text-stone-600 font-body text-lg leading-relaxed">
                  <p>Most commercial furniture is designed to be replaced in 3-5 years. Furnix is designed to stay.</p>
                  <p>From strictly selecting premium hardwoods to applying traditional precision joinery, every decision is engineered to increase durability, stability, and long-term value in your home.</p>
                </div>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-4 text-3xl" style={{fontWeight: 200}}>forest</span>
                        <h4 className="font-headline text-primary text-xl mb-2">Premium Hardwoods</h4>
                        <p className="font-body text-sm text-on-surface-variant">We never use MDF or particle board. Only solid, sustainably sourced timber.</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-4 text-3xl" style={{fontWeight: 200}}>handyman</span>
                        <h4 className="font-headline text-primary text-xl mb-2">Precision Joinery</h4>
                        <p className="font-body text-sm text-on-surface-variant">Traditional techniques like mortise and tenon ensure joints that won't loosen.</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-4 text-3xl" style={{fontWeight: 200}}>water_drop</span>
                        <h4 className="font-headline text-primary text-xl mb-2">Natural Finishes</h4>
                        <p className="font-body text-sm text-on-surface-variant">Hand-rubbed oils protect the wood from inside out, allowing it to age gracefully.</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-4 text-3xl" style={{fontWeight: 200}}>verified_user</span>
                        <h4 className="font-headline text-primary text-xl mb-2">5-Year Warranty</h4>
                        <p className="font-body text-sm text-on-surface-variant">We stand by our craft. If there's a structural defect, we fix it.</p>
                    </div>
                </div>
              </div>
              <div className="relative h-full min-h-[500px]">
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    alt="Artisan hand-planing wood in workshop"
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8YjtfZ3xTZH3zFojFswHNaDglJwMbuikA15uVE2p4Xy63inDZ_wqYwKt9E3DrFSIciSyn6R_9vsLfG9jzc6bjh4wewHiWqx9hPDftypsk9BiGa84ltiVT7PR9ab8uIP8rFv3W7x25q4zaY8ACsV7Q7vxgJvGjNXy2yHseebjyQfxtYLR3s3G-ctMiSoOeIYpujUkTSnGzH_7lKHase2AcwF2GLvwHTSIVjPj4nTakZnli5UVlR2BC08TPZdCbld3gcZuJj-Fzzk8"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent"></div>
                  <div className="absolute bottom-10 left-10 right-10 text-white">
                      <h3 className="font-headline text-2xl mb-2">The Workshop</h3>
                      <p className="font-body text-white/80 text-sm max-w-sm">Where raw timber is transformed through days of meticulous handiwork.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────── */}
        <section className="bg-surface-container py-24 md:py-32" id="craft">
          <div className="mx-auto max-w-screen-2xl px-6 md:px-12 text-center">
            <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">Process</span>
            <h2 className="mb-16 font-headline text-4xl leading-tight text-emerald-950 lg:text-5xl">
              How Custom Orders Work
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-emerald-900/10 z-0"></div>
              
              {[
                { step: '01', title: 'Consultation', desc: 'Share your vision, dimensions, and inspiration. We discuss materials and feasibility.' },
                { step: '02', title: 'Design & Quote', desc: 'We provide a structural design sketch and a transparent, finalized quote.' },
                { step: '03', title: 'The Build', desc: 'Our artisans begin crafting your piece. We send updates from the workshop floor.' },
                { step: '04', title: 'Delivery', desc: 'Your bespoke piece is securely packaged and delivered directly to your home.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-surface-container flex items-center justify-center font-headline text-3xl text-emerald-800 shadow-md mb-6">
                    {step}
                  </div>
                  <h3 className="font-headline text-xl text-emerald-950 mb-3">{title}</h3>
                  <p className="font-body text-sm text-stone-600 max-w-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────── */}
        <section className="bg-emerald-950 py-24 px-6 relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
          
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="inline-block px-4 py-1 bg-emerald-900/50 border border-emerald-800 rounded-full text-emerald-300 text-xs font-bold tracking-[0.2em] uppercase mb-8">
              Limited Availability
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-white mb-6 leading-tight">
              Ready to invest in furniture that outlasts trends?
            </h2>
            <p className="font-body text-emerald-100/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Our master craftsmen only accept 10 custom commissions per month to ensure absolute quality. Reserve your spot today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <Link
                to="/order"
                className="inline-flex items-center gap-2 bg-emerald-500 text-white font-body font-semibold px-10 py-5 rounded-xl hover:bg-emerald-400 transition-all duration-300 shadow-xl shadow-emerald-900/50 hover:-translate-y-1 tracking-wide uppercase text-sm"
              >
                Get a Custom Quote
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 bg-transparent text-white border border-white/30 font-body font-semibold px-10 py-5 rounded-xl hover:bg-white/10 transition-colors duration-300 tracking-wide uppercase text-sm"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
