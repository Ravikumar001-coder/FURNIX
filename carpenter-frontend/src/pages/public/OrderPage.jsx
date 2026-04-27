import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { toast } from 'react-hot-toast';

const STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Tell us who you are' },
  { id: 'details',  title: 'Project Details', description: 'The piece you envision' },
  { id: 'logistics', title: 'Budget & Time', description: 'Setting expectations' },
  { id: 'extras',    title: 'Final Touches', description: 'Additional context' }
];

const PERSISTENCE_KEY = 'inquiry_form_v2';

const INITIAL_FORM_STATE = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    area: '',
    pieceType: '',
    roomType: '',
    dimensions: '',
    materialPreference: '',
    finishPreference: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    siteVisitRequired: false,
    description: '',
    referenceImages: []
};

const OrderPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // UPGRADED HOOK: returns version and idempotencyKey
    const [form, setForm, clearForm, { version, idempotencyKey, forceSetState }] = useFormPersistence(
        PERSISTENCE_KEY, 
        INITIAL_FORM_STATE,
        user
    );

    // RECOVERY: Fetch latest draft from backend on mount
    useEffect(() => {
        const fetchBackendDraft = async () => {
            if (user && form.description === '') {
                try {
                    const draft = await orderService.getDraft();
                    if (draft && draft.content) {
                        const content = typeof draft.content === 'string' ? JSON.parse(draft.content) : draft.content;
                        // Only update if server version is newer than current (likely 0)
                        if (draft.version > version) {
                            forceSetState({
                                data: content,
                                version: draft.version,
                                idempotencyKey: idempotencyKey // Keep current key
                            });
                            toast.success('Synced with cloud draft (v' + draft.version + ')');
                        }
                    }
                } catch (e) {
                    console.error("Draft recovery failed", e);
                }
            }
        };
        fetchBackendDraft();
    }, [user]);

    // PRE-FILL: Auto-fill user details if new form
    useEffect(() => {
        if (user && (!form.name || !form.email)) {
            setForm((prev) => ({
                ...prev,
                name: prev.name || user.fullName || '',
                email: prev.email || user.username || '',
                phone: prev.phone || user.phone || '',
            }));
        }
    }, [user]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (step < STEPS.length - 1) {
            if (validateStep()) {
                setStep(s => s + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        setLoading(true);
        const apiPayload = {
            ...form,
            budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
            budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
            referenceImages: Array.isArray(form.referenceImages) ? form.referenceImages.join(',') : '',
            idempotencyKey: idempotencyKey // CRITICAL: Prevent duplicate submission
        };
        
        try {
            await orderService.submit(apiPayload);
            setSuccess(true);
            clearForm(); 
            if (user) {
                await orderService.deleteDraft();
            }
            toast.success('Your project brief has been received.');
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Your data is saved. Redirecting to login...');
                setTimeout(() => navigate('/login?redirect=/order'), 2000);
            } else {
                // If it's a network error, the user can click submit again.
                // The idempotencyKey ensures the server won't create a second entry if the first one actually went through.
                toast.error('Submission error. You can safely try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setStep(s => Math.max(0, s - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateStep = () => {
        if (step === 0 && (!form.name || !form.email)) {
            toast.error('Please provide name and email');
            return false;
        }
        if (step === 1 && !form.pieceType) {
            toast.error('Please select a piece type');
            return false;
        }
        if (step === 3 && !form.description) {
            toast.error('Please provide a project description');
            return false;
        }
        return true;
    };

    const renderProgress = () => (
        <div className="flex items-center justify-between mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/30 -translate-y-1/2 z-0" />
            {STEPS.map((s, idx) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold tracking-widest transition-all duration-500 border ${
                        idx <= step 
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
                    }`}>
                        {idx < step ? <span className="material-symbols-outlined text-sm">check</span> : `0${idx + 1}`}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-grow pt-28 md:pt-40 pb-24 px-4 bg-[#fcfcfc] min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                {!success ? (
                    <div className="space-y-12 animate-slide-up">
                        <header className="text-center space-y-4 max-w-2xl mx-auto mb-16">
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-primary/60 border-b border-primary/20 pb-2">Atelier Consultation</span>
                            <div className="flex items-center justify-center gap-2">
                                <h1 className="text-4xl md:text-5xl font-headline text-primary tracking-tight leading-tight">
                                    {STEPS[step].title}
                                </h1>
                                <div className="flex flex-col items-start">
                                    <span className="text-[8px] uppercase font-bold text-on-surface-variant/40">v{version}</span>
                                    <span className="text-[6px] font-mono text-on-surface-variant/20">{idempotencyKey.slice(0, 8)}</span>
                                </div>
                            </div>
                            <p className="text-on-surface-variant/80 font-body text-sm tracking-wide">
                                {STEPS[step].description}
                            </p>
                        </header>

                        {renderProgress()}

                        <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-8 md:p-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 min-h-[500px] flex flex-col">
                            <form onSubmit={handleSubmit} className="flex-1 space-y-12">
                                
                                {step === 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-fade-in">
                                        <InputField label="Full Name" id="name" value={form.name} onChange={handleChange} required placeholder="e.g. Julianne Moore" />
                                        <InputField label="Email Address" id="email" type="email" value={form.email} onChange={handleChange} required placeholder="julianne@example.com" />
                                        <InputField label="Phone Number" id="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 00000 00000" />
                                        <InputField label="City / Region" id="city" value={form.city} onChange={handleChange} placeholder="e.g. New Delhi" />
                                        <div className="md:col-span-2">
                                            <InputField label="Full Address" id="address" value={form.address} onChange={handleChange} placeholder="123 Atelier Street, Studio 4" />
                                        </div>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-fade-in">
                                        <SelectField label="Piece Type" id="pieceType" value={form.pieceType} onChange={handleChange} required options={[
                                            {v: 'BED', l: 'Bedstead'}, {v: 'SOFA', l: 'Sofa Framework'}, {v: 'TABLE', l: 'Dining or Console'}, {v: 'WARDROBE', l: 'Wardrobe'}, {v: 'DOOR', l: 'Entrance Door'}, {v: 'CABINET', l: 'Cabinetry'}, {v: 'SHELF', l: 'Shelving System'}, {v: 'CUSTOM', l: 'Custom Commission'}
                                        ]} />
                                        <SelectField label="Room Setting" id="roomType" value={form.roomType} onChange={handleChange} options={[
                                            {v: 'BEDROOM', l: 'Master Bedroom'}, {v: 'LIVING_ROOM', l: 'Grand Living'}, {v: 'KITCHEN', l: 'Culinary Space'}, {v: 'DINING', l: 'Dining Hall'}, {v: 'OFFICE', l: 'Executive Office'}, {v: 'BATHROOM', l: 'Luxury Bath'}, {v: 'OTHER', l: 'Other'}
                                        ]} />
                                        <InputField label="Dimensions (W x H x D)" id="dimensions" value={form.dimensions} onChange={handleChange} placeholder="e.g. 210cm x 90cm x 100cm" />
                                        <InputField label="Material Preference" id="materialPreference" value={form.materialPreference} onChange={handleChange} placeholder="e.g. Reclaimed Teak, European Oak" />
                                        <div className="md:col-span-2">
                                            <InputField label="Finish Details" id="finishPreference" value={form.finishPreference} onChange={handleChange} placeholder="e.g. Hand-rubbed Oil, Matte Lacquer, Distressed" />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <InputField label="Minimum Budget ($)" id="budgetMin" type="number" value={form.budgetMin} onChange={handleChange} placeholder="1500" />
                                            <InputField label="Maximum Budget ($)" id="budgetMax" type="number" value={form.budgetMax} onChange={handleChange} placeholder="5000" />
                                        </div>
                                        <div className="space-y-6">
                                            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40 block">Preferred Timeline</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {['URGENT', 'TWO_WEEKS', 'ONE_MONTH', 'FLEXIBLE'].map(t => (
                                                    <button key={t} type="button" onClick={() => setForm(f => ({...f, timeline: t}))} className={`px-4 py-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                        form.timeline === t ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/30'
                                                    }`}>
                                                        {t.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-12 animate-fade-in">
                                        <div className="space-y-4">
                                            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40 block">Project Description *</label>
                                            <textarea id="description" value={form.description} onChange={handleChange} rows="6" required className="w-full bg-[#f9f9f9] border-none rounded-2xl px-6 py-5 text-on-surface focus:ring-1 focus:ring-primary outline-none font-body text-sm leading-relaxed" placeholder="Describe the aesthetic, the purpose, and any intricate details you have in mind..."></textarea>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-12 border-t border-outline-variant/10">
                                    <button type="button" onClick={prevStep} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors ${step === 0 ? 'invisible' : ''}`}>
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Back
                                    </button>
                                    
                                    <button type={step === STEPS.length - 1 ? 'submit' : 'button'} onClick={step === STEPS.length - 1 ? null : nextStep} disabled={loading} className="bg-primary text-on-primary px-10 py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-4 group disabled:opacity-50">
                                        {loading ? 'Submitting...' : step === STEPS.length - 1 ? 'Complete Brief' : 'Next Phase'}
                                        {!loading && <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto py-24 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-primary/30">
                            <span className="material-symbols-outlined text-5xl">task_alt</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl text-primary font-headline mb-6 tracking-tight">Commission Logged</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <Link to="/account" className="bg-primary text-on-primary px-12 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                                Track Inquiry
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InputField = ({ label, id, type = 'text', value, onChange, required, placeholder }) => (
    <div className="space-y-4">
        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40 block">{label} {required && '*'}</label>
        <input id={id} type={type} value={value} onChange={onChange} required={required} className="w-full bg-[#f9f9f9] border-none rounded-2xl px-6 py-5 text-on-surface focus:ring-1 focus:ring-primary outline-none font-body text-sm transition-all" placeholder={placeholder} />
    </div>
);

const SelectField = ({ label, id, value, onChange, required, options }) => (
    <div className="space-y-4">
        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40 block">{label} {required && '*'}</label>
        <div className="relative">
            <select id={id} value={value} onChange={onChange} required={required} className="w-full bg-[#f9f9f9] border-none rounded-2xl px-6 py-5 text-on-surface focus:ring-1 focus:ring-primary outline-none font-body text-sm appearance-none cursor-pointer">
                <option value="" disabled>Select option...</option>
                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">expand_more</span>
        </div>
    </div>
);

export default OrderPage;
