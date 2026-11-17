import React,{useEffect,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import API from '../config/api';
import {coursePilot} from '../config/pilot';
import LocationMap,{locationsMapConfigured} from './LocationMap';
import {useLanguage,StudyNotice,Safety,issues,issueLabel} from './Language';

const localNow=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export default function ReportForm(){
 const {language,t}=useLanguage();const [params]=useSearchParams();
 const [drains,setDrains]=useState([]),[drainId,setDrainId]=useState(params.get('drain')||'');
 const [mapOpen,setMapOpen]=useState(false);
 const [location,setLocation]=useState(''),[latitude,setLat]=useState(null),[longitude,setLng]=useState(null);
 const [issueType,setIssue]=useState(issues[0]),[observedAt,setTime]=useState(localNow),[description,setDescription]=useState('');
 const [photo,setPhoto]=useState(null),[photoError,setPhotoError]=useState(false),[consent,setConsent]=useState(false);
 const photoInput=useRef(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(null),[geoError,setGeoError]=useState(false);
 useEffect(()=>{fetch(API+'/api/drains').then(r=>r.ok?r.json():[]).then(data=>{setDrains(data);const selected=data.find(d=>String(d.id)===params.get('drain'));if(selected){setLocation(selected.name);setLat(selected.latitude);setLng(selected.longitude);}}).catch(()=>{});},[params]);
 function selectDrain(value){setDrainId(value);const d=drains.find(x=>String(x.id)===value);setLocation(d?d.name:'');setLat(d?.latitude??null);setLng(d?.longitude??null);}
 function locate(){setGeoError(false);if(!navigator.geolocation){setGeoError(true);return;}navigator.geolocation.getCurrentPosition(p=>{setLat(p.coords.latitude);setLng(p.coords.longitude);},()=>setGeoError(true),{timeout:10000});}
 function removePhoto(){setPhoto(null);if(photoInput.current)photoInput.current.value='';}
 function choosePhoto(e){const f=e.target.files[0];setPhotoError(false);setError('');if(f&&(!['image/jpeg','image/png'].includes(f.type)||f.size>5*1024*1024)){removePhoto();setPhotoError(true);}else setPhoto(f||null);}
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');
  try{
   const form=new FormData();
   form.append('report',new Blob([JSON.stringify({drainId:drainId?Number(drainId):null,location,latitude,longitude,issueType,observedAt:new Date(observedAt).toISOString(),description,language,consent})],{type:'application/json'}));
   if(photo)form.append('photo',photo);
   const r=await fetch(API+'/api/reports',{method:'POST',body:form});
   if(!r.ok){
    const data=await r.json().catch(()=>({}));
    if(photo&&['INVALID_PHOTO','PHOTO_TOO_LARGE','PHOTO_STORAGE_FULL','REPORT_PHOTOS_DISABLED'].includes(data.code)){
     removePhoto();setError(data.code);return;
    }
    throw new Error('submit');
   }
   setReceipt(await r.json());removePhoto();setDescription('');setLocation('');
  }catch{setError('submit');}finally{setBusy(false);}
 }
 if(receipt){const url=`${window.location.origin}/reports/${receipt.id}#token=${receipt.token}`;return <div className="page narrow"><StudyNotice/><span className="eyebrow">{t('Report received','Ilmoitus vastaanotettu')}</span><h1>{t('Thank you for looking out for your neighbourhood.','Kiitos, että huolehdit lähiympäristöstäsi.')}</h1><p>{t('Save this private link. It is the only way to find your report without an account. Anyone with the link can read it.','Tallenna yksityinen linkki. Sen avulla löydät ilmoituksesi ilman käyttäjätiliä. Linkin saanut henkilö voi lukea ilmoituksen.')}</p><label>{t('Report number','Ilmoitusnumero')}<input readOnly value={receipt.id}/></label><label>{t('Private tracking link','Yksityinen seurantalinkki')}<input readOnly value={url} onFocus={e=>e.target.select()}/></label><Link className="button" to={`/reports/${receipt.id}#token=${receipt.token}`}>{t('View my report','Katso ilmoitukseni')}</Link><p>{t('Received means received by the study team. It does not mean that the city has been notified or the issue has been fixed.','Vastaanotettu tarkoittaa, että tutkimusryhmä on saanut ilmoituksen. Se ei tarkoita, että kaupunki olisi saanut tiedon tai ongelma olisi korjattu.')}</p></div>;}
 return <div className="page report-layout"><div><span className="eyebrow">{t('A small action for your neighbourhood','Pieni teko lähiympäristösi hyväksi')}</span><h1>{t('Report an observation','Ilmoita havainto')}</h1><p>{t('No account or adoption needed. Tell us about a blocked drain or standing water in Lappeenranta.','Et tarvitse käyttäjätiliä tai kaivon adoptointia. Kerro tukkeutuneesta hulevesikaivosta tai seisovasta vedestä Lappeenrannassa.')}</p><StudyNotice/><Safety/></div><form className="form-panel" onSubmit={submit}>
 <label>{t('Existing demonstration location (optional)','Olemassa oleva esimerkkipaikka (valinnainen)')}<select value={drainId} onChange={e=>selectDrain(e.target.value)}><option value="">{t('A different or unlisted location','Muu tai luetteloimaton paikka')}</option>{drains.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
 <label>{t('Street, address or landmark *','Katu, osoite tai maamerkki *')}<input required maxLength={300} value={location} onChange={e=>setLocation(e.target.value)} placeholder={t('Describe where the issue is','Kuvaile ongelman sijainti')}/></label>
 <div className="location-tools"><button type="button" className="secondary" onClick={locate}>{t('Add my current location','Lisää nykyinen sijaintini')}</button>{latitude!==null&&<><small>{latitude.toFixed(5)}, {longitude.toFixed(5)}</small><button className="text-button" type="button" onClick={()=>{setLat(null);setLng(null);}}>{t('Remove coordinates','Poista koordinaatit')}</button></>}</div>
 {geoError&&<p role="status">{t('Location unavailable. You can still report using the street or landmark field.','Sijaintia ei saatu. Voit silti ilmoittaa havainnon katu- tai maamerkkitiedon avulla.')}</p>}
 {locationsMapConfigured&&<details className="report-map" onToggle={e=>setMapOpen(e.currentTarget.open)}><summary>{t('Choose coordinates on the map','Valitse koordinaatit kartalta')}</summary>{mapOpen&&<LocationMap compact points={latitude!==null&&longitude!==null?[{id:'report',latitude,longitude}]:[]} onPick={(lat,lng)=>{setLat(lat);setLng(lng);}}/>}</details>}
 <label>{t('What did you notice? *','Mitä havaitsit? *')}<select value={issueType} onChange={e=>setIssue(e.target.value)}>{issues.map(s=><option key={s} value={s}>{issueLabel(s,t)}</option>)}</select></label>
 <label>{t('When did you observe it? *','Milloin teit havainnon? *')}<input type="datetime-local" required value={observedAt} onChange={e=>setTime(e.target.value)}/></label>
 <label>{t('Describe what you can see *','Kuvaile näkyvä havainto *')}<textarea rows={4} required maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label><small>{t('Do not include names, contact details or other personal information.','Älä lisää nimiä, yhteystietoja tai muita henkilötietoja.')}</small>
 <label htmlFor="report-photo">{t('Photo (optional, JPG or PNG, up to 5 MB)','Kuva (valinnainen, JPG tai PNG, enintään 5 Mt)')}</label><div className="photo-picker"><label className="secondary button" htmlFor="report-photo">{t('Choose photo','Valitse kuva')}</label><input ref={photoInput} className="sr-only" id="report-photo" type="file" accept="image/jpeg,image/png" onChange={choosePhoto} disabled={busy}/><span>{photo?photo.name:t('No photo selected','Kuvaa ei valittu')}</span>{photo&&<button className="text-button" type="button" onClick={removePhoto} disabled={busy}>{t('Remove','Poista')}</button>}</div>
 {photoError&&<p role="status">{t('The photo could not be used. Choose a JPG or PNG up to 5 MB, or submit without a photo.','Kuvaa ei voitu käyttää. Valitse enintään 5 Mt:n JPG- tai PNG-kuva tai lähetä ilman kuvaa.')}</p>}
 <small>{coursePilot?t('Use a test photo with no faces, number plates or personal information. The photo stays private.','Käytä testikuvaa, jossa ei näy kasvoja, rekisterikilpiä eikä henkilötietoja. Kuva pysyy yksityisenä.'):t('Avoid faces, number plates and private information. Photos are not published.','Vältä kasvoja, rekisterikilpiä ja yksityisiä tietoja. Kuvia ei julkaista.')}</small>
 <label className="check"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{t('I agree that the project team may use this observation for the course study. I understand this is not a city or emergency service.','Hyväksyn havaintoni käytön kurssin tutkimuksessa. Ymmärrän, ettei tämä ole kaupungin palvelu tai hätäpalvelu.')}</span></label>
 {error&&<p role="alert" className="error">{error==='PHOTO_STORAGE_FULL'?t('Photo storage is full. Your text is still here; you can submit without a photo.','Kuvatallennustila on täynnä. Tekstisi säilyi. Voit lähettää ilmoituksen ilman kuvaa.'):error!=='submit'?t('The photo was removed. Your text is still here; you can submit without a photo.','Kuva poistettiin. Tekstisi säilyi; voit lähettää ilman kuvaa.'):t('The report was not saved. Check the connection and required fields, then retry. Your text has been kept.','Ilmoitusta ei tallennettu. Tarkista yhteys ja pakolliset tiedot ja yritä uudelleen. Tekstisi säilyi.')}</p>}
 <button disabled={busy} type="submit">{busy?t('Sending…','Lähetetään…'):t('Send observation','Lähetä havainto')}</button>
 </form></div>;
}
