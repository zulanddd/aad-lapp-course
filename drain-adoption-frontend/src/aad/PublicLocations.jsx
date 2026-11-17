import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import API from '../config/api';
import {issueLabel,StudyNotice,useLanguage} from './Language';
import LocationMap,{pinIcons} from './LocationMap';
import {Drains} from './Pages';

export const labelKind=(kind,t)=>kind==='DRAIN'?t('Drain location','Hulevesikaivon sijainti'):issueLabel(kind,t);
export const locationTitle=(point,language)=>language==='fi'?(point.nameFi||point.name):point.name;

export function LocationCard({point,photo,selected,onSelect}) {
  const {language,t}=useLanguage();
  const title=locationTitle(point,language);
  const description=language==='fi'?(point.descriptionFi||point.description):point.description;
  return <article className={'location-card'+(selected?' selected-card':'')}>
    {photo&&<img src={photo} alt={t('Site photograph: ','Valokuva kohteesta: ')+title} loading="lazy" decoding="async"/>}
    <div className="location-card-body">
      <span className="location-type"><span aria-hidden="true">{pinIcons[point.kind]}</span> {labelKind(point.kind,t)}</span>
      <h3>{onSelect?<button type="button" className="location-select" aria-pressed={selected} onClick={onSelect}>{title}</button>:title}</h3>
      <small><time dateTime={point.observedOn}>{point.observedOn}</time> · {Number(point.latitude).toFixed(5)}, {Number(point.longitude).toFixed(5)}</small>
      <p className="preserve-text">{description}</p>
    </div>
  </article>;
}

export default function PublicLocations(){
  const {t,language}=useLanguage();
  const [data,setData]=useState(null),[error,setError]=useState(false),[selected,setSelected]=useState(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(API+'/api/locations',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();})
      .then(setData).catch(err=>{if(err.name!=='AbortError')setError(true);});
    return()=>controller.abort();
  },[]);
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
    {error?<p role="alert">{t('Locations could not be loaded. You can still send an observation.','Kohteita ei voitu ladata. Voit silti ilmoittaa havainnon.')}</p>:!data?<p role="status">{t('Loading locations…','Ladataan kohteita…')}</p>:!data.length?<p className="empty-locations">{t('No field locations have been published yet. You can still report a location using a street or landmark.','Maastokohteita ei ole vielä julkaistu. Voit silti ilmoittaa sijainnin kadun tai maamerkin avulla.')}</p>:
      <div className="location-cards">{data.map(p=><LocationCard key={p.id} point={p} photo={API+'/api/locations/'+p.id+'/photo'} selected={selected===p.id} onSelect={()=>setSelected(p.id)}/>)}</div>}
    <details className="demo-locations"><summary>{t('Show older demonstration locations','Näytä aiemmat esimerkkipaikat')}</summary><Drains embedded/></details>
  </div>;
}
