import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import API from '../config/api';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from './Language';
import LocationMap,{pinIcons} from './LocationMap';
import {labelKind,LocationCard,locationTitle} from './PublicLocations';

const date=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Helsinki'}).format(new Date());
const blank=()=>({name:'',nameFi:'',description:'',descriptionFi:'',kind:'DRAIN',observedOn:date(),latitude:'',longitude:''});

export default function AdminLocations(){
  const {t,language}=useLanguage();
  const {user,loading,isAdmin,getToken}=useAuth();
  const allowed=isAdmin(),token=getToken();
  const [rows,setRows]=useState([]),[id,setId]=useState(null),[form,setForm]=useState(blank);
  const [file,setFile]=useState(null),[photoUrl,setPhotoUrl]=useState(''),[fileVersion,setFileVersion]=useState(0);
  const [confirmed,setConfirmed]=useState(false),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false);
  const [loadError,setLoadError]=useState(false),[status,setStatus]=useState('');
  const load=useCallback(async()=>{
    try{
      const r=await fetch(API+'/api/admin/locations',{headers:{Authorization:'Bearer '+token}});
      if(!r.ok)throw Error();
      setRows(await r.json());setLoadError(false);
    }catch{setLoadError(true);}
  },[token]);
  useEffect(()=>{if(allowed)load();},[allowed,load]);
  const existing=rows.find(p=>p.id===id);
  const hasStoredPhoto=existing?.hasPhoto;
  useEffect(()=>{
    let url,active=true;
    setPhotoUrl('');
    if(file){url=URL.createObjectURL(file);setPhotoUrl(url);}
    else if(id&&hasStoredPhoto){
      fetch(API+'/api/admin/locations/'+id+'/photo',{headers:{Authorization:'Bearer '+token}})
        .then(r=>r.ok?r.blob():null).then(blob=>{if(active&&blob){url=URL.createObjectURL(blob);setPhotoUrl(url);}}).catch(()=>{});
    }
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[file,id,hasStoredPhoto,token,fileVersion]);
  const {latitude,longitude,kind}=form;
  const pins=useMemo(()=>{
    return latitude!==''&&longitude!==''&&Math.abs(Number(latitude))<=90&&Math.abs(Number(longitude))<=180?
      [{id:'preview',latitude:Number(latitude),longitude:Number(longitude),kind}]:[];
  },[latitude,longitude,kind]);
  const edit=p=>{
    setId(p?.id??null);setForm(p?{...p}:blank());setFile(null);setFileVersion(n=>n+1);
    setConfirmed(false);setPreview(false);setStatus('');
  };
  const field=(key,value)=>{setForm(p=>({...p,[key]:value}));setConfirmed(false);};
  const pick=(latitude,longitude)=>{setForm(p=>({...p,latitude:latitude.toFixed(6),longitude:longitude.toFixed(6)}));setConfirmed(false);};
  async function save(e){
    e.preventDefault();
    const published=e.nativeEvent.submitter?.value==='publish';
    if(published&&(!confirmed||!(file||existing?.hasPhoto)||!form.nameFi.trim()||!form.description.trim()||!form.descriptionFi.trim())){
      setStatus('PHOTO_AND_CONFIRMATION_REQUIRED');return;
    }
    setBusy(true);setStatus('');
    try{
      const body=new FormData();
      body.set('location',new Blob([JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude),published,confirmed})],{type:'application/json'}));
      if(file)body.set('photo',file);
      const r=await fetch(API+'/api/admin/locations'+(id?'/'+id:''),{method:id?'PUT':'POST',body,headers:{Authorization:'Bearer '+token}});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){setStatus(data.code||'ERROR');return;}
      setRows(rs=>[data,...rs.filter(x=>x.id!==data.id)]);edit(data);setStatus(published?'PUBLISHED':'SAVED');
    }catch{setStatus('ERROR');}finally{setBusy(false);}
  }
  async function withdraw(){
    setBusy(true);setStatus('');
    try{
      const r=await fetch(API+'/api/admin/locations/'+id+'/withdraw',{method:'PUT',headers:{Authorization:'Bearer '+token}});
      if(!r.ok)throw Error();
      const data=await r.json();setRows(rs=>rs.map(p=>p.id===id?data:p));
      setConfirmed(false);setStatus('WITHDRAWN');
    }catch{setStatus('ERROR');}finally{setBusy(false);}
  }
  if(loading)return <div className="page" role="status">{t('Loading…','Ladataan…')}</div>;
  if(!allowed)return <div className="page narrow"><h1>{t('Coordinator access only','Vain koordinaattoreille')}</h1><p>{user?t('Your current account cannot publish locations. Use a coordinator account.','Nykyinen tilisi ei voi julkaista kohteita. Käytä koordinaattorin tiliä.'):t('Sign in with a coordinator account to publish locations.','Kirjaudu koordinaattorin tilillä julkaistaksesi kohteita.')}</p><Link className="button" to="/login" state={{returnTo:'/admin/locations'}}>{user?t('Sign in with another account','Kirjaudu toisella tilillä'):t('Sign in as a coordinator','Kirjaudu koordinaattorina')}</Link></div>;
  const messages={
    SAVED:t('Draft saved.','Luonnos tallennettu.'),
    PUBLISHED:t('Location published.','Kohde julkaistu.'),
    WITHDRAWN:t('Location withdrawn. It is no longer public.','Julkaisu peruttu. Kohde ei enää näy julkisesti.'),
    INVALID_LOCATION_PHOTO:t('Use a valid JPG or PNG photo up to 5 MB and 30 megapixels.','Käytä kelvollista JPG- tai PNG-kuvaa, enintään 5 Mt ja 30 megapikseliä.'),
    INVALID_LOCATION:t('Check the location fields, coordinates and observation date.','Tarkista kohteen tiedot, koordinaatit ja havaintopäivä.'),
    INVALID_INPUT:t('Check the form fields and make sure the photo is no larger than 5 MB.','Tarkista lomakkeen tiedot ja varmista, että kuva on enintään 5 Mt.'),
    PHOTO_AND_CONFIRMATION_REQUIRED:t('To publish, add a photo, complete both languages and tick the confirmation.','Lisää julkaisemista varten kuva, täytä tiedot molemmilla kielillä ja valitse vahvistus.'),
    ERROR:t('Could not save the change. Your current entries are still here.','Muutosta ei voitu tallentaa. Syöttämäsi tiedot ovat edelleen lomakkeella.')
  };
  return <div className="page"><div className="location-intro"><div><h1>{t('Manage public locations','Hallitse julkisia kohteita')}</h1><p>{t('Only locations published here appear on the public map. Resident reports stay private.','Vain täällä julkaistut kohteet näkyvät julkisella kartalla. Asukkaiden ilmoitukset pysyvät yksityisinä.')}</p></div><Link to="/drains">{t('View public map','Katso julkinen kartta')}</Link></div>
    <div className="admin-locations-layout"><aside className="form-panel">
      <button className="secondary" type="button" onClick={()=>edit(null)} disabled={busy}>{t('New location','Uusi kohde')}</button>
      {loadError&&<p role="alert">{t('The location list could not be loaded.','Kohdeluetteloa ei voitu ladata.')}</p>}
      <ul className="admin-location-list">{rows.map(p=><li key={p.id}><button type="button" className="location-select" aria-pressed={id===p.id} onClick={()=>edit(p)} disabled={busy}>{locationTitle(p,language)}</button><small>{p.published?t('Published','Julkaistu'):t('Draft','Luonnos')}</small></li>)}</ul>
    </aside><form className="form-panel" onSubmit={save}>
      <h2>{id?t('Edit location','Muokkaa kohdetta'):t('New location','Uusi kohde')}</h2>
      <div className="field-pair"><label>{t('Name in English','Nimi englanniksi')}<input required maxLength={120} value={form.name} onChange={e=>field('name',e.target.value)}/></label><label>{t('Name in Finnish','Nimi suomeksi')}<input maxLength={120} value={form.nameFi} onChange={e=>field('nameFi',e.target.value)}/></label></div>
      <div className="field-pair"><label>{t('Observation type','Havainnon tyyppi')}<select value={form.kind} onChange={e=>field('kind',e.target.value)}>{Object.keys(pinIcons).map(k=><option key={k} value={k}>{labelKind(k,t)}</option>)}</select></label>
      <label>{t('Observation date','Havaintopäivä')}<input type="date" required max={date()} value={form.observedOn} onChange={e=>field('observedOn',e.target.value)}/></label></div>
      <p>{t('Click the map to choose the location, or enter latitude and longitude manually.','Valitse sijainti kartalta tai syötä leveys- ja pituusaste käsin.')}</p>
      <LocationMap compact onPick={pick} points={pins}/>
      <div className="field-pair"><label>{t('Latitude','Leveysaste')}<input type="number" required step="any" min="-90" max="90" value={form.latitude} onChange={e=>field('latitude',e.target.value)}/></label><label>{t('Longitude','Pituusaste')}<input type="number" required step="any" min="-180" max="180" value={form.longitude} onChange={e=>field('longitude',e.target.value)}/></label></div>
      <label>{t('Public description in English','Julkinen kuvaus englanniksi')}<textarea rows={3} maxLength={1200} value={form.description} onChange={e=>field('description',e.target.value)}/></label>
      <label>{t('Public description in Finnish','Julkinen kuvaus suomeksi')}<textarea rows={3} maxLength={1200} value={form.descriptionFi} onChange={e=>field('descriptionFi',e.target.value)}/></label>
      <label>{t('Team photo (JPG or PNG, up to 5 MB)','Ryhmän valokuva (JPG tai PNG, enintään 5 Mt)')}<input type="file" key={fileVersion} accept="image/jpeg,image/png" onChange={e=>{setFile(e.target.files[0]||null);setConfirmed(false);}}/></label>
      {photoUrl&&<img className="admin-location-photo" src={photoUrl} alt={t('Selected site photo','Valittu kohdekuva')}/>}
      <label className="check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>{t('We verified that the photo matches this location and can be published. It does not show identifiable people, number plates or private information.','Olemme varmistaneet, että kuva vastaa tätä sijaintia ja että sen saa julkaista. Kuvassa ei näy tunnistettavia henkilöitä, rekisteritunnuksia eikä yksityisiä tietoja.')}</span></label>
      {status&&<p role={['SAVED','PUBLISHED','WITHDRAWN'].includes(status)?'status':'alert'}>{messages[status]||messages.ERROR}</p>}
      <div className="actions">
        <button type="button" className="secondary" disabled={busy} onClick={()=>setPreview(p=>!p)}>{preview?t('Hide preview','Piilota esikatselu'):t('Preview','Esikatsele')}</button>
        <button type="submit" value="draft" className="secondary" disabled={busy}>{existing?.published?t('Save as draft and remove from map','Tallenna luonnoksena ja poista kartalta'):t('Save draft','Tallenna luonnos')}</button>
        <button type="submit" value="publish" disabled={busy}>{t('Publish location','Julkaise kohde')}</button>
        {existing?.published&&<button type="button" className="secondary" disabled={busy} onClick={withdraw}>{t('Withdraw from map','Peru julkaisu')}</button>}
      </div>
      {preview&&<section className="admin-location-preview"><h3>{t('Public card preview','Julkisen kortin esikatselu')}</h3><LocationCard point={{...form,name:form.name||t('Untitled location','Nimetön kohde')}} photo={photoUrl}/></section>}
    </form></div>
  </div>;
}
