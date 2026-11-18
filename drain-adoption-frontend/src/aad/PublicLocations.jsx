import {useEffect,useMemo,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import API from '../config/api';
import {useAuth} from '../context/AuthContext';
import {issueLabel,StudyNotice,useLanguage} from './Language';
import LocationMap,{pinIcons} from './LocationMap';

export const labelKind=(kind,t)=>kind==='DRAIN'?t('Drain location','Hulevesikaivon sijainti'):issueLabel(kind,t);
export const locationTitle=(point,language)=>language==='fi'?(point.nameFi||point.name):point.name;

export function LocationCard({point,photo,selected,onSelect,children}) {
  const {language,t}=useLanguage();
  const title=locationTitle(point,language);
  const description=language==='fi'?(point.descriptionFi||point.description):point.description;
  return <article id={onSelect?'location-'+point.id:undefined} tabIndex={onSelect?-1:undefined} className={'location-card'+(selected?' selected-card':'')}>
    {photo&&<img src={photo} alt={t('Site photograph: ','Valokuva kohteesta: ')+title} loading="lazy" decoding="async"/>}
    <div className="location-card-body">
      <span className="location-type"><span aria-hidden="true">{pinIcons[point.kind]}</span> {labelKind(point.kind,t)}</span>
      <h3>{onSelect?<button type="button" className="location-select" aria-pressed={selected} onClick={onSelect}>{title}</button>:title}</h3>
      <small><time dateTime={point.observedOn}>{point.observedOn}</time> · {Number(point.latitude).toFixed(5)}, {Number(point.longitude).toFixed(5)}</small>
      <p className="preserve-text">{description}</p>
      {children}
    </div>
  </article>;
}

function AdoptionAction({id, token, authLoading, ids, loadError, onChange}) {
  const {t}=useLanguage();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const adopted=ids?.has(id);
  const signInState={returnTo:'/drains#location-'+id};

  async function change() {
    setBusy(true);
    setError(null);
    try {
      const response=await fetch(API+'/api/locations/'+id+'/adoption',{
        method:adopted?'DELETE':'PUT',
        headers:{Authorization:'Bearer '+token}
      });
      if(response.status===401||response.status===403) setError('sign-in');
      else if(response.status===404) setError('unavailable');
      else if(!response.ok) setError('request');
      else onChange(id,!adopted);
    } catch {
      setError('request');
    } finally {
      setBusy(false);
    }
  }

  if(authLoading) return null;
  if(!token) return <Link className="secondary button" to="/login" state={signInState}>
    {t('Adopt this location','Adoptoi tämä kohde')}
  </Link>;
  if(error==='sign-in'||loadError==='sign-in') return <p role="alert">
    <Link to="/login" state={signInState}>{t('Sign in again to manage adoption','Kirjaudu uudelleen hallitaksesi adoptiota')}</Link>
  </p>;
  if(loadError) return <p role="alert">{t('Adoption status could not be loaded. Reload the page to retry.','Adoption tilaa ei voitu ladata. Yritä uudelleen lataamalla sivu.')}</p>;
  if(!ids) return <p role="status">{t('Loading adoption status…','Ladataan adoption tilaa…')}</p>;
  return <div>
    {adopted&&<p role="status">{t('You adopted this location','Olet adoptoinut tämän kohteen')}</p>}
    <button type="button" className="secondary" disabled={busy||error==='unavailable'} onClick={change}>
      {adopted?t('Cancel adoption','Peru adoptio'):t('Adopt this location','Adoptoi tämä kohde')}
    </button>
    {error&&<p role="alert">{error==='unavailable'
      ?t('This location is no longer available. Reload the map.','Kohde ei ole enää saatavilla. Lataa kartta uudelleen.')
      :t('Could not update your adoption. Try again.','Adoptiota ei voitu päivittää. Yritä uudelleen.')}</p>}
  </div>;
}

export default function PublicLocations(){
  const {t,language}=useLanguage();
  const {user,loading,getToken}=useAuth();
  const token=user?getToken():null;
  const {hash}=useLocation();
  const [data,setData]=useState(null),[error,setError]=useState(false),[selected,setSelected]=useState(null);
  const [adoptions,setAdoptions]=useState(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(API+'/api/locations',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();})
      .then(setData).catch(err=>{if(err.name!=='AbortError')setError(true);});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!token){setAdoptions(null);return;}
    const controller=new AbortController();
    fetch(API+'/api/me/location-adoptions',{
      headers:{Authorization:'Bearer '+token},signal:controller.signal,cache:'no-store'
    }).then(async response=>{
      if(controller.signal.aborted) return;
      if(!response.ok){
        setAdoptions({token,error:response.status===401||response.status===403?'sign-in':'request'});
        return;
      }
      const ids=new Set(await response.json());
      if(!controller.signal.aborted) setAdoptions({token,ids});
    }).catch(()=>{
      if(!controller.signal.aborted) setAdoptions({token,error:'request'});
    });
    return ()=>controller.abort();
  },[token]);
  useEffect(()=>{
    if(!data||!/^#location-\d+$/.test(hash)) return;
    const card=document.getElementById(hash.slice(1));
    card?.scrollIntoView({block:'start'});
    card?.focus({preventScroll:true});
  },[data,hash]);

  function updateAdoptions(id,adopted){
    setAdoptions(current=>{
      if(current?.token!==token||!current.ids) return current;
      const ids=new Set(current.ids);
      if(adopted) ids.add(id);
      else ids.delete(id);
      return {...current,ids};
    });
  }
  const currentAdoptions=adoptions?.token===token?adoptions:null;
  const pins=useMemo(()=>(data||[]).map(p=>({...p,label:locationTitle(p,language)+' — '+labelKind(p.kind,(en,fi)=>language==='fi'?fi:en)})),[data,language]);
  const active=data?.find(p=>p.id===selected);
  return <div className="page locations-page">
    <div className="location-intro"><div><span className="eyebrow">LAPPEENRANTA / AAD 2.0</span><h1>{t('Locations & observation map','Kohteet ja havainnot kartalla')}</h1>
      <p>{t('Explore local drains and observations photographed and published by the student team. Map entries are dated observations, not live warnings or an official city inventory.','Tutustu opiskelijaryhmän kuvaamiin ja julkaisemiin hulevesikaivoihin ja havaintoihin. Kartan merkinnät ovat päivättyjä havaintoja, eivät ajantasaisia varoituksia tai kaupungin virallinen luettelo.')}</p></div>
      <Link className="button" to="/report">{t('Report an observation','Ilmoita havainto')}</Link></div>
    <StudyNotice/>
    <div className="location-map-layout">
      <LocationMap points={pins} selected={selected} onSelect={setSelected}/>
      <aside className="map-side" aria-label={t('Selected location','Valittu kohde')}>
        {active?<LocationCard point={active} photo={API+'/api/locations/'+active.id+'/photo'}/>:<div className="map-legend">
          <h2>{t('Map key','Kartan selite')}</h2>
          <p>{t('Select a pin or a location below to see the field photo and observation.','Valitse karttamerkintä tai kohde luettelosta nähdäksesi kuvan ja havainnon.')}</p>
          <ul>{Object.keys(pinIcons).map(k=><li key={k}><span className={'legend-icon pin-'+k.toLowerCase()} aria-hidden="true">{pinIcons[k]}</span>{labelKind(k,t)}</li>)}</ul>
        </div>}
      </aside>
    </div>
    <h2>{t('Published locations','Julkaistut kohteet')}</h2>
    {!!data?.length&&<p>{t('Adopt a location to keep an eye on it safely. Anyone can send a report. Adoption comes with no cleaning or repair duties.','Adoptoi kohde, jos haluat seurata sen tilannetta turvallisesti. Kuka tahansa voi tehdä ilmoituksen. Adoptio ei velvoita puhdistamaan tai korjaamaan kohdetta.')}</p>}
    {error?<p role="alert">{t('Locations could not be loaded. You can still send an observation.','Kohteita ei voitu ladata. Voit silti ilmoittaa havainnon.')}</p>:!data?<p role="status">{t('Loading locations…','Ladataan kohteita…')}</p>:!data.length?<p className="empty-locations">{t('No field locations have been published yet. You can still report a location using a street or landmark.','Maastokohteita ei ole vielä julkaistu. Voit silti ilmoittaa sijainnin kadun tai maamerkin avulla.')}</p>:
      <div className="location-cards">{data.map(p=><LocationCard key={p.id} point={p} photo={API+'/api/locations/'+p.id+'/photo'} selected={selected===p.id} onSelect={()=>setSelected(p.id)}>
        <AdoptionAction key={token||'guest'} id={p.id} token={token} authLoading={loading}
          ids={currentAdoptions?.ids} loadError={currentAdoptions?.error} onChange={updateAdoptions}/>
      </LocationCard>)}</div>}
  </div>;
}
