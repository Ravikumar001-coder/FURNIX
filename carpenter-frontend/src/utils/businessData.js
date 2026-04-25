/**
 * BUSINESS DATA CONFIGURATION
 * 
 * This file contains all the public-facing information for the website.
 * Change these values to reflect your actual business details.
 */

export const BUSINESS_DATA = {
  // ── Brand Info ─────────────────────────────────────
  brand: {
    name: 'Furnix',
    logo: '/assets/furnix-logo.png', // Path to your logo in public folder
    slogan: 'Crafted for modern living. Built with precision.',
    foundingYear: 2024,
  },

  // ── Contact Details ────────────────────────────────
  contact: {
    whatsapp: '9142081366', // International format without + or spaces
    phones: [
      { label: 'Primary', number: '+91 9142081366' },
      { label: 'Support', number: '+91 9142081366' }
    ],
    emails: [
      { label: 'General', address: 'lxravi100@gmail.com' },
      { label: 'Support', address: 'lxravi100@gmail.com' }
    ],
  },

  // ── Physical Location ──────────────────────────────
  location: {
    address: 'Dhowatand East, Near TOP, Exchange Road Dhanbad-826004,Jharkhand',
    city: 'Dhanbad', // Primary service city
    region: 'Jharkhand',
    mapEmbedUrl: "<iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7950.488101034907!2d86.41265449226158!3d23.78492443421252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f6bccce36b0723%3A0xfa56614f5a66aaea!2sTelephone%20Exchange%20Rd%2C%20Dhanbad%2C%20Jharkhand%20826007!5e0!3m2!1sen!2sin!4v1777087059565!5m2!1sen!2sin' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>" },

  // ── Business Hours ─────────────────────────────────
  hours: {
    weekdays: 'Mon–Fri: 9:00 AM – 6:00 PM',
    saturday: 'Sat: 10:00 AM – 4:00 PM',
    sunday: 'Sun: Closed',
    notes: 'Visits by appointment only',
  },

  // ── Social Media ───────────────────────────────────
  social: {
    instagram: 'https://instagram.com/furnix',
    facebook: 'https://facebook.com/furnix',
    whatsapp_link: 'https://wa.me/9142081366',
  },

  // ── Statistics & Social Proof ──────────────────────
  stats: {
    homesFurnished: '500+',
    deliveryReach: '300+',
    warrantyYears: '5',
    serviceArea: 'India',
  },

  // ── Trust Badges/Points ────────────────────────────
  trustPoints: [
    'Premium Joinery',
    'Handcrafted',
    'Solid Wood',
    'Precision Engineering',
    'Natural Finishes'
  ]
};
