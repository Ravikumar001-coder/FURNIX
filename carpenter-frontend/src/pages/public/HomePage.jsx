import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const HomePage = () => {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings()

  const heroTitle = settings['hero.title'] || 'Built to last. <br />Designed to belong.'
  const heroSubtitle = settings['hero.subtitle'] || 'Furnix creates handcrafted furniture that balances precision engineering with timeless design—pieces made to live with you, not be replaced.'
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
      <section className="container py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col items-start z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="badge badge-warm">
                <span className="badge-dot"></span>
                Crafted for modern living
              </span>
              <span className="text-xs text-text-tertiary font-medium">
                Trusted by {homesFurnished} homes
              </span>
            </div>
            
            <h1
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />
            
            <p className="font-sans text-text-secondary text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              {heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/gallery" className="btn btn-xl btn-primary">
                View Collection
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link to="/order" className="btn btn-xl btn-secondary">
                Get Custom Quote
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold text-text-tertiary uppercase tracking-widest">
              <span>Delivered to {deliveryReach} homes</span>
              <span>•</span>
              <span>{warrantyYears}-year durability promise</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="nm-inset p-4 rounded-[32px]">
              <img
                alt="Handcrafted walnut dining table in a minimalist sunlit room"
                className="w-full h-auto aspect-[4/3] object-cover rounded-[24px]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwKRc6BF4IxFlTnm84uUeRsI3dlRVJglvOCGbCAc57wXHhtn4m4EFoPoXQmyceYqRNPwYTGAGVN9La4XryHRIy2Ht-WA2LXGihDqtZgbusJ18tO3mEgpwFLw-XA2GD7s6Kx7Jd6wvL056RCkf-UUEHIYiMKDNgzd44MoIPb5bfiCeXpw02i0JNYRkNibuBViapLJQ78sKpbRZf--PSpa0YDBqNoR-2jYptxOaQl4fOaibbD1CXx4pFRngRjPZcYRFj2sGYmxtPPUY"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* ── Trust Strip ─────────────────────────── */}
      <section className="container py-8">
        <div className="nm-inset py-6 px-4 rounded-xl flex items-center justify-center gap-4 md:gap-8 flex-wrap font-sans text-xs tracking-widest uppercase font-semibold text-text-tertiary">
          {['Solid Wood', 'Handcrafted', 'Built for Years', 'Minimal Waste', 'Precision Joinery'].map((item, i) => (
            <span key={item} className="flex items-center gap-4 md:gap-8">
              {item}
              {i < 4 && <span className="w-1.5 h-1.5 rounded-full bg-text-disabled"></span>}
            </span>
          ))}
        </div>
      </section>

      <div className="divider"></div>

      <main>
        {/* ── Featured Pieces (Collection) ──────── */}
        <section className="container py-16 md:py-24" id="collection">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-3 block">Discover</span>
              <h2 className="section-title">
                Featured Collection
              </h2>
            </div>
            <Link to="/gallery" className="text-text-accent font-semibold hover:text-text-primary transition-colors flex items-center gap-1">
                View All Collections <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {!loading && collection.length > 0 ? (
              <div className="product-grid">
                  {collection.map(product => (
                      <article key={product.id} className="product-card group">
                          <div className="product-card-image bg-white/20 mb-4 p-4">
                              <img 
                                src={product.imageUrl || "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                          </div>
                          <div className="product-card-body">
                              <span className="product-card-category">{product.category || 'Handcrafted'}</span>
                              <h3 className="product-card-name">{product.name}</h3>
                              <p className="text-text-secondary font-sans text-sm mb-6 line-clamp-2">{product.description || 'Solid wood furniture built to last generations.'}</p>
                              <div className="flex items-center justify-between mt-auto">
                                <Link to={`/products/${product.id}`} className="btn btn-sm btn-secondary w-full">
                                    View Piece
                                </Link>
                              </div>
                          </div>
                      </article>
                  ))}
              </div>
          ) : (
              <div className="w-full py-20 flex justify-center text-text-tertiary font-sans">Loading our best pieces...</div>
          )}
        </section>

        <div className="divider"></div>

        {/* ── Before / After Spaces ──────────────── */}
        <section className="container py-16 md:py-24">
          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-3 block">Real Spaces</span>
            <h2 className="section-title">Before & After Transformations</h2>
            <p className="section-sub">See how thoughtful furniture changes the entire feel of a room, not just one corner.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="info-card">
              <div className="nm-inset p-2 rounded-lg mb-6">
                <img
                  src="https://images.unsplash.com/photo-1616593969747-4797dc75033e?auto=format&fit=crop&w=1200&q=80"
                  alt="Living room before Furnix setup"
                  className="w-full h-64 object-cover rounded"
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2 font-bold">Before</p>
              <h3 className="font-display text-xl text-text-primary font-bold mb-2">Unplanned Living Room</h3>
              <p className="text-text-secondary text-sm">Mismatched furniture, weak focal point, and limited storage for daily use.</p>
            </article>

            <article className="info-card">
              <div className="nm-inset p-2 rounded-lg mb-6">
                <img
                  src="https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=80"
                  alt="Living room after Furnix setup"
                  className="w-full h-64 object-cover rounded"
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-color-success mb-2 font-bold">After</p>
              <h3 className="font-display text-xl text-text-primary font-bold mb-2">Cohesive Furnix Space</h3>
              <p className="text-text-secondary text-sm">Unified material palette, integrated storage, and a premium handcrafted centerpiece.</p>
            </article>
          </div>
        </section>

        <div className="divider"></div>

        {/* ── Social Proof / Trust Layer ───────────── */}
        <section className="container py-16 md:py-24">
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="section-title mb-4">Loved by {homesFurnished} Homes Across {serviceArea}</h2>
                <p className="section-sub">Don't just take our word for it. Here is what our community of design lovers has to say.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Review 1 */}
                <div className="info-card flex flex-col">
                    <div className="flex text-[#F59E0B] text-sm mb-4">
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    </div>
                    <p className="font-sans text-text-secondary italic mb-8 flex-grow">"The craftsmanship is genuinely unmatched. I bought the walnut dining table and it completely transformed our space. It feels incredibly solid and you can tell no shortcuts were taken."</p>
                    <div className="flex items-center gap-4 mt-auto">
                        <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center text-text-accent font-display font-bold text-lg">AS</div>
                        <div>
                            <p className="font-sans font-semibold text-sm text-text-primary">Aarav S., Mumbai</p>
                            <p className="font-sans text-xs text-text-tertiary">Bespoke Client</p>
                        </div>
                    </div>
                </div>
                {/* Review 2 */}
                <div className="info-card flex flex-col">
                    <div className="flex text-[#F59E0B] text-sm mb-4">
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    </div>
                    <p className="font-sans text-text-secondary italic mb-8 flex-grow">"I was hesitant about ordering a custom piece online, but the team guided me through the wood selection. The final bed frame is an absolute masterpiece. Worth every rupee."</p>
                    <div className="flex items-center gap-4 mt-auto">
                        <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center text-text-accent font-display font-bold text-lg">NK</div>
                        <div>
                            <p className="font-sans font-semibold text-sm text-text-primary">Neha K., Delhi</p>
                            <p className="font-sans text-xs text-text-tertiary">Custom Order</p>
                        </div>
                    </div>
                </div>
                {/* Review 3 */}
                <div className="info-card flex flex-col">
                    <div className="flex text-[#F59E0B] text-sm mb-4">
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    </div>
                    <p className="font-sans text-text-secondary italic mb-8 flex-grow">"You simply can't find this level of quality in commercial furniture stores anymore. The joinery details on our lounge chair are beautiful. It's truly a generational piece."</p>
                    <div className="flex items-center gap-4 mt-auto">
                        <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center text-text-accent font-display font-bold text-lg">RM</div>
                        <div>
                            <p className="font-sans font-semibold text-sm text-text-primary">Rahul M., Bangalore</p>
                            <p className="font-sans text-xs text-text-tertiary">Bespoke Client</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="divider"></div>

        {/* ── Why Furnix ───────────────────────────── */}
        <section className="container py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-3 block">Why Furnix</span>
              <h2 className="section-title mb-6">
                Why our furniture lasts 10+ years
              </h2>
              <div className="space-y-4 text-text-secondary font-sans text-base md:text-lg">
                <p>Most commercial furniture is designed to be replaced in 3-5 years. Furnix is designed to stay.</p>
                <p>From strictly selecting premium hardwoods to applying traditional precision joinery, every decision is engineered to increase durability, stability, and long-term value in your home.</p>
              </div>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="nm-inset p-5 rounded-xl">
                      <span className="material-symbols-outlined text-text-accent mb-3 text-3xl" style={{fontWeight: 200}}>forest</span>
                      <h4 className="font-display font-semibold text-text-primary text-lg mb-1">Premium Hardwoods</h4>
                      <p className="font-sans text-xs text-text-secondary">We never use MDF or particle board. Only solid, sustainably sourced timber.</p>
                  </div>
                  <div className="nm-inset p-5 rounded-xl">
                      <span className="material-symbols-outlined text-text-accent mb-3 text-3xl" style={{fontWeight: 200}}>handyman</span>
                      <h4 className="font-display font-semibold text-text-primary text-lg mb-1">Precision Joinery</h4>
                      <p className="font-sans text-xs text-text-secondary">Traditional techniques like mortise and tenon ensure joints that won't loosen.</p>
                  </div>
                  <div className="nm-inset p-5 rounded-xl">
                      <span className="material-symbols-outlined text-text-accent mb-3 text-3xl" style={{fontWeight: 200}}>water_drop</span>
                      <h4 className="font-display font-semibold text-text-primary text-lg mb-1">Natural Finishes</h4>
                      <p className="font-sans text-xs text-text-secondary">Hand-rubbed oils protect the wood from inside out, allowing it to age gracefully.</p>
                  </div>
                  <div className="nm-inset p-5 rounded-xl">
                      <span className="material-symbols-outlined text-text-accent mb-3 text-3xl" style={{fontWeight: 200}}>verified_user</span>
                      <h4 className="font-display font-semibold text-text-primary text-lg mb-1">5-Year Warranty</h4>
                      <p className="font-sans text-xs text-text-secondary">We stand by our craft. If there's a structural defect, we fix it.</p>
                  </div>
              </div>
            </div>
            <div className="relative">
              <div className="nm-raised-lg p-3 rounded-[32px]">
                <img
                  alt="Artisan hand-planing wood in workshop"
                  className="w-full h-full min-h-[400px] object-cover rounded-[24px]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8YjtfZ3xTZH3zFojFswHNaDglJwMbuikA15uVE2p4Xy63inDZ_wqYwKt9E3DrFSIciSyn6R_9vsLfG9jzc6bjh4wewHiWqx9hPDftypsk9BiGa84ltiVT7PR9ab8uIP8rFv3W7x25q4zaY8ACsV7Q7vxgJvGjNXy2yHseebjyQfxtYLR3s3G-ctMiSoOeIYpujUkTSnGzH_7lKHase2AcwF2GLvwHTSIVjPj4nTakZnli5UVlR2BC08TPZdCbld3gcZuJj-Fzzk8"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* ── How It Works ──────────────────────────── */}
        <section className="container py-16 md:py-24" id="craft">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-3 block">Process</span>
            <h2 className="section-title">
              How Custom Orders Work
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Consultation', desc: 'Share your vision, dimensions, and inspiration. We discuss materials and feasibility.' },
              { step: '02', title: 'Design & Quote', desc: 'We provide a structural design sketch and a transparent, finalized quote.' },
              { step: '03', title: 'The Build', desc: 'Our artisans begin crafting your piece. We send updates from the workshop floor.' },
              { step: '04', title: 'Delivery', desc: 'Your bespoke piece is securely packaged and delivered directly to your home.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center nm-inset p-8 rounded-2xl">
                <div className="w-16 h-16 rounded-full nm-raised-sm flex items-center justify-center font-display text-xl font-bold text-text-accent mb-6">
                  {step}
                </div>
                <h3 className="font-display font-bold text-text-primary text-lg mb-2">{title}</h3>
                <p className="font-sans text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="divider"></div>

        {/* ── CTA Banner ──────────────────────────── */}
        <section className="container py-16 md:py-24">
          <div className="nm-raised-lg rounded-[32px] p-8 md:p-16 text-center max-w-4xl mx-auto flex flex-col items-center relative overflow-hidden">
            {/* Subtle inset ring for depth */}
            <div className="absolute inset-4 nm-inset rounded-[24px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <span className="badge badge-error mb-6">
                <span className="badge-dot"></span>
                Limited Availability
              </span>
              <h2 className="font-display text-3xl md:text-5xl text-text-primary font-bold mb-6 leading-tight">
                Ready to invest in furniture that outlasts trends?
              </h2>
              <p className="font-sans text-text-secondary text-base md:text-lg mb-10 max-w-2xl mx-auto">
                Our master craftsmen only accept 10 custom commissions per month to ensure absolute quality. Reserve your spot today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/order" className="btn btn-xl btn-primary">
                  Get a Custom Quote
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link to="/gallery" className="btn btn-xl btn-ghost">
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
