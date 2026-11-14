import React from 'react';
import type { Fixture, Selection } from './types';
import ClubCrest from './ClubCrest';
import CompetitionLogo from './CompetitionLogo';
import MatchLiveSignal from './MatchLiveSignal';
import { OddsChangeCue, matchesOddsMovement, useRecentOddsMovement } from './OddsChangeContext';

const shortClubName = (club: string) => club === 'Brighton & Hove Albion' ? 'Brighton' : club;

type Props = {
  fixture: Fixture;
  odds: [number, number, number];
  selection: Selection | null;
  onOpen: () => void;
  onSelect: (index: number) => void;
  hidden?: boolean;
  animateEntrance?: boolean;
};

/** Official Housebets Hubie sprite, locally bundled; no promotional or live data. */
export default function HubieMatchHero({ fixture, odds, selection, onOpen, onSelect, hidden = false, animateEntrance = true }: Props) {
  const outcomes = [fixture.home, 'Draw', fixture.away];
  const recentOddsMovement = useRecentOddsMovement();
  const isLive = fixture.status === 'LIVE' && fixture.phase !== 'FT';
  const isHalfTime = isLive && fixture.phase === 'HT';
  const isActivelyLive = isLive && !isHalfTime;
  const isFinished = fixture.status === 'FINISHED' || fixture.phase === 'FT';
  const period = fixture.phase === '1H' ? '1st half' : fixture.phase === '2H' ? '2nd half' : fixture.phase === 'ET' ? 'Extra time' : 'In play';

  return (
    <section className="hubie-match-hero" aria-label="Featured match" data-fixture-id={fixture.id} hidden={hidden}>
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
      <div className="hubie-hero-art" data-motion-entry={animateEntrance ? 'once' : undefined}><img className="hubie-hero-mascot" src="/hubie-mascot-football.png" alt="Hubie, the official Housebets mascot, holding a football" width="1132" height="1389" loading="eager" decoding="async" draggable={false} /></div>
      <div className="hubie-hero-market">
        <div className="hubie-hero-market-heading"><span>1X2</span>{fixture.suspended && <span className="odds-suspension-label" role="status">Suspended</span>}</div>
        {isFinished ? <div className="hubie-hero-closed">Market closed</div> : <div className={`hubie-hero-odds${fixture.suspended ? ' is-suspended' : ''}`}>
          {odds.map((odd, index) => {
            const selected = selection?.fixtureId === fixture.id && selection.market === 'Match result' && selection.label === outcomes[index];
            const movement = matchesOddsMovement(recentOddsMovement, fixture.id, 'Match result', outcomes[index]);
            return <button type="button" key={outcomes[index]} className={`hubie-hero-odd${selected ? ' is-selected' : ''}`} disabled={fixture.suspended || isFinished} onClick={() => onSelect(index)} aria-pressed={selected} aria-label={fixture.suspended ? `${outcomes[index]} at ${odd.toFixed(2)}, market suspended` : isFinished ? `${outcomes[index]} at ${odd.toFixed(2)}, market closed` : `Select ${outcomes[index]} at ${odd.toFixed(2)}`}><span>{['1', 'Draw', '2'][index]}</span><strong>{odd.toFixed(2)}</strong><OddsChangeCue movement={movement} /></button>;
          })}
        </div>}
      </div>
    </section>
  );
}
