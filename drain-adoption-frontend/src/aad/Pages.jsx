import React,{useEffect,useState} from 'react';
import {Link,useParams,useNavigate,useLocation} from 'react-router-dom';
import {useLanguage,StudyNotice,Safety} from './Language';
import {useAuth} from '../context/AuthContext';
import API from '../config/api';
export function Guide(){const {t}=useLanguage();return <div className="page narrow"><h1>{t('Simple steps. Safe participation.','Helppoja vaiheita. Turvallista osallistumista.')}</h1><StudyNotice/><Safety/><h2>{t('What is useful to report?','Mistä kannattaa ilmoittaa?')}</h2><p>{t('Leaves or debris covering a drain, visible damage, or water pooling nearby. Describe what you observe; no diagnosis is needed.','Lehdet tai roskat kaivon päällä, näkyvä vaurio tai lähelle kertyvä vesi. Kuvaile havainto; syytä ei tarvitse selvittää.')}</p><h2>{t('What happens next?','Mitä tapahtuu seuraavaksi?')}</h2><p>{t('The student team reviews reports. This prototype does not send reports to the city. Closed includes a reason, but is not proof of repair.','Opiskelijaryhmä tarkastelee ilmoituksia. Prototyyppi ei lähetä niitä kaupungille. Sulkemiselle annetaan syy, mutta se ei ole todiste korjauksesta.')}</p><h2>{t('Your privacy','Yksityisyytesi')}</h2><p>{t('Do not include personal details. Reports and photos are available only to coordinators and people with your private link. Accounts are separate from anonymous research surveys.','Älä lisää henkilötietoja. Ilmoitukset ja kuvat näkyvät vain koordinaattoreille ja yksityisen linkkisi haltijoille. Tilit pidetään erillään anonyymeistä tutkimuskyselyistä.')}</p><Link className="button" to="/report">{t('Start a report','Aloita ilmoitus')}</Link></div>;}
export function Account({register=false}){
  const {t}=useLanguage();
  const {login,register:create}=useAuth();
  const navigate=useNavigate();
  const returnTo=useLocation().state?.returnTo;
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [error,setError]=useState(false),[busy,setBusy]=useState(false);

  async function submit(event){
    event.preventDefault();
    setBusy(true);
    setError(false);
    try{
      if(register) await create(name,email,password);
      else await login(email,password);
      const returnToAdmin=!register&&['/admin/locations','/admin/reports'].includes(returnTo);
      const returnToLocation=typeof returnTo==='string'&&/^\/drains#location-\d+$/.test(returnTo);
      navigate(returnToAdmin||returnToLocation?returnTo:'/drains',{replace:true});
    }catch{
      setError(true);
    }finally{
      setBusy(false);
    }
  }

  return <div className="page narrow">
    <span className="eyebrow">{t('Optional account','Valinnainen käyttäjätili')}</span>
    <h1>{register?t('Create an account','Luo käyttäjätili'):t('Welcome back','Tervetuloa takaisin')}</h1>
    <p>{t('Only needed for ongoing adoption or coordinator access. Reports need no account.','Tarvitaan vain jatkuvaan adoptointiin tai koordinaattorin käyttöön. Ilmoittamiseen ei tarvita tiliä.')}</p>
    <form className="form-panel" onSubmit={submit}>
      {register&&<label>{t('Display name','Näyttönimi')}<input required maxLength={100} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)}/></label>}
      <label>{t('Email','Sähköposti')}<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>{t('Password','Salasana')}<input required type="password" minLength={register?8:1} maxLength={72} autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p role="alert" className="error">{t('Check your details and connection. Registration needs at least 8 password characters and an unused email.','Tarkista tiedot ja yhteys. Rekisteröityminen vaatii vähintään 8-merkkisen salasanan ja käyttämättömän sähköpostiosoitteen.')}</p>}
      <button disabled={busy}>{busy?t('Please wait…','Odota…'):register?t('Create account','Luo tili'):t('Sign in','Kirjaudu')}</button>
    </form>
    <p><Link to={register?'/login':'/register'} state={{returnTo}}>{register?t('Sign in instead','Kirjaudu sen sijaan'):t('Create an optional account','Luo valinnainen tili')}</Link></p>
  </div>;
}
export function Drains({embedded=false}){const {t}=useLanguage();const [drains,setDrains]=useState([]),[error,setError]=useState(false);useEffect(()=>{fetch(API+'/api/drains').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(setDrains).catch(()=>setError(true));},[]);return <div className={embedded?'legacy-locations':'page'}>{!embedded&&<h1>{t('Demonstration locations','Esimerkkipaikat')}</h1>}<p>{t('Illustrative locations, not verified drain assets or an official city inventory. You can report an unlisted location.','Havainnollistavia sijainteja, eivät varmennettuja kaivoja tai kaupungin virallinen luettelo. Voit ilmoittaa myös muusta paikasta.')}</p><Link to="/report">{t('Report a different location','Ilmoita muu sijainti')}</Link>{error&&<p role="alert">{t('Locations unavailable. The report form is still available.','Paikkoja ei voitu ladata. Ilmoituslomake on silti käytettävissä.')}</p>}<div className="drain-grid">{drains.map(d=><article key={d.id}><span className="drain-symbol" aria-hidden="true">▤</span><span className="eyebrow">{t('DEMONSTRATION ONLY','VAIN ESIMERKKI')}</span><h2>{d.name.replace('DEMO ','')}</h2><p>{d.latitude?.toFixed(4)}, {d.longitude?.toFixed(4)}</p><p>{d.adoptedByUserId?t('Being followed','Seurannassa'):t('Available to follow','Seurattavissa')}</p><Link className="secondary button" to={'/drains/'+d.id}>{t('View location','Katso paikka')}</Link></article>)}</div></div>;}
export function DrainDetail(){const {id}=useParams();const {t}=useLanguage();const {user,getToken}=useAuth();const [drain,setDrain]=useState(null),[comments,setComments]=useState([]),[comment,setComment]=useState(''),[error,setError]=useState(false);function load(){fetch(API+'/api/drains/'+id).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(setDrain).catch(()=>setError(true));fetch(`${API}/api/drains/${id}/comments`).then(r=>r.ok?r.json():[]).then(setComments).catch(()=>{});}useEffect(load,[id]);async function action(e,adopt){if(e)e.preventDefault();setError(false);try{const r=await fetch(`${API}/api/drains/${id}/${adopt?'adopt':'comments'}`,{method:'POST',headers:{Authorization:'Bearer '+getToken(),'Content-Type':'application/json'},...(adopt?{}:{body:JSON.stringify({text:comment})})});if(!r.ok)throw new Error();setComment('');load();}catch(e){setError(true);}}if(!drain)return <div className="page" role="status">{error?t('Location unavailable','Paikka ei ole saatavilla'):t('Loading…','Ladataan…')}</div>;return <div className="page narrow"><StudyNotice/><span className="eyebrow">{t('Unverified demonstration location','Varmistamaton esimerkkipaikka')}</span><h1>{drain.name.replace('DEMO ','')}</h1><p>{drain.latitude}, {drain.longitude}</p><Link className="button" to={'/report?drain='+id}>{t('Report here','Ilmoita tästä')}</Link><h2>{t('Optional ongoing observation','Valinnainen jatkuva havainnointi')}</h2><p>{t('Adoption means following this location, not cleaning. This inherited prototype allows one location per account.','Adoptointi tarkoittaa seuraamista, ei puhdistamista. Tämä aiemmasta työstä jatkettu prototyyppi sallii yhden paikan tiliä kohden.')}</p>{!user?<Link to="/login">{t('Sign in to follow','Kirjaudu seurataksesi')}</Link>:drain.adoptedByUserId?<p>{t('Already being followed. Anyone can still report.','Jo seurannassa. Kaikki voivat silti ilmoittaa.')}</p>:<button className="secondary" onClick={()=>action(null,true)}>{t('Adopt for observation','Adoptoi havainnointia varten')}</button>}{user?.userId===drain.adoptedByUserId&&<form onSubmit={e=>action(e,false)}><label>{t('Public update (no personal information)','Julkinen päivitys (ei henkilötietoja)')}<textarea required rows={3} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></label><button>{t('Post update','Julkaise päivitys')}</button></form>}{error&&<p role="alert" className="error">{t('Action unsuccessful. Check your connection and account. You may already follow another location.','Toiminto epäonnistui. Tarkista yhteys ja tili. Saatat jo seurata toista paikkaa.')}</p>}{comments.length>0&&<><h2>{t('Public adoption updates','Julkiset adoptointipäivitykset')}</h2>{comments.map(c=><article className="update" key={c.id}><small>{new Date(c.createdAt).toLocaleString()}</small><p>{c.text}</p></article>)}</>}</div>;}
