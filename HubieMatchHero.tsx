import React from 'react';
import type { Fixture, Selection } from './types';
import ClubCrest from './ClubCrest';
import CompetitionLogo from './CompetitionLogo';
import MatchLiveSignal from './MatchLiveSignal';

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
  const isLive = fixture.status === 'LIVE' && fixture.phase !== 'FT';
  const isHalfTime = isLive && fixture.phase === 'HT';
  const isActivelyLive = isLive && !isHalfTime;
  const isFinished = fixture.status === 'FINISHED' || fixture.phase === 'FT';
  const period = fixture.phase === '1H' ? '1st half' : fixture.phase === '2H' ? '2nd half' : fixture.phase === 'ET' ? 'Extra time' : 'In play';

  return (
    <section className="hubie-match-hero" aria-label="Featured match" data-fixture-id={fixture.id}>
      <div className="hubie-hero-content">
        <div className="hubie-hero-kicker"><CompetitionLogo competition={fixture.competition} /><span>{fixture.competition}</span></div>
        <h1 className="hubie-hero-title" aria-label={`${fixture.home} versus ${fixture.away}`}>
          {[fixture.home, fixture.away].map((club) => <span className="hubie-hero-team" key={club}><ClubCrest club={club} /><span>{shortClubName(club)}</span></span>)}
        </h1>
        <div className="hubie-hero-matchline">
          {isLive || isFinished ? <strong className="hubie-hero-score">{fixture.homeScore ?? 0}<span>:</span>{fixture.awayScore ?? 0}</strong> : <strong className="hubie-hero-kickoff">{fixture.date === 'TOMORROW' ? 'Tomorrow' : 'Today'} {fixture.time}</strong>}
          <span className={`hubie-hero-status${isActivelyLive ? ' is-live' : ''}${isHalfTime ? ' is-halftime' : ''}`}>
            {isActivelyLive ? <><MatchLiveSignal /><span>{fixture.time} · {period}</span></> : isHalfTime ? <><strong className="hubie-hero-state-tag is-halftime">HT</strong><span>Half-time</span></> : isFinished ? <><strong className="hubie-hero-state-tag is-fulltime">FT</strong><span>Full time</span></> : <span>Upcoming</span>}
          </span>
        </div>
        <button type="button" className="hubie-hero-open" onClick={onOpen} aria-label={`Open ${fixture.home} v ${fixture.away} match centre`}>View match<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></button>
      </div>
      <div className="hubie-hero-art"><img className="hubie-hero-mascot" src="/hubie-mascot.png" alt="Hubie, the official Housebets mascot" width="458" height="562" loading="eager" decoding="async" draggable={false} /></div>
      <div className="hubie-hero-market">
        <div className="hubie-hero-market-heading"><span>1X2</span></div>
        {fixture.suspended ? <div className="hubie-hero-suspended" role="status" aria-label="1X2 market suspended"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4.5" y="10" width="15" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><strong>Suspended</strong></div> : <>
        {isFinished ? <div className="hubie-hero-closed">Market closed</div> : <div className="hubie-hero-odds">
          {odds.map((odd, index) => {
            const selected = selection?.fixtureId === fixture.id && selection.market === 'Match result' && selection.label === outcomes[index];
            return <button type="button" key={outcomes[index]} className={`hubie-hero-odd${selected ? ' is-selected' : ''}`} disabled={fixture.suspended || isFinished} onClick={() => onSelect(index)} aria-pressed={selected} aria-label={fixture.suspended ? `${outcomes[index]} at ${odd.toFixed(2)}, market suspended` : isFinished ? `${outcomes[index]} at ${odd.toFixed(2)}, market closed` : `Select ${outcomes[index]} at ${odd.toFixed(2)}`}><span>{['1', 'Draw', '2'][index]}</span><strong>{odd.toFixed(2)}</strong></button>;
          })}
        </div>}
        </>}
      </div>
    </section>
  );
}
