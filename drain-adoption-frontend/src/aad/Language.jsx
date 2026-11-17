import React, { createContext, useContext, useEffect, useState } from 'react';
const Context = createContext(null);
export function LanguageProvider({children}) {
  const [language,setLanguage]=useState(()=>localStorage.getItem('aad-language')==='fi'?'fi':'en');
  useEffect(()=>{document.documentElement.lang=language;localStorage.setItem('aad-language',language);},[language]);
  return <Context.Provider value={{language,setLanguage,t:(en,fi)=>language==='fi'?fi:en}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function StudyNotice(){const {t}=useLanguage();return <p className="study-notice">{t('Course study prototype · Reports are reviewed by the student project team, not the City of Lappeenranta. This is not an emergency service.','Kurssin tutkimusprototyyppi · Ilmoitukset käsittelee opiskelijaryhmä, ei Lappeenrannan kaupunki. Tämä ei ole hätäpalvelu.')}</p>;}
export function Safety(){const {t}=useLanguage();return <section className="safety"><h2>{t('Observe from a safe place','Havainnoi turvallisesta paikasta')}</h2><ul><li>{t('Do not lift covers, reach into drains or enter the road to take a photo.','Älä nosta kansia, työnnä käsiä kaivoon tai mene ajoradalle valokuvaamaan.')}</li><li>{t('Avoid floodwater, ice and traffic. If observing feels unsafe, stop.','Vältä tulvavettä, jäätä ja liikennettä. Lopeta, jos havainnointi tuntuu vaaralliselta.')}</li><li>{t('Report what you can see. No cleaning or ongoing commitment is required.','Ilmoita näkyvä havainto. Puhdistamista tai jatkuvaa sitoutumista ei edellytetä.')}</li><li>{t('For immediate danger, use the appropriate emergency service, not this prototype.','Välittömässä vaarassa käytä asianmukaista hätäpalvelua, älä tätä prototyyppiä.')}</li></ul></section>;}
export const statuses=['RECEIVED','UNDER_REVIEW','FEEDBACK_PROVIDED','CLOSED'];
export function statusLabel(s,t){return ({RECEIVED:t('Received','Vastaanotettu'),UNDER_REVIEW:t('Under review','Tarkasteltavana'),FEEDBACK_PROVIDED:t('Feedback provided','Palaute annettu'),CLOSED:t('Closed','Suljettu')})[s]||s;}
export const issues=['BLOCKED_DRAIN','STANDING_WATER','DAMAGED_DRAIN','OTHER'];
export function issueLabel(s,t){return ({BLOCKED_DRAIN:t('Blocked drain','Tukkeutunut hulevesikaivo'),STANDING_WATER:t('Standing water','Seisova vesi'),DAMAGED_DRAIN:t('Damaged drain','Vaurioitunut hulevesikaivo'),OTHER:t('Other observation','Muu havainto')})[s]||s;}
