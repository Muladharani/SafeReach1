import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2,
  ChevronDown, CircleHelp, ClipboardList, Compass, Droplets, ExternalLink, HeartPulse,
  Home, House, Info, LifeBuoy, ListFilter, MapPin, Menu, Phone, Plus, RefreshCw,
  Search, Shield, ShieldCheck, Siren, Trash2, Users, X, Zap, Accessibility,
  Utensils, Toilet, Baby, PawPrint, LocateFixed, Edit3, Radio, Lightbulb,
} from 'lucide-react';
import {
  getGetActiveAlertsQueryKey, getGetDashboardStatsQueryKey, getGetShelterQueryKey,
  getListAlertsQueryKey, getListNotificationsQueryKey, getListReportsQueryKey,
  getListSheltersQueryKey, useCreateAlert, useCreateReport, useCreateShelter,
  useDeleteAlert, useDeleteShelter, useGetActiveAlerts, useGetDashboardStats,
  useGetShelter, useListAlerts, useListNotifications, useListReports, useListShelters,
  useMarkAllNotificationsRead, useMarkNotificationRead, useResolveAlert, useTriggerDemoEmergency,
  useUpdateAlert, useUpdateReport, useUpdateShelter,
} from '@workspace/api-client-react';
import type { AlertInput, ReportInput, ShelterInput, ShelterFacilities, Shelter } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });
const facilityNames: { key: keyof ShelterFacilities; label: string; icon: typeof Droplets }[] = [
  { key: 'food', label: 'Food', icon: Utensils }, { key: 'water', label: 'Drinking water', icon: Droplets },
  { key: 'medical', label: 'Medical aid', icon: HeartPulse }, { key: 'toilet', label: 'Toilets', icon: Toilet },
  { key: 'electricity', label: 'Electricity', icon: Zap }, { key: 'wheelchair', label: 'Accessible', icon: Accessibility },
  { key: 'childcare', label: 'Childcare', icon: Baby }, { key: 'women_facility', label: 'Women’s facility', icon: Shield },
  { key: 'pet_friendly', label: 'Pet friendly', icon: PawPrint },
];
const emptyFacilities: ShelterFacilities = { food: false, water: false, medical: false, toilet: false, electricity: false, wheelchair: false, childcare: false, women_facility: false, pet_friendly: false };
const directionsUrl = (lat: number, lng: number) => `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`;
const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
const pretty = (value: string) => value.replaceAll('_', ' ');
type Language = 'en'|'te'|'hi';
type Coordinates = { latitude:number; longitude:number };
const cities: Record<string, { label:string; latitude:number; longitude:number }> = {
  Rajampet: {label:'Rajampet',latitude:14.1939,longitude:79.1595},
  Kadapa: {label:'Kadapa',latitude:14.4673,longitude:78.8242},
  Nellore: {label:'Nellore',latitude:14.4426,longitude:79.9865},
  Vijayawada: {label:'Vijayawada',latitude:16.5062,longitude:80.648},
  Visakhapatnam: {label:'Visakhapatnam',latitude:17.6868,longitude:83.2185},
  Guntur: {label:'Guntur',latitude:16.3067,longitude:80.4365},
  Tirupati: {label:'Tirupati',latitude:13.6288,longitude:79.4192},
  Kakinada: {label:'Kakinada',latitude:16.9891,longitude:82.2475},
};
const copy = {
  en:{overview:'Overview',shelters:'Find shelter',alerts:'Alerts & updates',emergency:'Emergency help',operations:'Operations',find:'Find a place to go.',search:'Search by shelter or area',help:'I need help now',nearby:'Shelters near you',emergencyTitle:'Your next step is the most important one.',emergencyDesc:'If you are in immediate danger, contact local emergency services. This page offers a simple checklist—not a substitute for official instructions.',call:'Call emergency services',checklist:'Focus on what you can do now',tips:'Safety tips by hazard',searchShelters:'Browse shelters',language:'Language',locate:'Use my location',locationBlocked:'Location unavailable; showing shelters near',availability:'Availability',all:'All',open:'Open or limited',type:'Shelter type',facilities:'Required facilities',radius:'Search radius',noMatch:'No shelters match these filters.',routeWarning:'Directions are provided by third parties. Route safety is not verified; follow current official instructions.'},
  te:{overview:'అవలోకనం',shelters:'ఆశ్రయం కనుగొనండి',alerts:'హెచ్చరికలు & సమాచారం',emergency:'అత్యవసర సహాయం',operations:'నిర్వహణ',find:'వెళ్లడానికి ఒక సురక్షిత స్థలాన్ని కనుగొనండి.',search:'ఆశ్రయం లేదా ప్రాంతం ద్వారా వెతకండి',help:'నాకు ఇప్పుడే సహాయం కావాలి',nearby:'మీకు సమీపంలోని ఆశ్రయాలు',emergencyTitle:'మీ తదుపరి అడుగు చాలా ముఖ్యం.',emergencyDesc:'తక్షణ ప్రమాదంలో ఉంటే స్థానిక అత్యవసర సేవలను సంప్రదించండి. ఈ పేజీ సూచనలు అధికారిక సూచనలకు ప్రత్యామ్నాయం కావు.',call:'అత్యవసర సేవలకు కాల్ చేయండి',checklist:'ఇప్పుడు మీరు చేయగలిగిన వాటిపై దృష్టి పెట్టండి',tips:'ప్రమాద రకాన్ని బట్టి భద్రతా సూచనలు',searchShelters:'ఆశ్రయాలను చూడండి',language:'భాష',locate:'నా స్థానాన్ని ఉపయోగించండి',locationBlocked:'స్థానం అందుబాటులో లేదు; సమీప ఆశ్రయాలు:',availability:'అందుబాటు',all:'అన్నీ',open:'తెరిచి ఉంది లేదా పరిమితం',type:'ఆశ్రయం రకం',facilities:'అవసరమైన సదుపాయాలు',radius:'వెతుకులాట పరిధి',noMatch:'ఈ ఫిల్టర్‌లకు సరిపోయే ఆశ్రయాలు లేవు.',routeWarning:'దిశలు ఇతర సేవల ద్వారా అందించబడతాయి. మార్గ భద్రత ధృవీకరించబడలేదు; అధికారిక సూచనలు పాటించండి.'},
  hi:{overview:'अवलोकन',shelters:'आश्रय खोजें',alerts:'अलर्ट और अपडेट',emergency:'आपातकालीन सहायता',operations:'संचालन',find:'जाने के लिए सुरक्षित जगह खोजें।',search:'आश्रय या क्षेत्र से खोजें',help:'मुझे अभी सहायता चाहिए',nearby:'आपके पास के आश्रय',emergencyTitle:'आपका अगला कदम सबसे महत्वपूर्ण है।',emergencyDesc:'तत्काल खतरे में हों तो स्थानीय आपातकालीन सेवाओं से संपर्क करें। यह पृष्ठ आधिकारिक निर्देशों का विकल्प नहीं है।',call:'आपातकालीन सेवाओं को कॉल करें',checklist:'अभी जो कर सकते हैं उस पर ध्यान दें',tips:'जोखिम के अनुसार सुरक्षा सुझाव',searchShelters:'आश्रय देखें',language:'भाषा',locate:'मेरी लोकेशन इस्तेमाल करें',locationBlocked:'लोकेशन उपलब्ध नहीं; पास के आश्रय:',availability:'उपलब्धता',all:'सभी',open:'खुला या सीमित',type:'आश्रय का प्रकार',facilities:'ज़रूरी सुविधाएँ',radius:'खोज का दायरा',noMatch:'इन फ़िल्टर से कोई आश्रय नहीं मिला।',routeWarning:'दिशाएँ तृतीय-पक्ष सेवाएँ देती हैं। मार्ग सुरक्षा सत्यापित नहीं है; आधिकारिक निर्देशों का पालन करें।'},
};
const haversineKm=(a:Coordinates,b:Coordinates)=>{const rad=(n:number)=>n*Math.PI/180;const dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};
const timeAgo = (value: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} days ago`;
};

function Shell({ children, language, setLanguage, coords, setCoords, gps, setGps, locationMessage, setLocationMessage, city, setCity }: { children: ReactNode; language:Language; setLanguage:(v:Language)=>void; coords:Coordinates; setCoords:(v:Coordinates)=>void; gps:boolean; setGps:(v:boolean)=>void; locationMessage:string; setLocationMessage:(v:string)=>void; city:string; setCity:(v:string)=>void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine);
  const t=copy[language];
  useEffect(()=>{const onlineNow=()=>setOnline(true),offlineNow=()=>setOnline(false);window.addEventListener('online',onlineNow);window.addEventListener('offline',offlineNow);return()=>{window.removeEventListener('online',onlineNow);window.removeEventListener('offline',offlineNow);};},[]);
  const requestLocation=()=>{if(!navigator.geolocation){setLocationMessage('This browser does not support location.');return;}navigator.geolocation.getCurrentPosition(position=>{setCoords({latitude:position.coords.latitude,longitude:position.coords.longitude});setGps(true);setLocationMessage('Showing shelters near your current location.');},()=>{setGps(false);setLocationMessage(`Location unavailable; showing shelters near ${city}.`);},{enableHighAccuracy:false,timeout:10000,maximumAge:300000});};
  const nav = [
    { href: '/', label: t.overview, icon: Home },
    { href: '/shelters', label: t.shelters, icon: MapPin },
    { href: '/alerts', label: t.alerts, icon: Bell },
    { href: '/emergency', label: t.emergency, icon: LifeBuoy },
    { href: '/admin', label: t.operations, icon: ClipboardList },
  ];
  const { data: notifications } = useListNotifications();
  const unread = notifications?.filter(n => !n.isRead).length ?? 0;
  return <div className="app-shell md:flex">
    <aside className={`sidebar fixed inset-y-0 left-0 z-40 w-[264px] p-5 transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:h-dvh`}>
      <div className="flex h-full flex-col">
        <Link href="/" className="mb-10 flex items-center gap-3 rounded-xl text-white no-underline">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2d7890]"><ShieldCheck size={23}/></span>
          <span><span className="brand block text-[22px] leading-none">SafeReach</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.18em] text-blue-100/70">Andhra Pradesh</span></span>
        </Link>
      <div className="smallcaps mb-3 px-3 text-blue-100/55">Safety network</div>
        <nav className="space-y-1">
          {nav.map(item => {
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold no-underline transition-colors ${active ? 'bg-[#2b5275] text-white' : 'text-blue-50/75 hover:bg-[#294b6b] hover:text-white'}`}>
              <Icon size={18}/>{item.label}
              {item.href === '/alerts' && unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#e7aa39] px-1 text-[10px] text-[#263d53]">{unread}</span>}
            </Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-blue-200/15 bg-[#193d60] p-4">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-bold"><span className="h-2 w-2 rounded-full bg-[#70c395]"/> Service status</div>
          <p className="mb-3 text-xs leading-relaxed text-blue-50/65">Shelter information may change. Confirm details with the shelter before travelling.</p>
          <div className="flex items-center gap-2 text-[11px] text-blue-50/60"><Activity size={13}/> Information service · Demo</div>
        </div>
        <div className="mt-5 flex items-center gap-2 px-2 text-[11px] text-blue-50/45"><Shield size={14}/> Made for safer decisions</div>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#112a40]/45 md:hidden"/>}
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-[#dce5eb] bg-[#f8fafb]/95 px-4 backdrop-blur-sm md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button className="btn btn-quiet !p-2 md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21}/></button>
          <div className="hidden items-center gap-2 text-sm text-[#52697e] sm:flex"><MapPin size={15} className="text-[#3b718c]"/> Andhra Pradesh</div>
          <label className="sr-only" htmlFor="city-fallback">Choose a manual city location</label>
          <select id="city-fallback" aria-label="Manual city fallback" className="input !h-9 !min-h-9 !w-[132px] !py-1 text-xs sm:!w-[155px]" value={gps?'current':city} onChange={e=>{if(e.target.value==='current'){requestLocation();return;}const chosen=cities[e.target.value];setCity(e.target.value);setCoords({latitude:chosen.latitude,longitude:chosen.longitude});setGps(false);setLocationMessage(`Showing shelters near ${chosen.label}.`);}}>
            {gps&&<option value="current">Current location</option>}{Object.keys(cities).map(name=><option key={name} value={name}>{name}</option>)}
          </select>
          <button className="btn btn-secondary !min-h-9 !px-2.5 !py-1.5 text-[11px]" onClick={requestLocation} title={t.locate}><LocateFixed size={14}/><span className="hidden lg:inline">{t.locate}</span></button>
          <span className="hidden text-[10px] text-[#73879a] xl:inline">{locationMessage}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="language-select">{t.language}</label><select id="language-select" className="input !h-9 !min-h-9 !w-[91px] !px-2 !py-1 text-xs" value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select>
          <span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline ${online?'bg-[#e5f3ea] text-[#347653]':'bg-[#fff1d6] text-[#876014]'}`}>{online?'Online':'Offline'}</span>
          <span className="hidden rounded-full border border-[#d4e0e7] bg-white px-3 py-1.5 text-[11px] font-bold text-[#486176] sm:inline-flex"><span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-[#d9a437]"/> DEMO INFORMATION</span>
          <Link href="/alerts" aria-label="View alerts and notifications" data-testid="link-alerts-header" className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#dce5eb] bg-white text-[#35536d] hover:bg-[#edf4f8]"><Bell size={17}/>{unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#bd4242]"/>}</Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-7 md:px-8 md:py-9">{children}</div>
    </main>
  </div>;
}

function PageIntro({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>{eyebrow && <div className="smallcaps mb-2 text-[#54809b]">{eyebrow}</div>}<h1 className="page-title m-0 text-[32px] font-extrabold text-[#183b59] md:text-[38px]">{title}</h1>{subtitle && <p className="mb-0 mt-2 max-w-2xl text-[14px] leading-relaxed text-[#60758a]">{subtitle}</p>}</div>
    {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
  </div>;
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{status}</span>;
}
function DemoTag() { return <span className="inline-flex items-center gap-1 rounded-full border border-[#ead59e] bg-[#fff8e8] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#7a5b16]"><Info size={11}/> Demo</span>; }
function LoadingCards() { return <div className="grid gap-3">{[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton mb-3 h-5 w-1/3"/><div className="skeleton mb-2 h-4 w-2/3"/><div className="skeleton h-3 w-1/2"/></div>)}</div>; }
function ErrorBox({ onRetry }: { onRetry: () => void }) { return <div className="card flex items-start gap-3 border-[#eed6d2] bg-[#fffaf9] p-5"><AlertCircle className="mt-0.5 text-[#ad4740]"/><div className="flex-1"><b className="text-[#713c3a]">We couldn’t load this information.</b><p className="mb-3 mt-1 text-sm text-[#765f5d]">Please try again. For immediate danger, use local emergency services.</p><button className="btn btn-secondary !py-2" onClick={onRetry}><RefreshCw size={15}/> Try again</button></div></div>; }
function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) { return <div className="card flex flex-col items-center px-6 py-12 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#e8f0f4] text-[#416984]"><Search size={21}/></span><h3 className="m-0 text-lg font-bold text-[#23445f]">{title}</h3><p className="mb-5 mt-2 max-w-md text-sm text-[#718397]">{body}</p>{action}</div>; }

function ShelterCard({ shelter, compact = false, distance }: { shelter: Shelter; compact?: boolean; distance?:number }) {
  const available = Math.max(0, shelter.capacity - shelter.occupied);
  return <article data-testid={`card-shelter-${shelter.id}`} className="card p-4 transition-shadow hover:shadow-md sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><h3 className="m-0 text-base font-bold text-[#214561]">{shelter.name}</h3><StatusPill status={shelter.status}/></div><div className="flex items-start gap-1.5 text-[13px] leading-relaxed text-[#718397]"><MapPin size={14} className="mt-0.5 shrink-0"/>{shelter.address}</div></div>
      <span className="hidden shrink-0 rounded-lg bg-[#eef4f7] px-2 py-1 text-[10px] font-bold capitalize text-[#476782] sm:inline">{pretty(shelter.type)}</span>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#edf1f4] pt-3 text-[12px] text-[#52697c]">
      <span className="inline-flex items-center gap-1.5"><Users size={14}/><b className="text-[#24465f]">{available}</b> spaces available</span>{distance!==undefined&&<span className="inline-flex items-center gap-1"><MapPin size={13}/>{distance.toFixed(1)} km</span>}
      {shelter.facilities?.medical && <span className="inline-flex items-center gap-1.5"><HeartPulse size={14}/> Medical aid</span>}
      {shelter.facilities?.water && <span className="inline-flex items-center gap-1.5"><Droplets size={14}/> Water</span>}
      <span className="ml-auto text-[11px] text-[#8a9aaa]">Updated {timeAgo(shelter.updatedAt)}</span>
    </div>
    <div className="mt-4 flex gap-2">
      {!compact && <Link className="btn btn-primary !px-3 !py-2 text-xs no-underline" href={`/shelters/${shelter.id}`} data-testid={`link-shelter-details-${shelter.id}`}>View details <ArrowRight size={14}/></Link>}
      <a className="btn btn-secondary !px-3 !py-2 text-xs no-underline" href={directionsUrl(shelter.latitude,shelter.longitude)} target="_blank" rel="noreferrer" data-testid={`link-directions-${shelter.id}`}><Compass size={14}/> Directions</a>
      {shelter.phone && <a className="btn btn-quiet !px-3 !py-2 text-xs no-underline" href={`tel:${shelter.phone}`}><Phone size={14}/> Call</a>}
    </div>
  </article>;
}

function markerFor(status:string) {
  const fill=status==='open'?'#31845b':status==='limited'?'#cf8c22':status==='full'?'#b84540':'#687c8e';
  return L.divIcon({className:'shelter-leaflet-marker',html:`<span style="display:grid;place-items:center;width:30px;height:30px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${fill};box-shadow:0 2px 8px #183a4c66;color:white"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/></svg></span>`,iconSize:[30,36],iconAnchor:[15,34],popupAnchor:[0,-32]});
}
const userIcon=L.divIcon({className:'user-location-marker',html:'<span style="display:block;width:18px;height:18px;border:4px solid white;background:#246db1;border-radius:50%;box-shadow:0 0 0 6px #246db133"></span>',iconSize:[18,18],iconAnchor:[9,9]});
function MiniMap({ shelters, coords, gps=false, centerOn }: { shelters: Shelter[]; coords?:Coordinates; gps?:boolean; centerOn?:Coordinates }) {
  const focus=centerOn??coords;
  const center: [number,number]=focus?[focus.latitude,focus.longitude]:shelters.length?[shelters[0].latitude,shelters[0].longitude]:[16.5062,80.648];
  return <div className="relative overflow-hidden rounded-2xl border border-[#ccdcd6]" aria-label="OpenStreetMap showing listed shelters">
    <MapContainer key={`${center[0].toFixed(3)}-${center[1].toFixed(3)}-${shelters.length}`} center={center} zoom={11} scrollWheelZoom={false} style={{height:'350px',width:'100%'}}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      {shelters.map(s=><Marker key={s.id} position={[s.latitude,s.longitude]} icon={markerFor(s.status)}><Popup><div className="min-w-[180px]"><strong>{s.name}</strong><div className="mt-1 text-xs capitalize">{s.status} · {Math.max(0,s.capacity-s.occupied)} spaces available</div><Link className="mt-2 inline-block text-xs font-bold text-[#174878] no-underline" href={`/shelters/${s.id}`}>Open shelter details</Link></div></Popup></Marker>)}
      {gps&&coords&&<Marker position={[coords.latitude,coords.longitude]} icon={userIcon}><Popup>Your current location</Popup></Marker>}
    </MapContainer>
    <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 rounded-xl border border-[#dce5e4] bg-white/95 p-2 text-[10px] font-semibold text-[#536d7e] shadow-sm"><span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#31845b]"/>Open</span><span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#cf8c22]"/>Limited</span><span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#b84540]"/>Full</span><span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#687c8e]"/>Closed</span>{gps&&<span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#246db1]"/>You</span>}</div>
  </div>;
}
function SirenControl({language}:{language:Language}) {
  const [playing,setPlaying]=useState(false);const [vibrating,setVibrating]=useState(false);
  const contextRef=useRef<AudioContext|null>(null);const oscillatorRef=useRef<OscillatorNode|null>(null);const gainRef=useRef<GainNode|null>(null);const timerRef=useRef<number|undefined>(undefined);
  const stop=()=>{if(timerRef.current)window.clearTimeout(timerRef.current);timerRef.current=undefined;try{oscillatorRef.current?.stop();}catch{}oscillatorRef.current=null;gainRef.current?.disconnect();gainRef.current=null;setPlaying(false);if('vibrate'in navigator)navigator.vibrate(0);setVibrating(false);};
  useEffect(()=>()=>{if(timerRef.current)window.clearTimeout(timerRef.current);try{oscillatorRef.current?.stop();}catch{}void contextRef.current?.close();},[]);
  const play=async()=>{stop();try{const Ctx=window.AudioContext;const ctx=contextRef.current??new Ctx();contextRef.current=ctx;if(ctx.state==='suspended')await ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(620,ctx.currentTime);osc.frequency.linearRampToValueAtTime(880,ctx.currentTime+.45);osc.frequency.linearRampToValueAtTime(620,ctx.currentTime+.9);osc.frequency.linearRampToValueAtTime(880,ctx.currentTime+1.35);osc.frequency.linearRampToValueAtTime(620,ctx.currentTime+1.8);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.08);gain.gain.setValueAtTime(.16,ctx.currentTime+1.65);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.9);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+1.92);oscillatorRef.current=osc;gainRef.current=gain;setPlaying(true);timerRef.current=window.setTimeout(()=>{oscillatorRef.current=null;gainRef.current=null;setPlaying(false);},2000);}catch{setPlaying(false);}};
  const vibrate=()=>{if(!('vibrate'in navigator))return;const next=!vibrating;navigator.vibrate(next?[220,120,220]:0);setVibrating(next);};
  const labels=language==='te'?{play:'చిన్న హెచ్చరిక ధ్వని వినిపించండి',stop:'ధ్వని ఆపండి',vibrate:'వైబ్రేషన్'}:language==='hi'?{play:'छोटा चेतावनी सायरन चलाएँ',stop:'सायरन रोकें',vibrate:'कंपन'}:{play:'Play short alert siren',stop:'Stop sound',vibrate:'Optional vibration'};
  return <div className="rounded-2xl border border-[#e5d6c6] bg-[#fff9f0] p-4"><div className="mb-2 text-sm font-extrabold text-[#684c25]">User-activated alert sound</div><p className="mb-3 text-xs leading-relaxed text-[#796b54]">Sound never starts automatically. One short tone plays once; use vibration only if you choose.</p><div className="flex flex-wrap gap-2"><button className="btn btn-secondary !py-2 text-xs" onClick={playing?stop:play}><Siren size={15}/>{playing?labels.stop:labels.play}</button><button className="btn btn-quiet !py-2 text-xs" onClick={vibrate} disabled={!('vibrate'in navigator)}>{labels.vibrate}: {vibrating?'On':'Off'}</button>{(playing||vibrating)&&<button className="btn btn-danger !py-2 text-xs" onClick={stop}>Stop</button>}</div>{!('vibrate'in navigator)&&<div className="mt-2 text-[10px] text-[#877966]">Vibration is not supported on this device.</div>}</div>;
}

function Overview({coords,gps,language}:{coords:Coordinates;gps:boolean;language:Language}) {
  const { data: shelters, isLoading, isError, refetch } = useListShelters();
  const { data: stats } = useGetDashboardStats();
  const { data: activeAlerts } = useGetActiveAlerts();
  const available = (shelters ?? []).filter(s => s.status === 'open' || s.status === 'limited');
  const nearby = useMemo(() => available.map(s => ({...s, distance:haversineKm(coords,{latitude:s.latitude,longitude:s.longitude})})).sort((a,b)=>a.distance-b.distance), [available,coords]);
  return <>
    <PageIntro eyebrow="SafeReach · Andhra Pradesh" title="Find safety, one step at a time." subtitle="A clear view of shelter availability and local updates to help you make your next move. Always confirm details directly before travelling.">
      <Link href="/emergency" className="btn btn-danger no-underline" data-testid="button-emergency"><Siren size={17}/> I need help now</Link>
    </PageIntro>
    {(activeAlerts?.length ?? 0) > 0 && <div className="mb-6 rounded-2xl border border-[#efdcad] bg-[#fff8e9] p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f5e4bc] text-[#795914]"><AlertTriangle size={18}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-sm font-extrabold text-[#5c491f]">Active local updates</h2><DemoTag/></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{activeAlerts?.slice(0,2).map(a => <div key={a.id} className="rounded-xl bg-white/75 p-3"><div className="text-sm font-bold text-[#624e22]">{a.title}</div><p className="mb-0 mt-1 text-xs leading-relaxed text-[#786b4f]">{a.message}</p></div>)}</div></div><Link className="btn btn-quiet shrink-0 !px-2 text-xs no-underline" href="/alerts">All alerts <ArrowRight size={14}/></Link></div>
    </div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Shelters listed', value: stats?.totalShelters ?? shelters?.length ?? '—', detail: 'Across the network', icon: House, hue: 'blue' },
        { label: 'Available spaces', value: stats?.availableCapacity ?? (available.reduce((sum,s)=>sum+Math.max(0,s.capacity-s.occupied),0) || '—'), detail: 'Reported by shelters', icon: Users, hue: 'green' },
        { label: 'Open now', value: stats?.open ?? (available.filter(s=>s.status==='open').length || '—'), detail: 'Accepting arrivals', icon: CheckCircle2, hue: 'green' },
        { label: 'Active alerts', value: stats?.activeAlerts ?? activeAlerts?.length ?? '—', detail: 'Updates for your area', icon: Bell, hue: 'amber' },
      ].map(item => { const Icon = item.icon; return <div key={item.label} className="card flex items-center gap-4 p-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.hue==='green'?'bg-[#e5f3ea] text-[#367958]':item.hue==='amber'?'bg-[#fff2d8] text-[#8b6519]':'bg-[#e8f0f6] text-[#315f81]'}`}><Icon size={20}/></span><div><div className="text-[11px] font-bold uppercase tracking-[.08em] text-[#718396]">{item.label}</div><div className="font-display mt-0.5 text-[24px] font-extrabold leading-none text-[#203e58]">{item.value}</div><div className="mt-1 text-[11px] text-[#8494a3]">{item.detail}</div></div></div>; })}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="m-0 text-lg font-extrabold text-[#24445e]">Shelters near you</h2><p className="mb-0 mt-1 text-xs text-[#718397]">Explore available support across Andhra Pradesh</p></div><Link href="/shelters" className="btn btn-secondary !py-2 text-xs no-underline">All shelters <ArrowRight size={14}/></Link></div>
        {isLoading ? <LoadingCards/> : isError ? <ErrorBox onRetry={() => refetch()}/> : nearby.length ? <div className="space-y-3">{nearby.slice(0,3).map(s=><ShelterCard key={s.id} shelter={s} distance={s.distance}/>)}</div> : <EmptyState title="No available shelters listed" body="Check back for updates or call your local emergency services for guidance."/>}
      </section>
      <section><div className="mb-3"><h2 className="m-0 text-lg font-extrabold text-[#24445e]">Area overview</h2><p className="mb-0 mt-1 text-xs text-[#718397]">OpenStreetMap shelter locations</p></div>
        {isLoading ? <div className="skeleton h-[350px] rounded-2xl"/> : isError ? <ErrorBox onRetry={() => refetch()}/> : <MiniMap shelters={shelters ?? []} coords={coords} gps={gps}/>}
        <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[#738497]"><Info size={14} className="mt-0.5 shrink-0"/> Shelter listings are demonstration information and may not reflect current conditions. Contact the shelter to confirm.</div>
      </section>
    </div>
    <section className="mt-7 rounded-2xl bg-[#eaf1f5] p-5 sm:flex sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#315f81]"><HeartPulse size={19}/></span><div><h2 className="m-0 text-sm font-extrabold text-[#24445e]">Need urgent assistance?</h2><p className="mb-0 mt-1 text-xs text-[#657b8f]">Open the emergency checklist and contact information.</p></div></div><Link href="/emergency" className="btn btn-primary mt-4 !py-2.5 text-xs no-underline sm:mt-0">Emergency guidance <ArrowRight size={14}/></Link></section>
  </>;
}

