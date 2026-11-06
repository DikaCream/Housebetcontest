import React from 'react';
import type { Fixture, Selection } from './types';
import ClubCrest from './ClubCrest';
import CompetitionLogo from './CompetitionLogo';

const shortClubName = (club: string) => club === 'Brighton & Hove Albion' ? 'Brighton' : club;

type Props = {
  fixture: Fixture;
  odds: [number, number, number];
  selection: Selection | null;
  onOpen: () => void;
  onSelect: (index: number) => void;
};

/** Official Housebets Hubie sprite, locally bundled; no promotional or live data. */
export default function HubieMatchHero({ fixture, odds, selection, onOpen, onSelect }: Props) {
  const outcomes = [fixture.home, 'Draw', fixture.away];
  const isLive = fixture.status === 'LIVE';
  const isClosed = fixture.status === 'FINISHED' || fixture.suspended;

  return (
    <section className="hubie-match-hero" aria-label="Featured simulated match" data-fixture-id={fixture.id}>
      <div className="hubie-hero-content">
        <div className="hubie-hero-kicker"><CompetitionLogo competition={fixture.competition} /><span>{fixture.competition}</span></div>
        <h1 className="hubie-hero-title" aria-label={`${fixture.home} versus ${fixture.away}`}>
          {[fixture.home, fixture.away].map((club) => <span className="hubie-hero-team" key={club}><ClubCrest club={club} /><span>{shortClubName(club)}</span></span>)}
        </h1>
        <div className="hubie-hero-matchline">
          {isLive || fixture.status === 'FINISHED' ? <strong className="hubie-hero-score">{fixture.homeScore ?? 0}<span>:</span>{fixture.awayScore ?? 0}</strong> : <strong className="hubie-hero-kickoff">{fixture.date === 'TOMORROW' ? 'Tomorrow' : 'Today'} {fixture.time}</strong>}
          <span className={`hubie-hero-status${isLive ? ' is-live' : ''}`}><i />{isLive ? `${fixture.time} · sample` : fixture.status === 'FINISHED' ? 'Final sample' : 'Sample fixture'}</span>
        </div>
        <button type="button" className="hubie-hero-open" onClick={onOpen} aria-label={`Open ${fixture.home} v ${fixture.away} match centre`}>View match<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></button>
      </div>
      <div className="hubie-hero-art"><img className="hubie-hero-mascot" src="/hubie-mascot.png" alt="Hubie, the official Housebets mascot" width="458" height="562" loading="eager" decoding="async" draggable={false} /></div>
      <div className="hubie-hero-market">
        <div className="hubie-hero-market-heading"><span>Match result</span><span>Simulated odds</span></div>
        {isClosed ? <div className="hubie-hero-closed">{fixture.suspended ? 'Prices suspended' : 'This sample has finished'}</div> : <div className="hubie-hero-odds">
          {odds.map((odd, index) => {
            const selected = selection?.fixtureId === fixture.id && selection.market === 'Match result' && selection.label === outcomes[index];
            return <button type="button" key={outcomes[index]} className={`hubie-hero-odd${selected ? ' is-selected' : ''}`} onClick={() => onSelect(index)} aria-pressed={selected} aria-label={`Select ${outcomes[index]} at ${odd.toFixed(2)}`}><span>{['1', 'Draw', '2'][index]}</span><strong>{odd.toFixed(2)}</strong></button>;
          })}
        </div>}
      </div>
    </section>
  );
}
