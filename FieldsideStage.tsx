import React from 'react';
import ClubCrest from './ClubCrest';
import CompetitionLogo from './CompetitionLogo';
import type { Fixture, Selection } from './types';

export default function FieldsideStage({ fixture, odds, selection, onOpen, onSelect }: {
  fixture: Fixture;
  odds: [number, number, number];
  selection: Selection | null;
  onOpen: () => void;
  onSelect: (index: number) => void;
}) {
  const state = fixture.status.toLowerCase();
  const pitchIllustration = fixture.id === 'real-madrid-arsenal';
  const unavailable = fixture.status === 'FINISHED' || fixture.suspended;
  const phase = fixture.status === 'LIVE' ? `${fixture.time} simulated` : fixture.status === 'FINISHED' ? 'Final sample' : `${fixture.date === 'TOMORROW' ? 'Tomorrow' : 'Today'} · ${fixture.time}`;
  const arrow = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>;
  return (
    <section data-fixture-id={fixture.id} className={`fieldside-stage ${pitchIllustration ? 'has-pitch-illustration' : ''} ${fixture.status === 'LIVE' ? 'is-live' : ''} ${fixture.status === 'FINISHED' ? 'is-final' : ''} state-${state}`} role="group" tabIndex={0} aria-label={`${fixture.home} versus ${fixture.away}, simulated match`} onClick={onOpen} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(); } }}>
      <div className="fieldside-stage-photo" aria-hidden="true" />
      <div className="fieldside-stage-top"><span className="stage-competition"><CompetitionLogo competition={fixture.competition} /><span className="stage-competition-copy">{fixture.competition} <i>/</i> {fixture.round}</span></span><span className={`stage-sample-label ${pitchIllustration ? 'stage-image-note' : ''}`}>{pitchIllustration ? 'Pitch' : 'Sample'}</span></div>
      <div className="fieldside-matchup">
        <div className="fieldside-team"><ClubCrest club={fixture.home} className="stage-crest" /><strong>{fixture.home}</strong><small>Home</small></div>
        <div className="fieldside-score"><span>{fixture.homeScore !== undefined ? `${fixture.homeScore} - ${fixture.awayScore}` : 'VS'}</span><small className={fixture.status === 'LIVE' ? 'stage-live' : ''}>{phase}</small></div>
        <div className="fieldside-team away"><ClubCrest club={fixture.away} className="stage-crest" /><strong>{fixture.away}</strong><small>Away</small></div>
      </div>
      <div className="fieldside-stage-bottom">
        <div className="stage-state-copy"><span className={fixture.status === 'LIVE' ? 'stage-live' : ''}>{fixture.status === 'LIVE' ? 'In play' : fixture.status === 'FINISHED' ? 'Match complete' : 'Kick-off'}</span><strong>{unavailable ? (fixture.status === 'FINISHED' ? 'Market closed' : 'Market suspended') : 'Match result'}</strong></div>
        {unavailable ? <div className="stage-unavailable" role="status">{fixture.status === 'FINISHED' ? 'Final sample · no prices available' : 'Prices paused in this sample'}</div> : <div className="fieldside-prices" aria-label="Match result sample odds">{odds.map((odd, index) => {
          const label = ['1', 'Draw', '2'][index];
          const name = index === 0 ? fixture.home : index === 1 ? 'Draw' : fixture.away;
          const selected = selection?.fixtureId === fixture.id && selection.market === 'Match result' && selection.label === name;
          return <button key={label} className={`fieldside-price row-odd ${selected ? 'is-selected' : ''}`} aria-pressed={selected} aria-label={`Select ${name} at ${odd.toFixed(2)}`} onClick={(event) => { event.stopPropagation(); onSelect(index); }}><small>{label}</small><strong>{odd.toFixed(2)}</strong></button>;
        })}</div>}
        <button className="stage-match-link" onClick={(event) => { event.stopPropagation(); onOpen(); }}>Match details {arrow}</button>
      </div>
    </section>
  );
}