function SmartMatch({shelters,coords,onClose}:{shelters:Shelter[];coords:Coordinates;onClose:()=>void}) {
  const [party,setParty]=useState(2);const [needs,setNeeds]=useState<(keyof ShelterFacilities)[]>([]);const [result,setResult]=useState(false);
  const candidates=useMemo(()=>shelters.filter(s=>(s.status==='open'||s.status==='limited')&&s.capacity-s.occupied>=party).map(s=>{
    const distance=haversineKm(coords,{latitude:s.latitude,longitude:s.longitude});
    const matched=needs.filter(key=>s.facilities?.[key]).length;
    const proximity=Math.max(0,100-Math.min(distance,100)*1.25);
    const availability=Math.min(100,Math.max(0,(s.capacity-s.occupied)/Math.max(party,10)*35));
    const needScore=needs.length?matched/needs.length*100:65;
    const accessBonus=s.facilities?.wheelchair?8:0;
    const score=Math.round(Math.min(100,availability*.38+proximity*.32+needScore*.30+accessBonus));
    const reasons=[`${Math.max(0,s.capacity-s.occupied)} reported spaces for your party`,`${distance.toFixed(1)} km from selected location`,needs.length?`${matched} of ${needs.length} requested facilities reported`:'Availability and proximity considered'];
    if(s.facilities?.wheelchair)reasons.push('Wheelchair access reported');
    return {s,distance,score,reasons};
  }).sort((a,b)=>b.score-a.score),[shelters,coords,party,needs]);
  const toggle=(key:keyof ShelterFacilities)=>setNeeds(n=>n.includes(key)?n.filter(x=>x!==key):[...n,key]);
  return <Modal title="Smart Match · transparent estimate" onClose={onClose}><p className="mt-0 text-sm leading-relaxed text-[#647a8e]">A rule-based estimate ranks reported availability, straight-line proximity and requested facilities. This is not a guarantee of admission or a verified route.</p>
    <div className="mb-4"><label className="label" htmlFor="party-size">People in your group</label><input id="party-size" type="number" min="1" max="30" className="input" value={party} onChange={e=>setParty(Math.max(1,Number(e.target.value)))}/></div>
    <fieldset className="rounded-xl border border-[#dce5eb] p-3"><legend className="px-1 text-xs font-bold text-[#546b7d]">Required facilities</legend><div className="grid grid-cols-2 gap-2">{facilityNames.map(({key,label})=><label key={key} className="flex items-center gap-2 text-xs text-[#52697c]"><input type="checkbox" checked={needs.includes(key)} onChange={()=>toggle(key)} className="accent-[#174878]"/>{label}</label>)}</div></fieldset>
    <button className="btn btn-primary mt-4 w-full" onClick={()=>setResult(true)}><CheckCircle2 size={16}/> Find my best match</button>
    {result&&<div className="mt-5">{candidates.length?candidates.slice(0,3).map((item,index)=><article key={item.s.id} className={`mb-3 rounded-xl border p-4 ${index===0?'border-[#a9cfb8] bg-[#f0f7f2]':'border-[#e1e9ed] bg-white'}`}><div className="flex items-start justify-between gap-2"><div><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-[#24445e]">{index===0?'Best match · ':''}{item.s.name}</b><StatusPill status={item.s.status}/></div><div className="mt-1 text-xs text-[#6d8193]">{item.distance.toFixed(1)} km · {item.score}% match score</div></div><span className="font-bold text-[#397550]">{item.score}</span></div><ul className="mb-3 mt-2 space-y-1 pl-4 text-xs text-[#63798b]">{item.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul><Link href={`/shelters/${item.s.id}`} className="btn btn-secondary !px-3 !py-2 text-xs no-underline">Details & contact</Link> <a href={directionsUrl(item.s.latitude,item.s.longitude)} target="_blank" rel="noreferrer" className="btn btn-quiet !px-3 !py-2 text-xs no-underline"><Compass size={13}/> Directions</a></article>):<EmptyState title="No matching shelter found" body="Try fewer requested facilities or a smaller party size. Contact local services for help."/>}</div>}
  </Modal>;
}

function Shelters({coords,gps,language,city}:{coords:Coordinates;gps:boolean;language:Language;city:string}) {
  const t=copy[language];
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [radius,setRadius]=useState(10);const [type,setType]=useState('');const [facilities,setFacilities]=useState<(keyof ShelterFacilities)[]>([]);
  const [mapMode, setMapMode] = useState(true);
  const [matcher,setMatcher]=useState(false);
  const { data, isLoading, isError, refetch } = useListShelters();
  const ranked=useMemo(()=>(data??[]).map(s=>({...s,distance:haversineKm(coords,{latitude:s.latitude,longitude:s.longitude})})).sort((a,b)=>a.distance-b.distance),[data,coords]);
  const visible = useMemo(() => ranked.filter(s => (!search || `${s.name} ${s.address}`.toLowerCase().includes(search.toLowerCase())) && (!status || (status==='available'?(s.status==='open'||s.status==='limited'):s.status===status)) && s.distance<=radius && (!type||s.type===type) && facilities.every(key=>!!s.facilities?.[key])), [ranked, search, status,radius,type,facilities]);
  return <>
    <PageIntro eyebrow="Shelter network" title={t.find} subtitle="Search nearby support, check reported capacity, and contact a shelter before setting out."><button className="btn btn-primary" onClick={()=>setMatcher(true)}><CheckCircle2 size={16}/> Smart Match</button><Link href="/emergency" className="btn btn-danger no-underline"><Siren size={16}/> {t.emergency}</Link></PageIntro>
    <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <label className="relative flex-1"><span className="sr-only">{t.shelters}</span><Search size={17} className="absolute left-3 top-[13px] text-[#8292a0]"/><input className="input pl-10" placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} data-testid="input-shelter-search"/></label>
      <label className="flex items-center gap-2"><span className="sr-only">{t.availability}</span><ListFilter size={16} className="text-[#61798d]"/><select aria-label={t.availability} className="input !w-auto min-w-[155px]" value={status} onChange={e=>setStatus(e.target.value)} data-testid="select-shelter-status"><option value="">{t.all} {t.availability.toLowerCase()}</option><option value="available">{t.open}</option><option value="limited">Limited</option><option value="full">Full</option><option value="closed">Closed</option></select></label>
      <button className="btn btn-secondary" onClick={()=>setMapMode(!mapMode)} data-testid="button-toggle-map"><MapPin size={16}/>{mapMode?'Hide map':'Show map'}</button>
    </div>
    <div className="card mb-5 grid gap-4 p-4 md:grid-cols-[1fr_1fr_1.3fr]">
      <label><span className="label">{t.radius}</span><select className="input" value={radius} onChange={e=>setRadius(Number(e.target.value))}><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option></select><span className="mt-1 block text-[10px] text-[#8494a3]">Straight-line distance from {gps?'your location':city}</span></label>
      <label><span className="label">{t.type}</span><select className="input" value={type} onChange={e=>setType(e.target.value)}><option value="">{t.all} types</option>{['government','school','community_hall','relief_center','ngo'].map(t=> <option value={t} key={t}>{pretty(t)}</option>)}</select></label>
      <fieldset className="rounded-xl border border-[#dce5eb] px-3 pb-2"><legend className="px-1 text-xs font-bold text-[#546b7d]">{t.facilities}</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{facilityNames.map(({key,label})=><label key={key} className="flex items-center gap-1.5 text-[11px] text-[#536b7d]"><input type="checkbox" checked={facilities.includes(key)} onChange={()=>setFacilities(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key])} className="accent-[#174878]"/>{label}</label>)}</div></fieldset>
    </div>
    {!gps&&<p className="mb-3 text-xs text-[#6b7f91]">{t.locationBlocked} {city}.</p>}
    {isLoading ? <LoadingCards/> : isError ? <ErrorBox onRetry={()=>refetch()}/> : <>
      {mapMode && <div className="mb-5"><MiniMap shelters={visible} coords={coords} gps={gps}/></div>}
      <div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-[#36546b]">{visible.length} shelters within {radius} km</span><span className="text-xs text-[#8291a0]">Distance is straight-line · availability may change</span></div>
      {visible.length ? <div className="grid gap-3 lg:grid-cols-2">{visible.map(s=><ShelterCard shelter={s} key={s.id} distance={s.distance}/>)}</div> : <EmptyState title={t.noMatch} body="Try a wider radius or remove one or more filters." action={<button className="btn btn-secondary" onClick={()=>{setSearch('');setStatus('');setType('');setFacilities([]);setRadius(10);}}>Clear filters</button>}/>}
    </>}
    {matcher&&<SmartMatch shelters={data??[]} coords={coords} onClose={()=>setMatcher(false)}/>}
  </>;
}

function ReportModal({ shelter, onClose }: { shelter: Shelter; onClose: () => void }) {
  const qc = useQueryClient(); const create = useCreateReport(); const [problemType,setProblemType]=useState('other'); const [description,setDescription]=useState('');
  const submit=(e:FormEvent)=>{e.preventDefault();const data:ReportInput={shelterId:shelter.id,problemType:problemType as ReportInput['problemType'],description};create.mutate({data},{onSuccess:()=>{qc.invalidateQueries({queryKey:getListReportsQueryKey()});onClose();}});};
  return <Modal title="Report a shelter issue" onClose={onClose}><p className="mt-0 text-sm text-[#667c90]">Help keep this listing useful for people seeking support.</p><form onSubmit={submit} className="space-y-4"><div><label className="label">What is the issue?</label><select className="input" value={problemType} onChange={e=>setProblemType(e.target.value)}><option value="shelter_closed">Shelter appears closed</option><option value="shelter_full">Shelter is full</option><option value="wrong_location">Wrong location</option><option value="road_blocked">Road blocked</option><option value="no_food">No food available</option><option value="no_water">No water available</option><option value="medical_issue">Medical issue</option><option value="other">Other</option></select></div><div><label className="label">Details (optional)</label><textarea className="input min-h-24 resize-y" maxLength={1200} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Share what others should know"/></div>{create.isError && <p className="text-sm text-red-700">Couldn’t submit this report. Please try again.</p>}<div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={create.isPending}>{create.isPending?'Sending…':'Submit report'}</button></div></form></Modal>;
}
function Modal({ title, children, onClose }: { title:string; children:ReactNode; onClose:()=>void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#132d42]/55 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="m-0 text-xl font-extrabold text-[#21445f]">{title}</h2><button className="btn btn-quiet !p-2" onClick={onClose} aria-label="Close dialog"><X size={19}/></button></div>{children}</section></div>;
}
function ShelterDetail({ params,coords,gps }: { params: { id?: string }; coords:Coordinates; gps:boolean }) {
  const id = Number(params.id); const qc=useQueryClient(); const {data:shelter,isLoading,isError,refetch}=useGetShelter(id,{query:{enabled:Number.isFinite(id)&&id>0,queryKey:getGetShelterQueryKey(id)}});
  const [report,setReport]=useState(false);
  if(isLoading)return <LoadingCards/>; if(isError||!shelter)return <><Link className="btn btn-quiet mb-4 no-underline" href="/shelters"><ArrowLeft size={15}/> Back to shelters</Link><ErrorBox onRetry={()=>refetch()}/></>;
  const available=Math.max(0,shelter.capacity-shelter.occupied), pct=Math.min(100,Math.round(shelter.occupied/Math.max(1,shelter.capacity)*100));
  return <>
    <Link href="/shelters" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#45647c] no-underline"><ArrowLeft size={16}/> All shelters</Link>
    <PageIntro eyebrow={`Shelter · ${pretty(shelter.type)}`} title={shelter.name} subtitle={`${shelter.address} · ${haversineKm(coords,{latitude:shelter.latitude,longitude:shelter.longitude}).toFixed(1)} km ${gps?'from your location':'from selected city'}`}><StatusPill status={shelter.status}/></PageIntro>
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <section className="card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="smallcaps text-[#668299]">Reported availability</div><div className="mt-2 flex items-baseline gap-2"><strong className="text-[36px] font-extrabold leading-none text-[#205c48]">{available}</strong><span className="text-sm text-[#60758a]">spaces available</span></div><p className="mb-0 mt-2 text-xs text-[#8392a0]">{shelter.occupied} of {shelter.capacity} places reported occupied · Updated {timeAgo(shelter.updatedAt)}</p></div><span className="rounded-xl bg-[#e8f2eb] p-3 text-[#31714e]"><Users size={23}/></span></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#e9eff1]"><div className={`h-full rounded-full ${pct>90?'bg-[#d18b30]':'bg-[#4d9a71]'}`} style={{width:`${pct}%`}}/></div><div className="mt-2 flex justify-between text-[11px] text-[#7e8d9a]"><span>Occupancy</span><span>{pct}%</span></div></section>
        <section className="card p-5 sm:p-6"><h2 className="mb-4 mt-0 text-lg font-extrabold text-[#24445e]">Facilities & support</h2><div className="grid gap-2 sm:grid-cols-2">{facilityNames.map(({key,label,icon:Icon})=><div key={key} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${shelter.facilities?.[key]?'bg-[#edf5ef] text-[#355e47]':'bg-[#f4f6f7] text-[#97a3ad]'}`}><Icon size={16}/><span>{label}</span>{shelter.facilities?.[key]?<Check size={15} className="ml-auto"/>:<X size={14} className="ml-auto"/>}</div>)}</div></section>
        <section className="card p-5 sm:p-6"><h2 className="mb-3 mt-0 text-lg font-extrabold text-[#24445e]">Location</h2><MiniMap shelters={[shelter]} coords={coords} gps={gps} centerOn={{latitude:shelter.latitude,longitude:shelter.longitude}}/><div className="mt-3 flex flex-wrap gap-2"><a className="btn btn-primary no-underline" href={directionsUrl(shelter.latitude,shelter.longitude)} target="_blank" rel="noreferrer"><Compass size={16}/> Directions in OpenStreetMap <ExternalLink size={14}/></a><a className="btn btn-secondary no-underline" href={mapsUrl(shelter.latitude,shelter.longitude)} target="_blank" rel="noreferrer">Google Maps <ExternalLink size={14}/></a></div><p className="mb-0 mt-3 text-[11px] text-[#788999]">Map directions are provided by third parties and are not verified safe routes. Check current local conditions.</p></section>
      </div>
      <aside className="space-y-4"><div className="card p-5"><div className="smallcaps mb-2 text-[#668299]">Contact the shelter</div><div className="mb-4 break-all text-xl font-extrabold text-[#24445e]">{shelter.phone||'Phone not listed'}</div>{shelter.phone&&<a className="btn btn-primary w-full no-underline" href={`tel:${shelter.phone}`}><Phone size={17}/> Call shelter</a>}<p className="mb-0 mt-3 text-xs leading-relaxed text-[#7b8b99]">Call ahead to confirm availability and facilities before travelling.</p></div><div className="rounded-2xl border border-[#e9d8bb] bg-[#fff9ef] p-5"><div className="flex items-center gap-2 text-sm font-extrabold text-[#684f23]"><Info size={17}/> Please confirm first</div><p className="mb-0 mt-2 text-sm leading-relaxed text-[#786a50]">Shelter information can change quickly. SafeReach listings are demonstration information, not an official live feed.</p></div><button onClick={()=>setReport(true)} className="btn btn-secondary w-full"><AlertTriangle size={16}/> Report an issue</button></aside>
    </div>
    {report&&<ReportModal shelter={shelter} onClose={()=>setReport(false)}/>}
  </>;
}

function Alerts() {
  const qc=useQueryClient(); const {data:alerts,isLoading,isError,refetch}=useListAlerts(); const {data:active}=useGetActiveAlerts(); const {data:notifications}=useListNotifications();
  const readOne=useMarkNotificationRead({mutation:{onSuccess:()=>qc.invalidateQueries({queryKey:getListNotificationsQueryKey()})}});
  const readAll=useMarkAllNotificationsRead({mutation:{onSuccess:()=>qc.invalidateQueries({queryKey:getListNotificationsQueryKey()})}});
  const [tab,setTab]=useState<'active'|'history'|'notifications'>('active');
  const [browserAlerts,setBrowserAlerts]=useState(()=>localStorage.getItem('safereach-browser-alerts')==='true');
  const [browserNotifications,setBrowserNotifications]=useState(()=>localStorage.getItem('safereach-browser-notifications')==='true');
  const knownAlertIds=useRef<Set<number>|null>(null);
  const [permission,setPermission]=useState<NotificationPermission| 'unsupported'>(()=>typeof window==='undefined'||!('Notification'in window)?'unsupported':Notification.permission);
  useEffect(()=>{
    const current=active??[];
    if(knownAlertIds.current===null){knownAlertIds.current=new Set(current.map(a=>a.id));return;}
    for(const alert of current){
      if(!knownAlertIds.current.has(alert.id)&&browserAlerts&&browserNotifications&&permission==='granted'&&'Notification'in window){
        new Notification(alert.title,{body:alert.message,tag:`safereach-alert-${alert.id}`});
      }
      knownAlertIds.current.add(alert.id);
    }
  },[active,browserAlerts,browserNotifications,permission]);
  const enableBrowserNotifications=async()=>{
    if(!('Notification'in window)){setPermission('unsupported');return;}
    try{
      const result=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
      setPermission(result);if(result==='granted'){setBrowserNotifications(true);localStorage.setItem('safereach-browser-notifications','true');}
    }catch{setPermission('denied');}
  };
  const shownAlerts = tab === 'active' ? (active ?? []).filter(a=>a.status==='active') : (alerts ?? []);
  return <>
    <PageIntro eyebrow="Local updates" title="Alerts & notifications" subtitle="Review active notices and past updates. Demonstration alerts are clearly marked and should not be treated as official emergency instructions."/>
    <div className="mb-5 flex gap-6 overflow-x-auto border-b border-[#dce5eb]">
      {([{id:'active',label:`Active alerts (${active?.length??0})`},{id:'history',label:'Alert history'},{id:'notifications',label:`Notifications (${notifications?.filter(n=>!n.isRead).length??0})`}] as const).map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-sm font-bold ${tab===t.id?'tab-active':'text-[#6d8092]'}`}>{t.label}</button>)}
    </div>
    {(isLoading&&tab!=='notifications') ? <LoadingCards/> : isError&&tab!=='notifications' ? <ErrorBox onRetry={()=>refetch()}/> : tab==='notifications' ?
      <section>{(notifications?.length??0)>0?<><div className="mb-3 flex justify-end"><button className="btn btn-secondary !py-2 text-xs" onClick={()=>readAll.mutate()} disabled={readAll.isPending}>Mark all as read</button></div><div className="space-y-3">{notifications?.map(n=><article key={n.id} className={`card flex gap-3 p-4 ${n.isRead?'opacity-70':''}`}><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.isRead?'bg-[#eef2f4] text-[#708496]':'bg-[#e8f0f6] text-[#376487]'}`}><Bell size={17}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-sm font-bold text-[#284760]">{n.title}</h3>{n.isDemo&&<DemoTag/>}{!n.isRead&&<span className="rounded-full bg-[#e6f1f7] px-2 py-0.5 text-[10px] font-bold text-[#396988]">New</span>}</div><p className="mb-1 mt-1 text-sm text-[#657a8c]">{n.message}</p><span className="text-[11px] text-[#8a99a6]">{timeAgo(n.createdAt)}</span></div>{!n.isRead&&<button className="btn btn-quiet !p-2" aria-label={`Mark ${n.title} as read`} onClick={()=>readOne.mutate({id:n.id})}><Check size={16}/></button>}</article>)}</div></>:<EmptyState title="You’re all caught up" body="New notifications will appear here."/>}</section>
      : shownAlerts.length ? <div className="space-y-3">{shownAlerts.map(a=><article key={a.id} className="card flex gap-4 p-5"><span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.severity==='critical'||a.severity==='evacuation'?'bg-[#fae8e6] text-[#ac3b38]':a.severity==='warning'?'bg-[#fff2d9] text-[#906513]':'bg-[#e7f0f6] text-[#3c6e8f]'}`}><AlertTriangle size={19}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-base font-extrabold text-[#24445e]">{a.title}</h3><span className={`status-pill severity-${a.severity}`}>{pretty(a.severity)}</span>{a.isDemo&&<DemoTag/>}</div><p className="mb-2 mt-2 text-sm leading-relaxed text-[#5f7488]">{a.message}</p><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#74879a]"><span className="inline-flex items-center gap-1"><MapPin size={13}/>{a.location}</span><span>Radius {a.radiusKm} km</span><span>{timeAgo(a.createdAt)}</span></div><div className="mt-3 rounded-lg bg-[#f3f6f7] p-3 text-xs text-[#425c72]"><b>Suggested action:</b> {a.recommendedAction}</div></div></article>)}</div> : <EmptyState title={tab==='active'?'No active alerts':'No alert history yet'} body="Check back for updates. Follow trusted local authorities for official information."/>}
    <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#eef3f6] p-4 text-xs leading-relaxed text-[#647a8c]"><Info size={15} className="mt-0.5 shrink-0"/> Alerts in this demo may be simulated. They are not an official warning service.</div>
    <section className="card mt-5 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="m-0 text-base font-extrabold text-[#24445e]">Browser notification settings</h2><p className="mb-0 mt-1 text-xs text-[#718397]">Permission is requested only after you choose Enable. A denied permission will not be requested again.</p></div>
        {permission==='default'&&<button className="btn btn-primary" onClick={enableBrowserNotifications}><Bell size={15}/> Enable browser notifications</button>}
        {permission==='granted'&&<span className="status-pill status-open">Permission granted</span>}
        {permission==='denied'&&<span className="status-pill status-closed">Blocked in browser settings</span>}
        {permission==='unsupported'&&<span className="text-xs text-[#718397]">Not supported by this browser</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#e8eef1] pt-4">
        <label className="flex items-center gap-2 text-xs text-[#536b7d]"><input type="checkbox" checked={browserAlerts} disabled={permission!=='granted'} onChange={e=>{setBrowserAlerts(e.target.checked);localStorage.setItem('safereach-browser-alerts',String(e.target.checked));}} className="accent-[#174878]"/> Notify me about new alerts</label>
        <label className="flex items-center gap-2 text-xs text-[#536b7d]"><input type="checkbox" checked={browserNotifications} disabled={permission!=='granted'} onChange={e=>{setBrowserNotifications(e.target.checked);localStorage.setItem('safereach-browser-notifications',String(e.target.checked));}} className="accent-[#174878]"/> Enable browser notifications</label>
      </div>
    </section>
  </>;
}

function Emergency({language}:{language:Language}) {
  const t=copy[language];
  const qc=useQueryClient(); const demo=useTriggerDemoEmergency({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});qc.invalidateQueries({queryKey:getListNotificationsQueryKey()});}}});
  const {data:activeAlerts}=useGetActiveAlerts();
  const [checked,setChecked]=useState<number[]>(()=>{try{const saved=JSON.parse(localStorage.getItem('safereach-emergency-checklist')??'[]');return Array.isArray(saved)?saved.filter((value):value is number=>Number.isInteger(value)&&value>=0&&value<5):[];}catch{return[];}});
  const [seconds,setSeconds]=useState(60);const [timerRunning,setTimerRunning]=useState(false);
  useEffect(()=>{if(!timerRunning||seconds<=0)return;const timer=window.setTimeout(()=>setSeconds(value=>Math.max(0,value-1)),1000);return()=>window.clearTimeout(timer);},[timerRunning,seconds]);
  useEffect(()=>{if(seconds===0)setTimerRunning(false);},[seconds]);
  const toggleChecklistStep=(index:number)=>{const next=checked.includes(index)?checked.filter(value=>value!==index):[...checked,index];setChecked(next);try{localStorage.setItem('safereach-emergency-checklist',JSON.stringify(next));}catch{}};
  const stepSets:Record<Language,string[]>={en:['Move away from immediate danger if you can do so safely.','Call local emergency services if someone is injured or at immediate risk.','Take essential medicines, drinking water, identification, and a charged phone.','Check current local instructions with trusted authorities before travelling.','Let a trusted person know where you are going.'],te:['మీకు సాధ్యమైతే తక్షణ ప్రమాద ప్రాంతం నుండి సురక్షితంగా దూరంగా వెళ్లండి.','ఎవరైనా గాయపడితే లేదా తక్షణ ప్రమాదంలో ఉంటే స్థానిక అత్యవసర సేవలకు కాల్ చేయండి.','అవసరమైన మందులు, తాగునీరు, గుర్తింపు పత్రాలు, ఛార్జ్ చేసిన ఫోన్ తీసుకోండి.','ప్రయాణానికి ముందు స్థానిక అధికారుల తాజా సూచనలు తెలుసుకోండి.','మీరు ఎక్కడికి వెళ్తున్నారో నమ్మకమైన వ్యక్తికి తెలియజేయండి.'],hi:['यदि सुरक्षित हो, तो तत्काल खतरे से दूर जाएँ।','कोई घायल हो या तत्काल जोखिम में हो तो स्थानीय आपातकालीन सेवाओं को कॉल करें।','ज़रूरी दवाइयाँ, पीने का पानी, पहचान-पत्र और चार्ज फोन साथ रखें।','जाने से पहले स्थानीय अधिकारियों के मौजूदा निर्देश जाँचें।','किसी भरोसेमंद व्यक्ति को बताएँ कि आप कहाँ जा रहे हैं।']};
  const steps=stepSets[language];
  const criticalDemo=activeAlerts?.find(a=>a.isDemo&&(a.severity==='critical'||a.severity==='evacuation'));
  const tips=[{title:'Flooding',text:'Move to higher ground when instructed. Avoid walking or driving through floodwater; depth and current can be deceptive.'},{title:'Cyclone / high winds',text:'Stay indoors away from windows when advised. Keep a charged phone, water and essential medicines accessible.'},{title:'Extreme heat',text:'Rest in shade or a cooler place, sip water, and seek urgent medical help for confusion or collapse.'},{title:'Fire / smoke',text:'Leave by a safe exit, stay low in smoke, and do not re-enter a burning building.'}];
  return <>
    {criticalDemo&&<section role="alert" className="mb-6 rounded-2xl border-2 border-[#c84842] bg-[#fff2ef] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f7dfdc] text-[#ad3733]"><AlertTriangle size={23}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-lg font-extrabold text-[#7e2d2b]">Critical demo alert · {criticalDemo.title}</h2><DemoTag/></div><p className="mb-2 mt-2 text-sm leading-relaxed text-[#704e4a]">{criticalDemo.message}</p><div className="text-xs text-[#775c58]">{criticalDemo.location} · {criticalDemo.recommendedAction}</div><p className="mb-0 mt-2 text-[11px] font-semibold text-[#875e59]">This is a simulated alert, not an official warning.</p></div><div className="flex flex-wrap gap-2"><a href="tel:112" className="btn btn-danger no-underline"><Phone size={15}/> {t.call} · 112</a><Link href="/shelters" className="btn btn-secondary no-underline">{t.searchShelters}</Link></div></div></section>}
    <div className="mb-7 overflow-hidden rounded-2xl bg-[#183f61] text-white"><div className="grid md:grid-cols-[1fr_270px]"><div className="p-6 sm:p-9"><div className="smallcaps mb-3 text-[#acd1dd]">Emergency guidance</div><h1 className="page-title m-0 max-w-2xl text-3xl font-extrabold leading-tight sm:text-[40px]">{t.emergencyTitle}</h1><p className="mb-0 mt-3 max-w-xl text-sm leading-relaxed text-blue-50/75">{t.emergencyDesc}</p><a className="btn mt-5 bg-white !text-[#173f61] no-underline hover:bg-[#eaf2f6]" href="tel:112"><Phone size={17}/> {t.call} · 112</a></div><div className="hidden items-center justify-center border-l border-white/10 bg-[#143756] md:flex"><span className="grid h-28 w-28 place-items-center rounded-full border border-white/15 bg-white/5"><Siren size={48}/></span></div></div></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
      <section className="card p-5 sm:p-7"><div className="mb-5"><div className="smallcaps text-[#63829a]">A calm, practical checklist</div><h2 className="mb-0 mt-2 text-xl font-extrabold text-[#24445e]">{t.checklist}</h2><p className="mb-0 mt-2 text-xs text-[#73879a]">Your checked items stay on this device. The optional timer is only a planning aid.</p></div><div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#eef4f7] p-4"><div><div className="smallcaps text-[#688299]">60-second checklist timer</div><div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-[#23445f]" aria-live="polite">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</div></div><div className="flex gap-2"><button className="btn btn-primary" onClick={()=>setTimerRunning(value=>!value)} disabled={seconds===0}>{timerRunning?'Pause':'Start'} timer</button><button className="btn btn-secondary" onClick={()=>{setTimerRunning(false);setSeconds(60);}}>Reset</button></div></div><div className="space-y-2">{steps.map((s,i)=><label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${checked.includes(i)?'border-[#b5d7c2] bg-[#edf6f0]':'border-[#e3eaee] bg-white hover:bg-[#f7fafb]'}`}><input type="checkbox" checked={checked.includes(i)} onChange={()=>toggleChecklistStep(i)} className="mt-1 h-4 w-4 accent-[#367b57]" data-testid={`checkbox-checklist-${i}`}/><span className={`text-sm leading-relaxed ${checked.includes(i)?'text-[#64816e] line-through':'text-[#425c72]'}`}><b className="mr-2 text-[#7390a4]">0{i+1}</b>{s}</span></label>)}</div></section>
      <aside className="space-y-4"><div className="card p-5"><h2 className="mb-2 mt-0 text-base font-extrabold text-[#24445e]">{t.searchShelters}</h2><p className="mt-0 text-sm leading-relaxed text-[#6a7f91]">Listings are demonstration information. Confirm availability by phone and check conditions before travelling.</p><Link className="btn btn-primary w-full no-underline" href="/shelters"><MapPin size={16}/> {t.searchShelters} <ArrowRight size={15}/></Link></div><div className="card p-5"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#24445e]"><Phone size={16}/> Emergency contacts · India</div><div className="grid grid-cols-2 gap-2">{[{number:'112',name:language==='te'?'అత్యవసర సేవలు':language==='hi'?'आपातकालीन सेवा':'Emergency services'},{number:'108',name:language==='te'?'అంబులెన్స్':language==='hi'?'एम्बुलेंस':'Ambulance'},{number:'101',name:language==='te'?'అగ్నిమాపక సేవ':language==='hi'?'अग्निशमन सेवा':'Fire service'},{number:'100',name:language==='te'?'పోలీసు':language==='hi'?'पुलिस':'Police'}].map(c=><a key={c.number} href={`tel:${c.number}`} className="rounded-xl border border-[#dce6eb] p-3 text-center no-underline hover:bg-[#f4f8fa]"><b className="block text-lg text-[#1e5077]">{c.number}</b><span className="text-[10px] font-semibold text-[#62798c]">{c.name}</span></a>)}</div></div><SirenControl language={language}/><div className="rounded-2xl border border-[#ead8b7] bg-[#fff8ea] p-5"><div className="flex items-center gap-2 font-extrabold text-[#72551e]"><CircleHelp size={18}/> Stay informed</div><p className="mb-0 mt-2 text-sm leading-relaxed text-[#75694f]">Follow announcements from local authorities and emergency responders. Do not rely on this demo for live alerts or safe routes.</p></div><div className="card p-5"><div className="flex items-center gap-2 text-sm font-extrabold text-[#24445e]"><Radio size={16}/> Try demo alert</div><p className="mb-3 mt-2 text-xs leading-relaxed text-[#718397]">This creates a clearly labeled simulated alert and notification for testing only.</p><button className="btn btn-secondary w-full" onClick={()=>demo.mutate()} disabled={demo.isPending}><Siren size={16}/>{demo.isPending?'Creating demo…':'Trigger demo emergency'}</button>{demo.isSuccess&&<p className="mb-0 mt-3 text-xs font-bold text-[#31734c]">Demo alert created. View it in Alerts & updates.</p>}{demo.isError&&<p className="mb-0 mt-3 text-xs text-[#a33b39]">Could not trigger the demo. Please try again.</p>}</div></aside>
    </div>
    <section className="mt-6"><div className="mb-3 flex items-center gap-2"><Lightbulb size={18} className="text-[#8a6b28]"/><h2 className="m-0 text-lg font-extrabold text-[#24445e]">{t.tips}</h2></div><div className="grid gap-3 md:grid-cols-2">{tips.map(tip=><article className="card p-4" key={tip.title}><h3 className="m-0 text-sm font-extrabold capitalize text-[#315571]">{tip.title}</h3><p className="mb-0 mt-2 text-sm leading-relaxed text-[#63798b]">{tip.text}</p></article>)}</div><p className="mb-0 mt-3 flex gap-2 rounded-xl bg-[#edf3f6] p-3 text-xs leading-relaxed text-[#647a8c]"><Info size={14} className="mt-0.5 shrink-0"/> Follow instructions issued by local authorities and emergency responders. These general tips may not fit every situation.</p></section>
  </>;
}

function Admin() {
  const qc=useQueryClient(); const {data:stats}=useGetDashboardStats(); const {data:shelters,isLoading:shelterLoading,isError:shelterError,refetch:retryShelters}=useListShelters(); const {data:alerts,isLoading:alertLoading}=useListAlerts(); const {data:reports,isLoading:reportLoading}=useListReports();
  const [modal,setModal]=useState<'shelter'|'alert'|null>(null); const [editing,setEditing]=useState<Shelter|null>(null);
  const updateShelter=useUpdateShelter({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListSheltersQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});setModal(null);setEditing(null);}}});
  const createShelter=useCreateShelter({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListSheltersQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});setModal(null);}}});
  const removeShelter=useDeleteShelter({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListSheltersQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});}}});
  const createAlert=useCreateAlert({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});setModal(null);}}});
  const resolve=useResolveAlert({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});}}});
  const updateAlert=useUpdateAlert({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});}}});
  const deleteAlert=useDeleteAlert({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});}}});
  const updateReport=useUpdateReport({mutation:{onSuccess:()=>{qc.invalidateQueries({queryKey:getListReportsQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});}}});
  const triggerDemo=useTriggerDemoEmergency({mutation:{onSuccess:(result)=>{qc.invalidateQueries({queryKey:getListAlertsQueryKey()});qc.invalidateQueries({queryKey:getGetActiveAlertsQueryKey()});qc.invalidateQueries({queryKey:getListNotificationsQueryKey()});qc.invalidateQueries({queryKey:getGetDashboardStatsQueryKey()});setNotice(`Demo alert created · Suggested shelter: ${result.recommendation.name}`);}}});
  const [notice,setNotice]=useState('');
  const handleShelter=(input:ShelterInput)=>{if(editing)updateShelter.mutate({id:editing.id,data:input},{onSuccess:()=>setNotice('Shelter updated.')});else createShelter.mutate({data:input},{onSuccess:()=>setNotice('Shelter added.')});};
  return <>
    <PageIntro eyebrow="Operations workspace" title="Shelter operations" subtitle="Manage shelter listings, alert records, and incoming reports. Actions here update the shared demonstration workspace."><button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('shelter');}}><Plus size={16}/> Add shelter</button><button className="btn btn-secondary" onClick={()=>setModal('alert')}><Bell size={16}/> Create alert</button><button className="btn btn-danger" onClick={()=>triggerDemo.mutate()} disabled={triggerDemo.isPending}><Siren size={16}/>{triggerDemo.isPending?'Triggering…':'Trigger demo'}</button></PageIntro>
    {notice&&<div role="status" className="mb-4 flex items-center justify-between rounded-xl border border-[#b8d9c3] bg-[#edf7f0] p-3 text-sm font-bold text-[#316e4a]">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={16}/></button></div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">{[
      ['Shelters',stats?.totalShelters],['Open',stats?.open],['Limited capacity',stats?.limited],['Available spaces',stats?.availableCapacity],['Pending reports',stats?.pendingReports],
    ].map(([label,value])=><div className="card p-4" key={label}><div className="text-xs font-bold text-[#72869a]">{label}</div><div className="mt-1 text-2xl font-extrabold text-[#24445e]">{value??'—'}</div></div>)}</div>
    <section className="card mb-5 overflow-hidden"><div className="flex items-center justify-between border-b border-[#e7edf0] px-5 py-4"><div><h2 className="m-0 text-base font-extrabold text-[#24445e]">Shelters</h2><p className="mb-0 mt-1 text-xs text-[#7b8d9d]">Edit availability or remove outdated listings</p></div><button className="btn btn-quiet !p-2" onClick={()=>retryShelters()} aria-label="Refresh shelters"><RefreshCw size={16}/></button></div>{shelterLoading?<div className="p-5"><LoadingCards/></div>:shelterError?<div className="p-5"><ErrorBox onRetry={()=>retryShelters()}/></div>:<div className="divide-y divide-[#edf1f3]">{shelters?.map(s=><div key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-[#2b4b64]">{s.name}</b><StatusPill status={s.status}/></div><p className="mb-0 mt-1 truncate text-xs text-[#7b8d9d]">{s.address} · {Math.max(0,s.capacity-s.occupied)} of {s.capacity} spaces</p></div><div className="flex gap-2"><button className="btn btn-secondary !px-3 !py-2 text-xs" onClick={()=>{setEditing(s);setModal('shelter');}}><Edit3 size={14}/> Edit</button><button className="btn btn-quiet !px-3 !py-2 text-xs text-[#9d4240]" onClick={()=>{if(confirm(`Remove ${s.name} from the shelter list?`))removeShelter.mutate({id:s.id});}} disabled={removeShelter.isPending}><Trash2 size={14}/> Remove</button></div></div>)}{!shelters?.length&&<div className="p-5"><EmptyState title="No shelter listings" body="Add a shelter to begin managing the network."/></div>}</div>}</section>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="card overflow-hidden"><div className="border-b border-[#e7edf0] px-5 py-4"><h2 className="m-0 text-base font-extrabold text-[#24445e]">Alerts</h2><p className="mb-0 mt-1 text-xs text-[#7b8d9d]">Active and resolved notices</p></div>{alertLoading?<div className="p-5"><LoadingCards/></div>:<div className="divide-y divide-[#edf1f3]">{alerts?.map(a=><div className="px-5 py-4" key={a.id}><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-[#2b4b64]">{a.title}</b><span className={`status-pill severity-${a.severity}`}>{a.severity}</span>{a.isDemo&&<DemoTag/>}<span className="ml-auto text-[11px] capitalize text-[#718397]">{a.status}</span></div><p className="mb-2 mt-1 text-xs text-[#7b8d9d]">{a.location} · {timeAgo(a.createdAt)}</p><div className="flex flex-wrap gap-2">{a.status!=='resolved'&&<button className="btn btn-secondary !px-3 !py-1.5 text-xs" onClick={()=>resolve.mutate({id:a.id})}><Check size={13}/> Resolve</button>}{a.status==='draft'&&<button className="btn btn-secondary !px-3 !py-1.5 text-xs" onClick={()=>updateAlert.mutate({id:a.id,data:{status:'active'}})}><Radio size={13}/> Activate</button>}<button className="btn btn-quiet !px-3 !py-1.5 text-xs text-[#9d4240]" onClick={()=>{if(confirm(`Delete alert "${a.title}"?`))deleteAlert.mutate({id:a.id});}}><Trash2 size={13}/> Delete</button></div></div>)}{!alerts?.length&&<p className="px-5 py-6 text-sm text-[#80909e]">No alerts created.</p>}</div>}</section>
      <section className="card overflow-hidden"><div className="border-b border-[#e7edf0] px-5 py-4"><h2 className="m-0 text-base font-extrabold text-[#24445e]">Community reports</h2><p className="mb-0 mt-1 text-xs text-[#7b8d9d]">Review reported shelter conditions</p></div>{reportLoading?<div className="p-5"><LoadingCards/></div>:<div className="divide-y divide-[#edf1f3]">{reports?.map(r=><div className="px-5 py-4" key={r.id}><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-[#2b4b64]">{r.shelterName}</b><span className={`status-pill ${r.status==='resolved'?'status-open':r.status==='reviewing'?'status-limited':'status-closed'}`}>{r.status}</span></div><div className="mt-1 text-xs font-bold capitalize text-[#61798d]">{pretty(r.problemType)}</div><p className="mb-2 mt-1 text-xs leading-relaxed text-[#7b8d9d]">{r.description||'No additional details.'}</p><div className="flex gap-2">{r.status==='pending'&&<button className="btn btn-secondary !px-3 !py-1.5 text-xs" onClick={()=>updateReport.mutate({id:r.id,data:{status:'reviewing'}})}>Mark reviewing</button>}{r.status!=='resolved'&&<button className="btn btn-secondary !px-3 !py-1.5 text-xs" onClick={()=>updateReport.mutate({id:r.id,data:{status:'resolved'}})}><Check size={13}/> Resolve</button>}</div></div>)}{!reports?.length&&<p className="px-5 py-6 text-sm text-[#80909e]">No reports received.</p>}</div>}</section>
    </div>
    <div className="mt-5 rounded-xl border border-[#ead8b7] bg-[#fff8ea] p-4 text-xs leading-relaxed text-[#766744]"><b>Demo workspace:</b> Alerts created here are operational records, not official emergency broadcasts. Verify information with local authorities.</div>
    {modal==='shelter'&&<ShelterForm shelter={editing} pending={createShelter.isPending||updateShelter.isPending} error={createShelter.isError||updateShelter.isError} onClose={()=>{setModal(null);setEditing(null);}} onSave={handleShelter}/>}
    {modal==='alert'&&<AlertForm pending={createAlert.isPending} error={createAlert.isError} onClose={()=>setModal(null)} onSave={data=>createAlert.mutate({data},{onSuccess:()=>setNotice('Alert created.')})}/>}
  </>;
}

function ShelterForm({shelter,pending,error,onClose,onSave}:{shelter:Shelter|null;pending:boolean;error:boolean;onClose:()=>void;onSave:(v:ShelterInput)=>void}) {
  const [form,setForm]=useState<ShelterInput>(()=>shelter?{name:shelter.name,address:shelter.address,latitude:shelter.latitude,longitude:shelter.longitude,capacity:shelter.capacity,occupied:shelter.occupied,status:shelter.status,type:shelter.type,phone:shelter.phone,facilities:shelter.facilities??emptyFacilities}:{name:'',address:'',latitude:16.5062,longitude:80.648,capacity:100,occupied:0,status:'open',type:'government',phone:'',facilities:{...emptyFacilities}});
  const change=(key:keyof ShelterInput,value:unknown)=>setForm(f=>({...f,[key]:value}));
  return <Modal title={shelter?'Edit shelter':'Add a shelter'} onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(form);}} className="space-y-3">
    <div><label className="label">Shelter name</label><input required minLength={2} className="input" value={form.name} onChange={e=>change('name',e.target.value)}/></div>
    <div><label className="label">Address / area</label><input required minLength={3} className="input" value={form.address} onChange={e=>change('address',e.target.value)}/></div>
    <div className="grid grid-cols-2 gap-3"><div><label className="label">Latitude</label><input type="number" step="any" className="input" value={form.latitude} onChange={e=>change('latitude',Number(e.target.value))}/></div><div><label className="label">Longitude</label><input type="number" step="any" className="input" value={form.longitude} onChange={e=>change('longitude',Number(e.target.value))}/></div></div>
    <div className="grid grid-cols-2 gap-3"><div><label className="label">Capacity</label><input type="number" min="1" className="input" value={form.capacity} onChange={e=>change('capacity',Number(e.target.value))}/></div><div><label className="label">Occupied</label><input type="number" min="0" className="input" value={form.occupied} onChange={e=>change('occupied',Number(e.target.value))}/></div></div>
    <div className="grid grid-cols-2 gap-3"><div><label className="label">Status</label><select className="input" value={form.status} onChange={e=>change('status',e.target.value)}><option value="open">Open</option><option value="limited">Limited</option><option value="full">Full</option><option value="closed">Closed</option></select></div><div><label className="label">Type</label><select className="input" value={form.type} onChange={e=>change('type',e.target.value)}>{['government','school','community_hall','relief_center','ngo'].map(t=><option value={t} key={t}>{pretty(t)}</option>)}</select></div></div>
    <div><label className="label">Contact phone</label><input type="tel" className="input" value={form.phone} onChange={e=>change('phone',e.target.value)}/></div>
    <fieldset className="rounded-xl border border-[#dce5eb] p-3"><legend className="px-1 text-xs font-bold text-[#546b7d]">Facilities</legend><div className="grid grid-cols-2 gap-2">{facilityNames.map(({key,label})=><label key={key} className="flex items-center gap-2 text-xs text-[#52697c]"><input type="checkbox" checked={!!form.facilities[key]} onChange={e=>setForm(f=>({...f,facilities:{...f.facilities,[key]:e.target.checked}}))} className="accent-[#174878]"/>{label}</label>)}</div></fieldset>
    {error&&<p className="text-sm text-[#a43937]">Couldn’t save the shelter. Check details and try again.</p>}<div className="flex justify-end gap-2 pt-1"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={pending}>{pending?'Saving…':shelter?'Save changes':'Add shelter'}</button></div>
  </form></Modal>;
}
function AlertForm({pending,error,onClose,onSave}:{pending:boolean;error:boolean;onClose:()=>void;onSave:(v:AlertInput)=>void}) {
  const [title,setTitle]=useState('');const [message,setMessage]=useState('');const [location,setLocation]=useState('');const [severity,setSeverity]=useState<AlertInput['severity']>('warning');const [latitude,setLat]=useState(16.5062);const [longitude,setLng]=useState(80.648);const [radius,setRadius]=useState(10);const [action,setAction]=useState('Follow local authority guidance and confirm conditions before travelling.');
  return <Modal title="Create an alert" onClose={onClose}><div className="mb-4 flex items-start gap-2 rounded-lg bg-[#fff7e6] p-3 text-xs leading-relaxed text-[#745b24]"><Info size={15} className="mt-0.5 shrink-0"/> This creates a workspace alert. It is not an official emergency broadcast.</div><form className="space-y-3" onSubmit={e=>{e.preventDefault();onSave({type:'local_update',severity,title,message,location,latitude,longitude,radiusKm:radius,recommendedAction:action,sirenEnabled:false,notificationEnabled:true,status:'active'});}}>
    <div><label className="label">Alert title</label><input required minLength={2} maxLength={120} className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Short, clear headline"/></div><div><label className="label">Message</label><textarea required minLength={2} maxLength={1000} className="input min-h-20" value={message} onChange={e=>setMessage(e.target.value)}/></div><div><label className="label">Area / location</label><input required className="input" value={location} onChange={e=>setLocation(e.target.value)}/></div>
    <div className="grid grid-cols-2 gap-3"><div><label className="label">Severity</label><select className="input" value={severity} onChange={e=>setSeverity(e.target.value as AlertInput['severity'])}><option value="information">Information</option><option value="warning">Warning</option><option value="critical">Critical</option><option value="evacuation">Evacuation</option></select></div><div><label className="label">Radius (km)</label><input type="number" min="0" max="500" className="input" value={radius} onChange={e=>setRadius(Number(e.target.value))}/></div></div>
    <div className="grid grid-cols-2 gap-3"><div><label className="label">Latitude</label><input type="number" step="any" className="input" value={latitude} onChange={e=>setLat(Number(e.target.value))}/></div><div><label className="label">Longitude</label><input type="number" step="any" className="input" value={longitude} onChange={e=>setLng(Number(e.target.value))}/></div></div><div><label className="label">Recommended action</label><textarea className="input min-h-16" value={action} onChange={e=>setAction(e.target.value)}/></div>
    {error&&<p className="text-sm text-[#a43937]">Couldn’t create this alert. Please try again.</p>}<div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={pending}>{pending?'Publishing…':'Create alert'}</button></div></form></Modal>;
}

function Routed() {
  const [language,setLanguage]=useState<Language>('en');
  const [city,setCity]=useState('Rajampet');
  const [coords,setCoords]=useState<Coordinates>({latitude:cities.Rajampet.latitude,longitude:cities.Rajampet.longitude});
  const [gps,setGps]=useState(false);
  const [locationMessage,setLocationMessage]=useState('Using manual city location: Rajampet.');
  return <Shell language={language} setLanguage={setLanguage} coords={coords} setCoords={setCoords} gps={gps} setGps={setGps} locationMessage={locationMessage} setLocationMessage={setLocationMessage} city={city} setCity={setCity}><Switch>
    <Route path="/">{()=><Overview coords={coords} gps={gps} language={language}/>}</Route>
    <Route path="/shelters/:id">{params=><ShelterDetail params={params} coords={coords} gps={gps}/>}</Route>
    <Route path="/shelters">{()=><Shelters coords={coords} gps={gps} language={language} city={city}/>}</Route>
    <Route path="/alerts" component={Alerts}/>
    <Route path="/emergency">{()=><Emergency language={language}/>}</Route>
    <Route path="/admin" component={Admin}/>
    <Route component={NotFound}/>
  </Switch></Shell>;
}
function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Routed/></WouterRouter></QueryClientProvider>;
}
export default App;
