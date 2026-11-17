import {useEffect,useRef,useState} from 'react';
import {useLanguage} from './Language';

const apiKey=process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const mapId=process.env.REACT_APP_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID';
const centre={lat:61.0583,lng:28.1888};
let loader;
const authListeners=new Set();
let rejected=false;

function loadMaps() {
  if(!loader) loader=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timeout=setTimeout(()=>reject(new Error('Maps timed out')),12000);
    const fail=()=>{clearTimeout(timeout);reject(new Error('Maps unavailable'));};
    window.gm_authFailure=()=>{rejected=true;fail();authListeners.forEach(fn=>fn());};
    window.aadMapsReady=()=>{
      Promise.all([window.google.maps.importLibrary('maps'),window.google.maps.importLibrary('marker')])
        .then(([maps,marker])=>{clearTimeout(timeout);resolve({...maps,...marker});},fail);
    };
    script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({
      key:apiKey,callback:'aadMapsReady',loading:'async',v:'quarterly',auth_referrer_policy:'origin'
    });
    script.async=true;
    script.referrerPolicy='strict-origin';
    script.onerror=fail;
    document.head.append(script);
  });
  return loader;
}

export const locationsMapConfigured=Boolean(apiKey);
export const pinIcons={DRAIN:'▤',BLOCKED_DRAIN:'×',STANDING_WATER:'≈',DAMAGED_DRAIN:'!',OTHER:'•'};
const empty=[];

export default function LocationMap({points=empty,selected,onSelect,onPick,compact=false}) {
  const {t}=useLanguage();
  const node=useRef(null),selectRef=useRef(null),pickRef=useRef(null);
  selectRef.current=onSelect;pickRef.current=onPick;
  const [tools,setTools]=useState(null),[failed,setFailed]=useState(rejected);
  const markers=useRef([]);
  const picking=Boolean(onPick);
  useEffect(()=>{
    if(!apiKey||rejected)return;
    let active=true,listener;
    const fail=()=>{if(active)setFailed(true);};
    authListeners.add(fail);
    loadMaps().then(lib=>{
      if(!active||rejected)return;
      const map=new lib.Map(node.current,{center:centre,zoom:13,mapId,streetViewControl:false,mapTypeControl:false,gestureHandling:'cooperative',clickableIcons:false});
      if(picking)listener=map.addListener('click',event=>{
        if(event.latLng)pickRef.current?.(event.latLng.lat(),event.latLng.lng());
      });
      setTools({map,Marker:lib.AdvancedMarkerElement});
    }).catch(fail);
    return()=>{active=false;listener?.remove();authListeners.delete(fail);};
  },[picking]);
  useEffect(()=>{
    if(!tools||failed)return;
    const {map,Marker}=tools;
    const pins=points.map(p=>{
      const badge=document.createElement('span');
      badge.className='map-pin pin-'+(p.kind||'DRAIN').toLowerCase();
      badge.textContent=pinIcons[p.kind]||pinIcons.DRAIN;
      badge.setAttribute('aria-hidden','true');
      const position={lat:p.latitude,lng:p.longitude};
      const marker=new Marker({map,position,title:p.label,gmpClickable:!picking,content:badge});
      const click=()=>selectRef.current?.(p.id);
      if(!picking)marker.addEventListener('gmp-click',click);
      return {marker,badge,id:p.id,position,click};
    });
    markers.current=pins;
    const first=pins[0]?.position;
    if(first&&pins.every(({position})=>position.lat===first.lat&&position.lng===first.lng)){
      map.setCenter(first);map.setZoom(16);
    }else if(pins.length>1){
      const bounds=new window.google.maps.LatLngBounds();
      pins.forEach(p=>bounds.extend(p.position));
      map.fitBounds(bounds,55);
    }
    return()=>pins.forEach(p=>{p.marker.removeEventListener('gmp-click',p.click);p.marker.map=null;});
  },[tools,points,failed,picking]);
  useEffect(()=>{
    markers.current.forEach(p=>{
      const active=p.id===selected;
      p.badge.classList.toggle('is-selected',active);
      p.marker.zIndex=active?10:1;
      if(active&&!picking)tools?.map.panTo(p.position);
    });
  },[selected,points,tools,picking]);
  if(!apiKey||failed)return <div className={compact?'map-unavailable compact-map':'map-unavailable'} role="status">
    <strong>{t('Map unavailable','Kartta ei ole käytettävissä')}</strong>
    <span>{picking?t('You can enter coordinates below.','Voit syöttää koordinaatit alla.'):t('You can still browse the location list.','Voit silti selata paikkaluetteloa.')}</span>
  </div>;
  return <div className={compact?'map-frame compact-map':'map-frame'}>
    {!tools&&<p className="map-loading" role="status">{t('Loading Google Maps…','Ladataan Google Mapsia…')}</p>}
    <div ref={node} className="map-canvas" role="region" aria-label={t('Google map of Lappeenranta','Lappeenrannan kartta Google Mapsissa')}/>
  </div>;
}
