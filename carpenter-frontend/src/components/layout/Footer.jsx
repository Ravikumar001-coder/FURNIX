import { Link } from 'react-router-dom';
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../../utils/constants';
import { BUSINESS_DATA } from '../../utils/businessData';

const Footer = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-center bg-emerald-900 px-6 pb-10 pt-20 text-center mt-auto">
      <Link to="/">
        <img src="/logo.png" alt="Furnix" className="h-16 w-auto object-contain mb-6" />
      </Link>
      <p className="text-stone-300 font-body text-sm mb-10 max-w-md mx-auto">
        Crafted for modern living. Built with precision. Designed to last 10+ years.
      </p>
      
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        <div className="bg-emerald-800/40 border border-emerald-700/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-300 text-sm">verified</span>
            <span className="text-stone-200 text-xs tracking-wider uppercase font-body">Premium Joinery</span>
        </div>
        <div className="bg-emerald-800/40 border border-emerald-700/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-300 text-sm">handyman</span>
            <span className="text-stone-200 text-xs tracking-wider uppercase font-body">Handcrafted</span>
        </div>
      </div>

      <div className="mb-12 flex flex-wrap justify-center gap-8 font-body text-sm uppercase tracking-widest">
        <Link className="text-stone-200 transition-colors duration-500 hover:text-white" to="/gallery">Gallery</Link>
        <Link className="text-stone-200 transition-colors duration-500 hover:text-white" to="/order">Custom Order</Link>
        <Link className="text-stone-200 transition-colors duration-500 hover:text-white" to="/track-order">Track Order</Link>
        <a className="text-stone-200 transition-colors duration-500 hover:text-white" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <Link className="text-stone-200 transition-colors duration-500 hover:text-white" to="/contact">Contact</Link>
      </div>

      <div className="mb-10 flex flex-wrap justify-center gap-4 text-xs">
        <span className="bg-emerald-800/40 border border-emerald-700/40 rounded-full px-4 py-2 text-emerald-100">{BUSINESS_DATA.stats.homesFurnished} homes furnished</span>
        <span className="bg-emerald-800/40 border border-emerald-700/40 rounded-full px-4 py-2 text-emerald-100">{BUSINESS_DATA.stats.warrantyYears}-year durability promise</span>
        <span className="bg-emerald-800/40 border border-emerald-700/40 rounded-full px-4 py-2 text-emerald-100">Handcrafted in {BUSINESS_DATA.stats.serviceArea}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl w-full border-t border-emerald-800/50 pt-10 mb-10">
          <div>
            <h4 className="text-emerald-300 font-body text-xs tracking-widest uppercase mb-4">Contact Us</h4>
            <p className="text-stone-300 font-body text-sm mb-1">{BUSINESS_INFO.phone[0]}</p>
            <p className="text-stone-300 font-body text-sm">{BUSINESS_INFO.email[0]}</p>
          </div>
          <div className="sm:text-right">
            <h4 className="text-emerald-300 font-body text-xs tracking-widest uppercase mb-4">Workshop Location</h4>
            <p className="text-stone-300 font-body text-sm mb-1">{BUSINESS_INFO.address}</p>
            <p className="text-stone-300 font-body text-sm">Visits by appointment only</p>
          </div>
      </div>

      <div className="w-full max-w-lg border-t border-emerald-800/50 pt-8 font-body text-xs text-stone-400">
        <div className="mb-4 flex items-center justify-center gap-5 uppercase tracking-wider">
          <Link to="/shipping-returns" className="hover:text-stone-200 transition-colors">Shipping & Returns</Link>
          <Link to="/privacy" className="hover:text-stone-200 transition-colors">Privacy</Link>
        </div>
        &copy; {new Date().getFullYear()} {BUSINESS_DATA.brand.name}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;