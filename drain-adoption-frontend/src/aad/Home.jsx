import {Link} from 'react-router-dom';
import {StudyNotice,useLanguage} from './Language';
import stormDrain from '../assets/images/stormwater-drain.webp';
import {coursePilot} from '../config/pilot';

const photoSource='https://commons.wikimedia.org/wiki/File:Stormwater_Drain.jpg';

export default function Home(){
  const {t}=useLanguage();
  return <>
    <section className="field-hero">
      <figure className="field-hero-photo">
        <img src={stormDrain} alt={t('Close-up of a stormwater drain grate','Lähikuva hulevesikaivon ritilästä')} fetchPriority="high"/>
        <figcaption>{t('Reference photograph','Esimerkkikuva')} · <a href={photoSource} rel="noreferrer">Panelxf / Wikimedia Commons</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noreferrer">CC0</a></figcaption>
      </figure>
      <div className="field-hero-inner">
        <span className="eyebrow"><span className="field-dot" aria-hidden="true"/> {t('Lappeenranta · Resident observations','Lappeenranta · Asukkaiden havainnot')}</span>
        <h1>{t('Look after your neighbourhood.','Pidä huolta lähiympäristöstäsi.')}</h1>
        <p>{t('Seen a blocked drain or water pooling after rain? Share what you see from a safe place and follow the student team’s response.','Oletko nähnyt tukkeutuneen hulevesikaivon tai sateen jälkeen kertynyttä vettä? Kerro havainnostasi turvallisesta paikasta ja seuraa opiskelijaryhmän vastausta.')}</p>
        <div className="actions"><Link className="button" to="/report">{t('Report an observation','Ilmoita havainto')} <span aria-hidden="true">↗</span></Link><Link className="button secondary" to="/drains">{t('View the map','Katso karttaa')} <span aria-hidden="true">→</span></Link></div>
        <small>{t('No account or drain cleaning needed.','Et tarvitse käyttäjätiliä, eikä kaivoa tarvitse puhdistaa.')}</small>
      </div>
    </section>
    <div className="page field-content">
      <StudyNotice/>
      <section aria-labelledby="steps-heading">
        <span className="eyebrow">{t('How it works','Näin se toimii')}</span>
        <h2 id="steps-heading">{t('What to do when you see a problem','Mitä tehdä, kun huomaat ongelman')}</h2>
        <div className="steps field-steps">{[
          [t('Observe safely','Havainnoi turvallisesti'),t('Stay in a safe public place, away from traffic, ice and floodwater.','Pysy turvallisella julkisella paikalla, poissa liikenteestä, jäältä ja tulvavedestä.')],
          [t('Tell us what you see','Kerro, mitä näet'),coursePilot?t('Enter a sample location and describe a test observation.','Syötä esimerkkisijainti ja kuvaile testihavainto.'):t('Add a street or landmark and describe the issue. A photograph is optional.','Lisää katu tai maamerkki ja kuvaile ongelma. Valokuva on valinnainen.')],
          [t('Check back for feedback','Palaa katsomaan palautetta'),t('Keep your private link and use it to check the student team’s response.','Tallenna yksityinen linkki ja käytä sitä opiskelijaryhmän vastauksen katsomiseen.')]
        ].map(([title,body],i)=><article key={i}><span className="step-number" aria-hidden="true">0{i+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>
      <section className="community field-feature"><div><span className="eyebrow">{t('From the field','Maastohavaintoja')}</span><h2>{t('See what the team has observed','Tutustu ryhmän havaintoihin')}</h2><p>{t('Browse field photographs and locations published by the student team. These are dated observations, not live warnings.','Selaa opiskelijaryhmän julkaisemia maastokuvia ja kohteita. Kyse on päivätyistä havainnoista, ei ajantasaisista varoituksista.')}</p></div><Link className="button secondary" to="/drains">{t('Browse locations','Selaa kohteita')} <span aria-hidden="true">→</span></Link></section>
    </div>
  </>;
}
