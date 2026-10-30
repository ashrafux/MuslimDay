export interface Place {
  id: string;
  name: string; // display (English, like the original app shows "Dhaka")
  bn: string;
  lat: number;
  lng: number;
  tz: string;
  country: 'BD' | 'INTL';
}

const bd = (id: string, name: string, bnName: string, lat: number, lng: number): Place => ({
  id, name, bn: bnName, lat, lng, tz: 'Asia/Dhaka', country: 'BD',
});

export const PLACES: Place[] = [
  bd('dhaka', 'Dhaka', 'ঢাকা', 23.8103, 90.4125),
  bd('chattogram', 'Chattogram', 'চট্টগ্রাম', 22.3569, 91.7832),
  bd('khulna', 'Khulna', 'খুলনা', 22.8456, 89.5403),
  bd('rajshahi', 'Rajshahi', 'রাজশাহী', 24.3745, 88.6042),
  bd('sylhet', 'Sylhet', 'সিলেট', 24.8949, 91.8687),
  bd('barishal', 'Barishal', 'বরিশাল', 22.701, 90.3535),
  bd('rangpur', 'Rangpur', 'রংপুর', 25.7439, 89.2752),
  bd('mymensingh', 'Mymensingh', 'ময়মনসিংহ', 24.7471, 90.4203),
  bd('cumilla', 'Cumilla', 'কুমিল্লা', 23.4607, 91.1809),
  bd('gazipur', 'Gazipur', 'গাজীপুর', 23.9999, 90.4203),
  bd('narayanganj', 'Narayanganj', 'নারায়ণগঞ্জ', 23.6238, 90.5),
  bd('tangail', 'Tangail', 'টাঙ্গাইল', 24.2513, 89.9167),
  bd('bogura', 'Bogura', 'বগুড়া', 24.8465, 89.3773),
  bd('dinajpur', 'Dinajpur', 'দিনাজপুর', 25.6217, 88.6355),
  bd('jessore', 'Jashore', 'যশোর', 23.1664, 89.2081),
  bd('kushtia', 'Kushtia', 'কুষ্টিয়া', 23.9013, 89.1204),
  bd('pabna', 'Pabna', 'পাবনা', 24.0064, 89.2372),
  bd('faridpur', 'Faridpur', 'ফরিদপুর', 23.607, 89.8429),
  bd('noakhali', 'Noakhali', 'নোয়াখালী', 22.8696, 91.0995),
  bd('feni', 'Feni', 'ফেনী', 23.0159, 91.3976),
  bd('coxsbazar', "Cox's Bazar", 'কক্সবাজার', 21.4272, 92.0058),
  bd('rangamati', 'Rangamati', 'রাঙ্গামাটি', 22.6533, 92.1789),
  bd('brahmanbaria', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 23.9571, 91.1119),
  bd('chandpur', 'Chandpur', 'চাঁদপুর', 23.2333, 90.6713),
  bd('habiganj', 'Habiganj', 'হবিগঞ্জ', 24.3749, 91.4155),
  bd('moulvibazar', 'Moulvibazar', 'মৌলভীবাজার', 24.4829, 91.7774),
  bd('sunamganj', 'Sunamganj', 'সুনামগঞ্জ', 25.0715, 91.3992),
  bd('jamalpur', 'Jamalpur', 'জামালপুর', 24.9375, 89.9378),
  bd('netrokona', 'Netrokona', 'নেত্রকোনা', 24.8709, 90.7279),
  bd('kishoreganj', 'Kishoreganj', 'কিশোরগঞ্জ', 24.4449, 90.7766),
  bd('sirajganj', 'Sirajganj', 'সিরাজগঞ্জ', 24.4534, 89.7007),
  bd('naogaon', 'Naogaon', 'নওগাঁ', 24.8132, 88.931),
  bd('chapainawabganj', 'Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ', 24.5965, 88.2776),
  bd('thakurgaon', 'Thakurgaon', 'ঠাকুরগাঁও', 26.0337, 88.4617),
  bd('panchagarh', 'Panchagarh', 'পঞ্চগড়', 26.3411, 88.5542),
  bd('kurigram', 'Kurigram', 'কুড়িগ্রাম', 25.8072, 89.6295),
  bd('patuakhali', 'Patuakhali', 'পটুয়াখালী', 22.3596, 90.3299),
  bd('bhola', 'Bhola', 'ভোলা', 22.6859, 90.6482),
  bd('satkhira', 'Satkhira', 'সাতক্ষীরা', 22.7185, 89.0705),
  bd('bagerhat', 'Bagerhat', 'বাগেরহাট', 22.6516, 89.7859),
  { id: 'makkah', name: 'Makkah', bn: 'মক্কা', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh', country: 'INTL' },
  { id: 'madinah', name: 'Madinah', bn: 'মদিনা', lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh', country: 'INTL' },
  { id: 'riyadh', name: 'Riyadh', bn: 'রিয়াদ', lat: 24.7136, lng: 46.6753, tz: 'Asia/Riyadh', country: 'INTL' },
  { id: 'dubai', name: 'Dubai', bn: 'দুবাই', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai', country: 'INTL' },
  { id: 'doha', name: 'Doha', bn: 'দোহা', lat: 25.2854, lng: 51.531, tz: 'Asia/Qatar', country: 'INTL' },
  { id: 'kuwait', name: 'Kuwait City', bn: 'কুয়েত সিটি', lat: 29.3759, lng: 47.9774, tz: 'Asia/Kuwait', country: 'INTL' },
  { id: 'muscat', name: 'Muscat', bn: 'মাস্কাট', lat: 23.588, lng: 58.3829, tz: 'Asia/Muscat', country: 'INTL' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', bn: 'কুয়ালালামপুর', lat: 3.139, lng: 101.6869, tz: 'Asia/Kuala_Lumpur', country: 'INTL' },
  { id: 'singapore', name: 'Singapore', bn: 'সিঙ্গাপুর', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore', country: 'INTL' },
  { id: 'kolkata', name: 'Kolkata', bn: 'কলকাতা', lat: 22.5726, lng: 88.3639, tz: 'Asia/Kolkata', country: 'INTL' },
  { id: 'london', name: 'London', bn: 'লন্ডন', lat: 51.5074, lng: -0.1278, tz: 'Europe/London', country: 'INTL' },
  { id: 'newyork', name: 'New York', bn: 'নিউ ইয়র্ক', lat: 40.7128, lng: -74.006, tz: 'America/New_York', country: 'INTL' },
  { id: 'toronto', name: 'Toronto', bn: 'টরন্টো', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto', country: 'INTL' },
  { id: 'sydney', name: 'Sydney', bn: 'সিডনি', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney', country: 'INTL' },
  { id: 'rome', name: 'Rome', bn: 'রোম', lat: 41.9028, lng: 12.4964, tz: 'Europe/Rome', country: 'INTL' },
];

export const DEFAULT_PLACE = PLACES[0];

export const KAABA = { lat: 21.4225, lng: 39.8262 };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle initial bearing from a point to the Kaaba, degrees clockwise from true north. */
export function qiblaBearing(lat: number, lng: number): number {
  const φ1 = rad(lat);
  const φ2 = rad(KAABA.lat);
  const Δλ = rad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Haversine distance in km */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dφ = rad(lat2 - lat1);
  const dλ = rad(lng2 - lng1);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
