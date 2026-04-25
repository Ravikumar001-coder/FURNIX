import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const OrderPage = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        pieceType: '',
        vision: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        if (!user) return;
        setForm((prev) => ({
            ...prev,
            fullName: user.fullName || '',
            email: user.username || '',
            phone: user.phone || '',
        }));
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const apiPayload = {
            customerName: form.fullName,
            email: form.email,
            phone: form.phone || '',
            productType: form.pieceType.toUpperCase() || 'CUSTOM',
            customDescription: form.vision
        };
        
        try {
            const response = await orderService.submit(apiPayload);
            setOrderId(response.data?.id);
            setSuccess(true);
            toast.success('Your commission request has been received.');
        } catch (error) {
            toast.error('Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="flex-grow pt-28 md:pt-40 pb-24 px-4 bg-surface-bright min-h-screen">
            <div className="max-w-5xl mx-auto">
                {!success ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
                        {/* Form Section */}
                        <div className="space-y-12">
                            <header className="space-y-4">
                                <span className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-[0.2em] rounded-full border border-primary/10">Bespoke Commission</span>
                                <h1 className="text-4xl md:text-6xl text-primary font-headline leading-tight">Start your legacy piece today.</h1>
                                <p className="text-on-surface-variant text-lg font-body max-w-xl">Every custom project begins with a conversation. Share your requirements and we'll translate them into a structural masterpiece.</p>
                            </header>

                            <form onSubmit={handleSubmit} className="space-y-10 animate-slide-up">
                                <div className="bg-white rounded-3xl p-8 md:p-10 border border-outline-variant/20 shadow-xl shadow-black/5">
                                    <h2 className="text-xl font-headline text-primary mb-8 pb-4 border-b border-outline-variant/10">Project Identity</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Full Name</label>
                                            <input 
                                                id="fullName" 
                                                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body transition-all" 
                                                placeholder="Jane Doe" 
                                                type="text"
                                                value={form.fullName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Email Address</label>
                                            <input 
                                                id="email" 
                                                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body transition-all" 
                                                placeholder="jane@example.com" 
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Phone (Optional)</label>
                                            <input 
                                                id="phone" 
                                                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body transition-all" 
                                                placeholder="+91 XXXXX XXXXX" 
                                                type="tel"
                                                value={form.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 md:p-10 border border-outline-variant/20 shadow-xl shadow-black/5">
                                    <h2 className="text-xl font-headline text-primary mb-8 pb-4 border-b border-outline-variant/10">The Vision</h2>
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Type of Masterpiece</label>
                                            <div className="relative">
                                                <select 
                                                    id="pieceType" 
                                                    className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body appearance-none"
                                                    value={form.pieceType}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option disabled value="">Select your piece...</option>
                                                    <option value="TABLE">Dining Table</option>
                                                    <option value="CHAIR">Seating & Chairs</option>
                                                    <option value="CABINET">Storage & Shelving</option>
                                                    <option value="BED">Bed Frame</option>
                                                    <option value="CUSTOM">Bespoke Design</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Specifications & Requirements</label>
                                            <textarea 
                                                id="vision" 
                                                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body resize-y" 
                                                placeholder="Describe the style (e.g., Mid-century), dimensions (e.g., 6ft x 3ft), and material (e.g., Walnut)..." 
                                                rows="6"
                                                value={form.vision}
                                                onChange={handleChange}
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="bg-primary text-on-primary px-12 py-5 rounded-2xl font-body font-bold text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-4 group disabled:opacity-50"
                                    >
                                        {loading ? 'Submitting...' : 'Send Commission Request'}
                                        {!loading && <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Info Sidebar */}
                        <aside className="sticky top-40 space-y-8 hidden lg:block">
                            <div className="bg-primary text-on-primary rounded-3xl p-10 shadow-2xl shadow-primary/20 relative overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <h3 className="font-headline text-2xl mb-6 relative z-10">Our Process</h3>
                                <div className="space-y-8 relative z-10">
                                    {[
                                        { s: '01', t: 'Briefing', d: 'We review your vision and requirements.' },
                                        { s: '02', t: 'Concept', d: 'We provide a quote and structural sketch.' },
                                        { s: '03', t: 'Handcrafting', d: 'The build begins in our workshop.' },
                                        { s: '04', t: 'Curation', d: 'Delivery and installation at your home.' }
                                    ].map(step => (
                                        <div key={step.s} className="flex gap-4">
                                            <span className="text-on-primary/30 font-headline text-xl">{step.s}</span>
                                            <div>
                                                <h4 className="font-body font-bold text-sm uppercase tracking-widest mb-1">{step.t}</h4>
                                                <p className="text-xs text-on-primary/70 leading-relaxed">{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-3xl p-8 border border-outline-variant/20 shadow-md flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                    <span className="material-symbols-outlined">verified</span>
                                </div>
                                <div>
                                    <h4 className="font-headline text-sm text-primary">Master Craftsmen</h4>
                                    <p className="text-xs text-on-surface-variant">Each piece is signed by the artisan who built it.</p>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-900/10">
                            <span className="material-symbols-outlined text-5xl">task_alt</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl text-primary font-headline mb-6">Request Received</h2>
                        <p className="text-on-surface-variant text-lg font-body mb-12 leading-relaxed">
                            Thank you for trusting us with your vision. We have received your request and our design team will contact you within 24-48 hours with a preliminary estimate.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/account" className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                                View Your Requests
                            </Link>
                            <button onClick={() => setSuccess(false)} className="bg-surface-container-high text-on-surface px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-outline-variant transition-all">
                                Submit Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderPage;
