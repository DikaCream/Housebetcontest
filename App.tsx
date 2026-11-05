import React, { useId, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Badge } from 'panelui-web/badge';
import { Button } from 'panelui-web/button';
import { Card } from 'panelui-web/card';
import { Frame } from 'panelui-web/frame';
import { Input } from 'panelui-web/input';
import { RollingNumber } from 'panelui-web/rolling-number';
import ClubCrest from './ClubCrest';
import KickoffTimeline from './KickoffTimeline';
import FieldsideStage from './FieldsideStage';
import MobileSheet from './MobileSheet';
import './global.css';
import './housebets-brand.css';
import './total-redesign.css';
import './independent-ledger.css';
import './audit-polish.css';
import './fieldside.css';
import './fieldside-fixes.css';
type Page = 'home' | 'live' | 'football' | 'match' | 'activity';
type ActivityTab = 'slip' | 'bets';
type BetStatus = 'open' | 'settled';
type Navigate = (page: Page, fixtureId?: string) => void;
type Notice = { type: 'success' | 'error' | 'warning' | 'info'; text: string };
const isValidStake = (value: string) => /^\d+(?:\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) >= 1;
const formatDemoUSDT = (value: number) => `${value.toFixed(2)} USDT`;
const scrollPageTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
export type Fixture = {
  id: string;
  competition: string;
  round: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  time: string;
  date?: string;
  odds: [number, number, number];
  suspended?: boolean;
  extraMarkets: number;
};

const marketGroups = ['Popular', 'Goals', 'Halves', 'Handicaps', 'Goalscorers', 'Corners & cards'] as const;
type MarketGroup = typeof marketGroups[number];
type SampleMarket = { title: string; sub: string; category: MarketGroup; options: string[]; odds: number[] };

function getSampleMarkets(fixture: Fixture): SampleMarket[] {
  const homePlayer = 'Home #9 · sample';
  const awayPlayer = 'Away #11 · sample';
  return [
    { title: 'Match result', sub: '90 minutes · 1X2', category: 'Popular', options: [fixture.home, 'Draw', fixture.away], odds: fixture.odds },
    { title: 'Double chance', sub: '90 minutes · cover two outcomes', category: 'Popular', options: [`${fixture.home} or Draw`, `${fixture.home} or ${fixture.away}`, `Draw or ${fixture.away}`], odds: [1.28, 1.32, 1.48] },
    { title: 'Total goals', sub: 'Full time total · line 2.5', category: 'Goals', options: ['Over 2.5', 'Under 2.5'], odds: [1.88, 1.92] },
    { title: 'Both teams to score', sub: 'Full time · yes or no', category: 'Goals', options: ['Yes', 'No'], odds: [1.74, 2.05] },
    { title: 'First-half result', sub: 'First 45 minutes · 1X2 sample', category: 'Halves', options: [fixture.home, 'Draw', fixture.away], odds: [2.35, 2.05, 4.20] },
    { title: 'Second-half total goals', sub: 'Second half only · line 1.5', category: 'Halves', options: ['Over 1.5', 'Under 1.5'], odds: [1.95, 1.85] },
    { title: 'Asian handicap', sub: '90 minutes · home -0.5 / away +0.5', category: 'Handicaps', options: [`${fixture.home} -0.5`, `${fixture.away} +0.5`], odds: [2.10, 1.78] },
    { title: '3-way handicap', sub: '90 minutes · home starts one goal behind', category: 'Handicaps', options: [`${fixture.home} -1`, 'Handicap draw', `${fixture.away} +1`], odds: [3.50, 3.70, 1.87] },
    { title: 'Anytime goalscorer', sub: 'Invented player labels · no real player data', category: 'Goalscorers', options: [homePlayer, awayPlayer], odds: [2.60, 3.10] },
    { title: 'Next goalscorer', sub: 'Next sample goal · invented player labels', category: 'Goalscorers', options: [homePlayer, awayPlayer, 'No further goal'], odds: [4.20, 5.40, 2.65] },
    { title: 'Total corners', sub: '90 minutes · total line 9.5', category: 'Corners & cards', options: ['Over 9.5', 'Under 9.5'], odds: [1.95, 1.85] },
    { title: 'Total cards', sub: '90 minutes · total line 3.5', category: 'Corners & cards', options: ['Over 3.5', 'Under 3.5'], odds: [1.88, 1.92] },
    { title: 'Most corners', sub: '90 minutes · team with more corners', category: 'Corners & cards', options: [fixture.home, 'Draw', fixture.away], odds: [2.05, 7.50, 2.20] },
  ];
}

function fixtureSearchText(fixture: Fixture) {
  const markets = getSampleMarkets(fixture);
  return [fixture.home, fixture.away, fixture.competition, fixture.round, 'Home #9', 'Away #11', ...markets.flatMap((market) => [market.title, market.sub, ...market.options])].join(' ').toLowerCase();
}

export type Selection = {
  fixtureId: string;
  fixture: string;
  competition: string;
  market: string;
  label: string;
  odds: number;
};

type DemoBet = {
  id: string;
  fixtureId: string;
  fixture: string;
  competition: string;
  selection: string;
  market: string;
  odds: number;
  stake: number;
  status: BetStatus;
  result?: string;
  returns: number;
  cashout?: number;
  placedAt: string;
  sport: string;
};

const fixtures: Fixture[] = [
  {
    id: 'arsenal-brighton', competition: 'Premier League', round: 'Round 9',
    home: 'Arsenal', away: 'Brighton & Hove Albion', homeScore: 1, awayScore: 0,
    status: 'LIVE', time: "63’", odds: [1.84, 3.20, 4.60], extraMarkets: 12,
  },
  {
    id: 'liverpool-man-utd', competition: 'Premier League', round: 'Round 9',
    home: 'Liverpool', away: 'Manchester United', homeScore: 1, awayScore: 1,
    status: 'LIVE', time: 'HT', odds: [2.35, 2.90, 3.00], extraMarkets: 12,
  },
  {
    id: 'toulouse-strasbourg', competition: 'Ligue 1', round: 'Round 10',
    home: 'Toulouse FC', away: 'RC Strasbourg Alsace', homeScore: 0, awayScore: 0,
    status: 'LIVE', time: 'HT', odds: [2.35, 2.90, 3.00], suspended: true, extraMarkets: 12,
  },
  {
    id: 'real-madrid-bayern', competition: 'UEFA Champions League', round: 'Quarter-final',
    home: 'Real Madrid', away: 'FC Bayern München', homeScore: 2, awayScore: 1, status: 'FINISHED',
    time: 'FT', date: 'FINAL SAMPLE', odds: [1.72, 3.55, 4.75], extraMarkets: 0,
  },
  {
    id: 'man-city-tottenham', competition: 'Premier League', round: 'Round 10',
    home: 'Manchester City', away: 'Tottenham Hotspur', status: 'UPCOMING',
    time: '21:00', date: 'TODAY', odds: [2.10, 3.10, 3.35], extraMarkets: 12,
  },
  {
    id: 'sevilla-inter', competition: 'UEFA Champions League', round: 'Group stage',
    home: 'Sevilla FC', away: 'Inter Milan', status: 'UPCOMING',
    time: '18:15', date: 'TOMORROW', odds: [2.25, 3.30, 3.05], extraMarkets: 12,
  },
  {
    id: 'real-madrid-sevilla', competition: 'LaLiga', round: 'Round 12',
    home: 'Real Madrid', away: 'Sevilla FC', status: 'UPCOMING',
    time: '21:00', date: 'TODAY', odds: [1.82, 3.55, 4.40], extraMarkets: 12,
  },
  {
    id: 'dortmund-bayern', competition: 'Bundesliga', round: 'Round 10',
    home: 'Borussia Dortmund', away: 'FC Bayern München', status: 'UPCOMING',
    time: '20:30', date: 'TOMORROW', odds: [3.10, 3.65, 2.02], extraMarkets: 12,
  },
  {
    id: 'napoli-milan', competition: 'Serie A', round: 'Round 10',
    home: 'SSC Napoli', away: 'AC Milan', status: 'UPCOMING',
    time: '20:45', date: 'TODAY', odds: [2.05, 3.25, 3.60], extraMarkets: 12,
  },
];

function ClubPair({ fixtureId, className = '' }: { fixtureId: string; className?: string }) {
  const fixture = fixtures.find((item) => item.id === fixtureId);
  if (!fixture) return null;
  return <span className={`club-pair ${className}`} aria-hidden="true"><ClubCrest club={fixture.home} /><ClubCrest club={fixture.away} /></span>;
}

const navItems: { id: Page; label: string; icon: string; count?: string }[] = [
  { id: 'home', label: 'Sports home', icon: 'home' },
  { id: 'live', label: 'Live now', icon: 'live', count: '03' },
  { id: 'football', label: 'Football', icon: 'ball' },
  { id: 'match', label: 'Match centre', icon: 'grid' },
  { id: 'activity', label: 'Bet slip & My bets', icon: 'ticket' },
];

const mobileSports = [
  { name: 'Football', icon: 'ball' },
  { name: 'Tennis', icon: 'tennis' },
  { name: 'Basketball', icon: 'basketball' },
  { name: 'Cricket', icon: 'cricket' },
  { name: 'Volleyball', icon: 'volleyball' },
  { name: 'Handball', icon: 'ball' },
];

const pageLabels: Record<Page, { crumb: string; title: string; subtitle: string }> = {
  home: { crumb: 'Sports', title: 'Matchday', subtitle: 'Real club identities. Simulated fixtures, scores and odds.' },
  live: { crumb: 'Live now', title: 'Matches in play', subtitle: 'Every score and price on this board is a simulation.' },
  football: { crumb: 'Football', title: 'Football fixtures', subtitle: 'Browse club matchups and choose one demo outcome.' },
  match: { crumb: 'Match centre', title: 'Match centre', subtitle: 'One fixture, its sample details and six market groups.' },
  activity: { crumb: 'Your bets', title: 'Bet slip & My bets', subtitle: 'A single-pick slip and a local record of demo states.' },
};

const initialBets: DemoBet[] = [
  {
    id: 'demo-open-01', fixtureId: 'arsenal-brighton', fixture: 'Arsenal v Brighton & Hove Albion', competition: 'Premier League',
    selection: 'Arsenal', market: 'Match result', odds: 1.72, stake: 10,
    status: 'open', returns: 17.20, cashout: 14.80, placedAt: 'Today · 14:58', sport: 'Football',
  },
  {
    id: 'demo-settled-01', fixtureId: 'real-madrid-bayern', fixture: 'Real Madrid v FC Bayern München', competition: 'UEFA Champions League',
    selection: 'Real Madrid', market: 'Match result', odds: 2.10, stake: 5,
    status: 'settled', result: 'Won · sample result', returns: 10.50,
    placedAt: 'Yesterday · 19:24', sport: 'Football',
  },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  switch (name) {
    case 'home': return <svg {...common}><path d="m3 10 9-7 9 7"/><path d="M5.5 9v11h13V9M9.5 20v-6h5v6"/></svg>;
    case 'live': return <svg {...common}><path d="M4 9v6M8 6v12M12 3v18M16 7v10M20 10v4"/></svg>;
    case 'tennis': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5c4 1 6.8 4 7.6 8.1.4 2.2-.2 4-1.8 5.8M18.5 5.5c-4 1-6.8 4-7.6 8.1-.4 2.2.2 4 1.8 5.8"/></svg>;
    case 'basketball': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M9 3.6c4.1 4.5 4.1 12.3 0 16.8M15 3.6c-4.1 4.5-4.1 12.3 0 16.8"/></svg>;
    case 'cricket': return <svg {...common}><path d="m6 18 9.5-12.5a2.4 2.4 0 0 1 3.7 3L9.2 21H6v-3Z"/><path d="m13 7 4.5 3M4 4v5m-2.5-2.5h5"/></svg>;
    case 'volleyball': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 3c.3 4 2.3 6.6 6 8m2.5 1c-3.8-.8-7 .3-9.5 4.2M9 20c.5-3.8-.8-6.8-4.8-9.1M4.2 7.2c3.6 1.4 6.7.8 9.8-2.2"/></svg>;
    case 'ball': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m12 7 3.2 2.3-1.2 3.8h-4L8.8 9.3 12 7Zm-3.2 2.3-3.6-.5M10 13.1l-2.4 3m6.4-3 2.3 3m-.3-6.8 3.8-.5M12 7V3m3.2 15.1L12 21l-3.2-2.9"/></svg>;
    case 'grid': return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>;
    case 'ticket': return <svg {...common}><path d="M4 6.5h16v4a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4v-4Z"/><path d="M12 7.5v1m0 2v1m0 2v1m0 2v.5"/></svg>;
    case 'search': return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>;
    case 'arrow': return <svg {...common}><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;
    case 'lock': return <svg {...common}><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
    case 'close': return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>;
    case 'chevron': return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
    case 'star': return <svg {...common}><path d="m12 3 2.75 5.57 6.15.9-4.45 4.34 1.05 6.13L12 17.05l-5.5 2.89 1.05-6.13L3.1 9.47l6.15-.9L12 3Z"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [matchFixtureId, setMatchFixtureId] = useState(fixtures[0].id);
  const [activityTab, setActivityTab] = useState<ActivityTab>('slip');
  const [betFilter, setBetFilter] = useState<BetStatus>('open');
  const [railTab, setRailTab] = useState<ActivityTab>('slip');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [undoSelection, setUndoSelection] = useState<Selection | null>(null);
  const [stake, setStake] = useState('10');
  const [pendingOdds, setPendingOdds] = useState<number | null>(null);
  const [marketSuspended, setMarketSuspended] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [bets, setBets] = useState<DemoBet[]>(initialBets);
  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('All football');
  const [liveSportFilter, setLiveSportFilter] = useState('Football');
  const [liveCompetitionFilter, setLiveCompetitionFilter] = useState('All competitions');
  const [favourites, setFavourites] = useState<string[]>(['Premier League', 'Arsenal']);
  const [following, setFollowing] = useState<string[]>(['Arsenal']);
  const [footballScope, setFootballScope] = useState<'live-upcoming' | 'all'>('live-upcoming');
  const [marketCategory, setMarketCategory] = useState('Popular');
  const [marketQuery, setMarketQuery] = useState('');
  const [collapsedMarkets, setCollapsedMarkets] = useState<string[]>([]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const activeMeta = pageLabels[page];
  const openCount = bets.filter((bet) => bet.status === 'open').length;
  const stakeNumber = Number(stake) || 0;
  const activeOdds = selection?.odds ?? 0;
  const selectionMotionKey = selection ? `${selection.fixtureId}|${selection.market}|${selection.label}|${selection.odds}` : 'empty';
  const estimatedReturn = isValidStake(stake) ? stakeNumber * activeOdds : 0;
  const visibleFixtures = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return fixtures;
    return fixtures.filter((fixture) => fixtureSearchText(fixture).includes(normalized));
  }, [query]);

  function navigate(next: Page, fixtureId?: string) {
    if (next === 'match' && fixtureId) setMatchFixtureId(fixtureId);
    setPage(next);
    setMobileSheetOpen(false);
    if (next === 'activity') setRailTab(activityTab);
    scrollPageTop();
  }

  function selectMobileSport(sport: string) {
    if (sport === 'Football') {
      setNotice(null);
      navigate('football');
      return;
    }
    setNotice({ type: 'info', text: `This contest demo includes fictional football only. ${sport} is shown as a navigation preview.` });
  }

  function openCompetition(competition: string) {
    setSportFilter(competition);
    setFootballScope('all');
    navigate('football');
  }

  function toggleFavourite(item: string) {
    setFavourites((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  }

  function toggleFollow(team: string) {
    setFollowing((current) => current.includes(team) ? current.filter((entry) => entry !== team) : [...current, team]);
  }

  function toggleMarket(title: string) {
    setCollapsedMarkets((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  function makeSelection(fixture: Fixture, pickIndex: number, market = 'Match result') {
    if (fixture.status === 'FINISHED') {
      setNotice({ type: 'warning', text: 'This sample match has finished. Its markets are closed.' });
      return;
    }
    if (fixture.suspended || marketSuspended) {
      setNotice({ type: 'warning', text: 'Market suspended. This sample selection is temporarily unavailable.' });
      return;
    }
    const selectedMarket = getSampleMarkets(fixture).find((item) => item.title === market);
    if (!selectedMarket || !selectedMarket.options[pickIndex] || !Number.isFinite(selectedMarket.odds[pickIndex])) return;
    const nextSelection: Selection = {
      fixtureId: fixture.id,
      fixture: `${fixture.home} v ${fixture.away}`,
      competition: fixture.competition,
      market,
      label: selectedMarket.options[pickIndex],
      odds: selectedMarket.odds[pickIndex],
    };
    if (selection && (selection.fixtureId !== nextSelection.fixtureId || selection.market !== nextSelection.market || selection.label !== nextSelection.label)) {
      setUndoSelection(selection);
      setNotice({ type: 'info', text: `Replaced ${selection.label} with ${nextSelection.label} at ${nextSelection.odds.toFixed(2)}.` });
    } else {
      setUndoSelection(null);
      setNotice({ type: 'info', text: `Added ${nextSelection.label} from ${nextSelection.fixture} to your single demo slip.` });
    }
    setSelection(nextSelection);
    setPendingOdds(null);
    setRailTab('slip');
    setActivityTab('slip');
  }

  function undoSelectionReplacement() {
    if (!undoSelection) return;
    setSelection(undoSelection);
    setNotice({ type: 'success', text: `Restored ${undoSelection.label} at ${undoSelection.odds.toFixed(2)}.` });
    setUndoSelection(null);
    setPendingOdds(null);
    setMarketSuspended(false);
  }

  function clearSelection() {
    setSelection(null);
    setUndoSelection(null);
    setPendingOdds(null);
    setMarketSuspended(false);
    setNotice(null);
  }

  function placeDemoBet() {
    if (!selection || !isValidStake(stake)) return;
    if (marketSuspended) {
      setNotice({ type: 'warning', text: 'Market suspended. Resume it before placing this demo bet.' });
      return;
    }
    if (pendingOdds !== null) {
      setNotice({ type: 'warning', text: 'Accept the changed odds before placing this demo bet.' });
      return;
    }
    if (failNext) {
      setFailNext(false);
      setNotice({ type: 'error', text: 'Demo placement failed. Your slip is unchanged—try again when ready.' });
      return;
    }
    const returns = Number((stakeNumber * selection.odds).toFixed(2));
    const newBet: DemoBet = {
      id: `demo-${Date.now()}`, fixtureId: selection.fixtureId, fixture: selection.fixture, competition: selection.competition,
      selection: selection.label, market: selection.market, odds: selection.odds,
      stake: stakeNumber, status: 'open', returns, cashout: Number((returns * 0.86).toFixed(2)),
      placedAt: 'Just now · demo', sport: 'Football',
    };
    setBets((current) => [newBet, ...current]);
    setActivityTab('bets');
    setBetFilter('open');
    setRailTab('bets');
    setPage('activity');
    setSelection(null);
    setUndoSelection(null);
    setPendingOdds(null);
    setMarketSuspended(false);
    setMobileSheetOpen(false);
    setNotice({ type: 'success', text: `Demo bet placed: ${newBet.selection} · ${formatDemoUSDT(newBet.stake)}.` });
    scrollPageTop();
  }

  function cashOutBet(id: string) {
    setBets((current) => current.map((bet) => bet.id === id && bet.status === 'open'
      ? { ...bet, status: 'settled', result: 'Cashed out · sample only', returns: bet.cashout ?? bet.returns }
      : bet));
    setNotice({ type: 'success', text: 'Sample cash out complete. No funds were moved.' });
  }

  function settleOpenBet() {
    const firstOpen = bets.find((bet) => bet.status === 'open');
    if (!firstOpen) {
      setNotice({ type: 'info', text: 'There are no open demo bets to settle.' });
      return;
    }
    setBets((current) => current.map((bet) => bet.id === firstOpen.id
      ? { ...bet, status: 'settled', result: 'Won · simulated result' }
      : bet));
    setNotice({ type: 'success', text: 'Sample bet settled as won. This is fictional demo data.' });
  }

  function simulateOddsChange() {
    if (!selection) {
      setNotice({ type: 'info', text: 'Choose a price on the board first to simulate an odds change.' });
      return;
    }
    setPendingOdds(Number((selection.odds + 0.08).toFixed(2)));
    setNotice({ type: 'warning', text: 'Odds changed. Review and accept the new price to continue.' });
  }

  function acceptNewOdds() {
    if (!selection || pendingOdds === null) return;
    setSelection({ ...selection, odds: pendingOdds });
    setPendingOdds(null);
    setNotice({ type: 'success', text: `New odds accepted: ${pendingOdds.toFixed(2)}.` });
  }

  const compactLabels: Record<Page, string> = { home: 'Home', live: 'Live', football: 'Football', match: 'Match', activity: 'Bets' };
  const nav = (compact = false) => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          size="md"
          className={`nav-link ${page === item.id ? 'is-active' : ''} ${compact ? 'mobile-nav-link' : ''}`}
          aria-current={page === item.id ? 'page' : undefined}
          aria-label={item.label}
          onClick={() => navigate(item.id)}
        >
          <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
          <span className="nav-label">{compact ? compactLabels[item.id] : item.id === 'activity' ? 'Slip & bets' : item.label}</span>
          {item.count && <span className="nav-count">{item.count}</span>}
          {item.id === 'activity' && !compact && <span className="nav-count nav-count-lime">{openCount}</span>}
        </Button>
      ))}
    </>
  );

  return (
    <div className="app-shell" data-page={page}>
      <StatusBar style="light" />
      <header className="topbar">
        <button className="brand-lockup" onClick={() => navigate('home')} aria-label="Sports home">
          <img className="brand-logo" src="/housebets-logo.svg" alt="Housebets" />
          <span className="brand-divider" />
          <span className="brand-sport">SPORTS</span>
        </button>
        <div className="topbar-actions">
          <Badge variant="success" dot className="demo-badge">Demo board</Badge>
          <span className="topbar-note">Simulated match data</span>
          <button className="account-button" onClick={() => navigate('activity')} aria-label="Open demo activity">
            <span className="account-avatar">H</span><span className="account-label">Guest mode</span><span className="account-chevron">⌄</span>
          </button>
        </div>
      </header>

      <aside className="left-rail" aria-label="Sports navigation">
        <div className="rail-section-label">Your board</div>
        <nav className="primary-nav">{nav()}</nav>
        <div className="rail-note">
          <span className="rail-note-mark">HB</span>
          <strong>Sample-only board.</strong>
          <p>Real club identities. Simulated fixtures, scores and prices.</p>
          <div className="rail-note-foot"><span /> No account. No real bets.</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-topline"><div className="breadcrumbs"><span>HOUSEBETS</span><span className="crumb-slash">/</span><span>{activeMeta.crumb}</span></div><span className="updated-note"><span className="live-dot" /> Sample data only</span></div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{page === 'home' ? 'SPORTS / FIXTURE INDEX' : activeMeta.crumb}</p>
            <h1>{activeMeta.title}</h1>
            <p className="page-subtitle">{activeMeta.subtitle}</p>
          </div>
          <div className="page-head-actions">
            <Badge variant="warning" className="sample-tag">Simulated</Badge>
            <Button variant="outline" size="sm" className="head-action" onClick={() => { setActivityTab('bets'); setRailTab('bets'); navigate('activity'); }}>My activity <Icon name="arrow" size={14} /></Button>
          </div>
        </div>

        <div className="top-search page-search">
          <Icon name="search" size={16} />
          <Input aria-label="Search teams, players, competitions or markets" placeholder="Search teams, players, leagues, markets" value={query} onChange={(event) => setQuery(event.currentTarget.value)} size="sm" className="search-input" />
          <span className="search-key">/</span>
        </div>
        {(page === 'home' || page === 'live' || page === 'football') && <MobileSportsHeader onChooseSport={selectMobileSport} />}
        {notice && (
        <div className={`notice notice-${notice.type}`} role="status">
          <span className="notice-mark">{notice.type === 'success' ? '✓' : notice.type === 'error' ? '!' : notice.type === 'warning' ? '↗' : 'i'}</span>
          <span>{notice.text}</span>
          {undoSelection && notice.type === 'info' && <button className="notice-undo" onClick={undoSelectionReplacement}>Undo</button>}
          <button className="notice-close" onClick={() => setNotice(null)} aria-label="Dismiss message"><Icon name="close" size={14} /></button>
          </div>
        )}
        {page === 'home' && <HomePage fixtures={visibleFixtures} navigate={navigate} makeSelection={makeSelection} selection={selection} onCompetition={openCompetition} />}
        {page === 'live' && <LivePage fixtures={visibleFixtures} navigate={navigate} makeSelection={makeSelection} favourites={favourites} toggleFavourite={toggleFavourite} sportFilter={liveSportFilter} setSportFilter={setLiveSportFilter} competitionFilter={liveCompetitionFilter} setCompetitionFilter={setLiveCompetitionFilter} searchQuery={query} />}
        {page === 'football' && <FootballPage fixtures={visibleFixtures} navigate={navigate} makeSelection={makeSelection} sportFilter={sportFilter} setSportFilter={setSportFilter} footballScope={footballScope} setFootballScope={setFootballScope} favourites={favourites} toggleFavourite={toggleFavourite} />}
        {page === 'match' && (
          <MatchPage
            fixture={fixtures.find((fixture) => fixture.id === matchFixtureId) ?? fixtures[0]}
            fixtures={fixtures}
            marketSuspended={marketSuspended}
            selection={selection}
            makeSelection={makeSelection}
            navigate={navigate}
            marketCategory={marketCategory}
            setMarketCategory={setMarketCategory}
            marketQuery={marketQuery}
            setMarketQuery={setMarketQuery}
            collapsedMarkets={collapsedMarkets}
            toggleMarket={toggleMarket}
            favourites={favourites}
            toggleFavourite={toggleFavourite}
            following={following}
            toggleFollow={toggleFollow}
          />
        )}
        {page === 'activity' && (
          <ActivityPage
            activityTab={activityTab}
            setActivityTab={(tab) => { setActivityTab(tab); setRailTab(tab); }}
            betFilter={betFilter}
            setBetFilter={setBetFilter}
            selection={selection}
            stake={stake}
            setStake={setStake}
            pendingOdds={pendingOdds}
            marketSuspended={marketSuspended}
            estimatedReturn={estimatedReturn}
            bets={bets}
            placeDemoBet={placeDemoBet}
            clearSelection={clearSelection}
            acceptNewOdds={acceptNewOdds}
            cashOutBet={cashOutBet}
            navigate={navigate}
          />
        )}
        <details className="inline-demo-lab">
          <summary><Icon name="grid" size={15} /><span>Demo state controls</span><small>Prototype only</small><b>＋</b></summary>
          <DemoLab
            selection={selection}
            canPlaceDemoBet={Boolean(selection && isValidStake(stake) && pendingOdds === null && !marketSuspended)}
            pendingOdds={pendingOdds}
            marketSuspended={marketSuspended}
            failNext={failNext}
            openCount={openCount}
            simulateOddsChange={simulateOddsChange}
            toggleSuspended={() => setMarketSuspended((value) => !value)}
            setFailNext={() => { setFailNext(true); setNotice({ type: 'warning', text: 'The next demo placement will fail. Tap again to cancel.' }); }}
            placeDemoBet={placeDemoBet}
            settleOpenBet={settleOpenBet}
            cancelFail={() => setFailNext(false)}
          />
        </details>
        <footer className="page-footer"><span className="footer-mark">HB</span><span><strong>Prototype for demonstration.</strong> All fixtures, scores, odds, stakes and returns are simulated. No real bets or money are connected. Club marks belong to their owners; this demo is unaffiliated.</span></footer>
      </main>

      <aside className="right-rail" aria-label="Demo activity panel">
        <div className="right-rail-top">
          <div className="side-tabs" role="tablist" aria-label="Demo activity">
            <button className={`side-tab ${railTab === 'slip' ? 'selected' : ''}`} onClick={() => { setRailTab('slip'); setActivityTab('slip'); }} role="tab" aria-selected={railTab === 'slip'}>Bet slip <span key={selectionMotionKey} className="slip-count-update" data-active={Boolean(selection)}>{selection ? '1' : '0'}</span></button>
            <button className={`side-tab ${railTab === 'bets' ? 'selected' : ''}`} onClick={() => { setRailTab('bets'); setActivityTab('bets'); }} role="tab" aria-selected={railTab === 'bets'}>My bets <span>{openCount}</span></button>
          </div>
          <div key={selectionMotionKey} className="rail-panel-body slip-refresh" data-has-selection={Boolean(selection)}>
            {railTab === 'slip' ? (
              <SlipPanel selection={selection} stake={stake} setStake={setStake} pendingOdds={pendingOdds} marketSuspended={marketSuspended} estimatedReturn={estimatedReturn} placeDemoBet={placeDemoBet} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} navigate={navigate} />
            ) : (
              <CompactBets bets={bets} cashOutBet={cashOutBet} navigate={navigate} />
            )}
          </div>
        </div>
        <details className="rail-demo-disclosure">
          <summary><span>Prototype controls</span><small>Session only</small><b>＋</b></summary>
          <DemoLab
            selection={selection}
            canPlaceDemoBet={Boolean(selection && isValidStake(stake) && pendingOdds === null && !marketSuspended)}
            pendingOdds={pendingOdds}
            marketSuspended={marketSuspended}
            failNext={failNext}
            openCount={openCount}
            simulateOddsChange={simulateOddsChange}
            toggleSuspended={() => setMarketSuspended((value) => !value)}
            setFailNext={() => { setFailNext(true); setNotice({ type: 'warning', text: 'The next demo placement will fail. Tap again to cancel.' }); }}
            placeDemoBet={placeDemoBet}
            settleOpenBet={settleOpenBet}
            cancelFail={() => setFailNext(false)}
          />
        </details>
      </aside>

      <button key={selectionMotionKey} className="mobile-slip-bar" data-has-selection={Boolean(selection)} onClick={() => setMobileSheetOpen(true)} aria-label="Open bet slip">
        <span key={selectionMotionKey} className="mobile-slip-count slip-count-update" data-active={Boolean(selection)}>{selection ? '1' : '0'}</span>
        <span className="mobile-slip-summary">
          <strong>{selection ? <>{selection.label} <small>@</small> {selection.odds.toFixed(2)}</> : 'Bet slip · empty'}</strong>
          <small>{selection ? selection.fixture : 'Tap to review your single demo slip'}</small>
        </span>
        <span className="mobile-slip-open">{selection ? 'View slip' : 'Open slip'} <Icon name="arrow" size={15} /></span>
      </button>
      {mobileSheetOpen && (
        <MobileSheet onClose={() => setMobileSheetOpen(false)}>
            <div className="mobile-sheet-grip" />
            <div className="mobile-sheet-head">
              <div className="mobile-sheet-tabs" role="tablist" aria-label="Slip or My bets">
                <button className={railTab === 'slip' ? 'active' : ''} onClick={() => { setRailTab('slip'); setActivityTab('slip'); }}>Bet slip <span>{selection ? 1 : 0}</span></button>
                <button className={railTab === 'bets' ? 'active' : ''} onClick={() => { setRailTab('bets'); setActivityTab('bets'); }}>My bets <span>{openCount}</span></button>
              </div>
              <button className="mobile-sheet-close" onClick={() => setMobileSheetOpen(false)} aria-label="Close bet slip"><Icon name="close" size={18} /></button>
            </div>
            <div key={selectionMotionKey} className="mobile-sheet-body slip-refresh" data-has-selection={Boolean(selection)}>
              {railTab === 'slip'
                ? <SlipPanel selection={selection} stake={stake} setStake={setStake} pendingOdds={pendingOdds} marketSuspended={marketSuspended} estimatedReturn={estimatedReturn} placeDemoBet={placeDemoBet} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} navigate={navigate} />
                : <CompactBets bets={bets} cashOutBet={cashOutBet} navigate={navigate} />}
            </div>
        </MobileSheet>
      )}
      <nav className="mobile-nav" aria-label="Mobile navigation">{nav(true)}</nav>
    </div>
  );
}


function MobileSportsHeader({ onChooseSport }: { onChooseSport: (sport: string) => void }) {
  return (
    <nav className="sports-index" aria-label="Sports categories">
      <span className="sports-index-label">Sports</span>
      <div className="sports-index-items">
        {mobileSports.map((sport) => <button key={sport.name} className={`sports-index-item ${sport.name === 'Football' ? 'active' : ''}`} aria-pressed={sport.name === 'Football'} onClick={() => onChooseSport(sport.name)}>{sport.name}</button>)}
      </div>
      <span className="sports-index-note">Simulated football fixtures</span>
    </nav>
  );
}


function HomePage({ fixtures, navigate, makeSelection, selection, onCompetition }: {
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  selection: Selection | null;
  onCompetition: (competition: string) => void;
}) {
  const featured = fixtures.find((fixture) => fixture.status === 'LIVE') ?? fixtures[0];
  const schedule = featured ? fixtures.filter((fixture) => fixture.id !== featured.id) : [];
  const topCompetitions = [
    { name: 'Premier League', code: 'PL' },
    { name: 'UEFA Champions League', code: 'UCL' },
    { name: 'LaLiga', code: 'LL' },
    { name: 'Serie A', code: 'SA' },
    { name: 'Bundesliga', code: 'BL' },
  ];
  const lanes = [
    { label: 'Other matches in play', rows: schedule.filter((fixture) => fixture.status === 'LIVE') },
    { label: 'Starting soon', rows: schedule.filter((fixture) => fixture.status === 'UPCOMING') },
    { label: 'Final samples', rows: schedule.filter((fixture) => fixture.status === 'FINISHED') },
  ];
  return (
    <div className="page-stack home-dashboard fixture-ledger">
      {featured && <FieldsideStage fixture={featured} selection={selection} onOpen={() => navigate('match', featured.id)} onSelect={(index) => makeSelection(featured, index)} />}
      {fixtures.length === 0 && <EmptyState title="No fixtures match that search" copy="Try another club or competition, or clear the search." />}
      <section className="top-competitions" aria-label="Top competitions">
        <div className="top-competition-heading"><div><h2>Top competitions</h2><p>Jump to a league board</p></div><span>Simulated fixtures</span></div>
        <div className="top-competition-list">{topCompetitions.map((competition) => <button key={competition.name} onClick={() => onCompetition(competition.name)}><span className="top-competition-code">{competition.code}</span><span>{competition.name === 'UEFA Champions League' ? 'Champions League' : competition.name}</span><Icon name="arrow" size={14} /></button>)}</div>
      </section>
      <div className="fieldside-schedule-heading"><div><h2>Fixtures</h2><p>Choose one sample price</p></div><button onClick={() => navigate('live')}>View live <Icon name="arrow" size={14} /></button></div>
      {lanes.map((lane) => lane.rows.length > 0 && <section className="ledger-lane fieldside-lane" key={lane.label}>
        <header className="ledger-lane-heading"><span className="lane-status-mark" aria-hidden="true" /><div><h3>{lane.label}</h3></div><span className="ledger-lane-count">{lane.rows.length} {lane.rows.length === 1 ? 'match' : 'matches'}</span></header>
        <Frame className="fixture-frame ledger-sheet" variant="default"><Frame.Panel>{lane.rows.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} />)}</Frame.Panel></Frame>
      </section>)}
      <div className="info-band"><span className="info-mark">i</span><span>Real club names and crests. Matchups, schedules, scores, odds, player labels and demo USDT are simulated.</span><Badge variant="warning">Demo only</Badge></div>
    </div>
  );
}

function LivePage({ fixtures: rows, navigate, makeSelection, favourites, toggleFavourite, sportFilter, setSportFilter, competitionFilter, setCompetitionFilter, searchQuery }: {
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  sportFilter: string;
  setSportFilter: (value: string) => void;
  competitionFilter: string;
  setCompetitionFilter: (value: string) => void;
  searchQuery: string;
}) {
  const sports = ['All sports', 'Football', 'Tennis', 'Basketball', 'Cricket'];
  const competitions = [...new Set(rows.map((fixture) => fixture.competition))];
  const bySport = sportFilter === 'All sports' || sportFilter === 'Football' ? rows : [];
  const scoped = competitionFilter === 'All competitions' ? bySport : bySport.filter((fixture) => fixture.competition === competitionFilter);
  const liveRows = scoped.filter((fixture) => fixture.status === 'LIVE');
  const upcomingRows = scoped.filter((fixture) => fixture.status === 'UPCOMING');
  const liveGroups = groupByCompetition(liveRows);
  const upcomingGroups = groupByCompetition(upcomingRows);
  return (
    <div className="page-stack">
      <section className="live-filter-panel" aria-label="Live board filters">
        <div className="live-filter-heading"><span className="eyebrow">Board filters</span><strong>Choose a sport and competition</strong></div>
        <label className="live-filter-select"><span>Sport</span><select aria-label="Filter live board by sport" value={sportFilter} onChange={(event) => setSportFilter(event.currentTarget.value)}>{sports.map((sport) => <option key={sport}>{sport}</option>)}</select></label>
        <label className="live-filter-select"><span>Competition</span><select aria-label="Filter live board by competition" value={competitionFilter} onChange={(event) => setCompetitionFilter(event.currentTarget.value)}><option>All competitions</option>{competitions.map((competition) => <option key={competition}>{competition}</option>)}</select></label>
      </section>
      <div className="listing-toolbar live-summary-toolbar"><div className="listing-filter-tabs"><button className={liveRows.length ? 'active' : ''}><span className="pulse-dot" /> Live now <b>{String(liveRows.length).padStart(2, '0')}</b></button>{!liveRows.length && upcomingRows.length > 0 && <span className="starting-soon-indicator">Starting soon <b>{String(upcomingRows.length).padStart(2, '0')}</b></span>}</div><div className="filter-note"><span className="live-dot" /> Sample scores · not a real-time feed</div></div>
      {liveGroups.length > 0 ? <div key={`${sportFilter}-${competitionFilter}`} className="live-result-surface"><div className="desktop-competition-list">{liveGroups.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} favourites={favourites} toggleFavourite={toggleFavourite} />)}</div></div> : upcomingGroups.length > 0 ? <section key={`${sportFilter}-${competitionFilter}`} className="starting-soon-block live-result-surface"><header><span className="eyebrow">No sample match currently in play</span><h2>Starting soon</h2><p>Upcoming fictional fixtures matching these filters.</p></header><div className="desktop-competition-list">{upcomingGroups.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} favourites={favourites} toggleFavourite={toggleFavourite} />)}</div></section> : <EmptyState title={searchQuery.trim() ? 'No sample fixtures match that search' : `No live or upcoming ${sportFilter === 'All sports' ? 'sample' : sportFilter.toLowerCase()} fixtures`} copy={searchQuery.trim() ? 'Try another team, competition, player label or market.' : 'Try another sport or competition. This board contains football samples only.'} />}
      <div className="info-band"><span className="info-mark">i</span><span>Live labels, scores, clocks and odds are simulated examples. Filter results never connect to a live feed.</span><Badge variant="warning">Sample data</Badge></div>
    </div>
  );
}

function FootballPage({ fixtures: rows, navigate, makeSelection, sportFilter, setSportFilter, footballScope, setFootballScope, favourites, toggleFavourite }: {
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  sportFilter: string;
  setSportFilter: (value: string) => void;
  footballScope: 'live-upcoming' | 'all';
  setFootballScope: (value: 'live-upcoming' | 'all') => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
}) {
  const leagues = [
    { label: 'All football', value: 'All football' },
    { label: 'Premier League', value: 'Premier League' },
    { label: 'Champions League', value: 'UEFA Champions League' },
    { label: 'LaLiga', value: 'LaLiga' },
    { label: 'Serie A', value: 'Serie A' },
    { label: 'Bundesliga', value: 'Bundesliga' },
  ];
  const filtered = rows.filter((fixture) => sportFilter === 'All football' || sportFilter === 'All sports' || sportFilter === 'Football' || fixture.competition === sportFilter);
  const liveUpcoming = filtered.filter((fixture) => fixture.status === 'LIVE' || fixture.status === 'UPCOMING');
  const visibleFixtures = footballScope === 'live-upcoming' ? liveUpcoming : filtered;
  const grouped = groupByCompetition(visibleFixtures);
  return (
    <div className="page-stack">
      <div className="football-toolbar">
        <div className="league-select-label">Competition</div>
        <div className="league-chips">{leagues.map((league) => <button key={league.value} aria-pressed={sportFilter === league.value || (sportFilter === 'All sports' && league.value === 'All football')} className={`league-chip ${sportFilter === league.value || (sportFilter === 'All sports' && league.value === 'All football') ? 'active' : ''}`} onClick={() => setSportFilter(league.value)}>{league.label}</button>)}</div>
        <span className="fixtures-total">{visibleFixtures.length} fixtures</span>
      </div>
      <div className="listing-toolbar football-scope-toolbar"><div className="listing-filter-tabs"><button className={footballScope === 'live-upcoming' ? 'active' : ''} onClick={() => setFootballScope('live-upcoming')}>Live &amp; upcoming <b>{liveUpcoming.length}</b></button><button className={footballScope === 'all' ? 'active' : ''} onClick={() => setFootballScope('all')}>All football <b>{filtered.length}</b></button></div><div className="filter-note">Match result <span>·</span> singles</div></div>
      {sportFilter === 'Basketball' || sportFilter === 'Tennis' ? (
        <div className="desktop-competition-list"><EmptyState title={`No ${sportFilter.toLowerCase()} samples in this build`} copy="This contest prototype focuses on fictional football fixtures." /></div>
      ) : grouped.length ? (
        <><div className="desktop-competition-list">{grouped.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} favourites={favourites} toggleFavourite={toggleFavourite} />)}</div><div className="info-band"><span className="info-mark">i</span><span>Club names and crests are real. Events, scores, dates and odds are fixed samples.</span><Badge variant="warning">Sample data</Badge></div></>
      ) : <div className="desktop-competition-list"><EmptyState title="No matches here yet" copy="Try another competition or clear your search." /></div>}
      <button className="text-link back-home" onClick={() => navigate('home')}>Back to sports home <Icon name="arrow" size={15} /></button>
    </div>
  );
}

function groupByCompetition(rows: Fixture[]): [string, Fixture[]][] {
  const names = [...new Set(rows.map((fixture) => fixture.competition))];
  return names.map((name) => [name, rows.filter((fixture) => fixture.competition === name)]);
}

function CompetitionBlock({ competition, fixtures: rows, navigate, makeSelection, favourites, toggleFavourite }: {
  competition: string;
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
}) {
  const isFavourite = favourites.includes(competition);
  return (
    <Frame className="league-frame competition-block">
      <Frame.Header>
        <Frame.Title as="h2"><span className="competition-mark">{competition.slice(0, 1)}</span><span>{competition}</span><small>{rows.length} {rows.length === 1 ? 'match' : 'matches'}</small></Frame.Title>
        <Frame.Action><span className="frame-action-count">Match result</span><button className={`competition-star ${isFavourite ? 'selected' : ''}`} onClick={() => toggleFavourite(competition)} aria-label={isFavourite ? `Unfavourite ${competition}` : `Favourite ${competition}`}><Icon name="star" size={14} /></button><button className="competition-view-all" aria-label="View first match" onClick={() => rows[0] && navigate('match', rows[0].id)}><span className="competition-view-label">View first match</span> <Icon name="arrow" size={12} /></button></Frame.Action>
      </Frame.Header>
      <Frame.Panel>{rows.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} />)}</Frame.Panel>
    </Frame>
  );
}

function FixtureRow({ fixture, navigate, makeSelection }: { fixture: Fixture; navigate: Navigate; makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void }) {
  const timeLabel = fixture.status === 'LIVE' ? fixture.time : fixture.status === 'FINISHED' ? 'FT' : fixture.time;
  const phaseLabel = fixture.status === 'LIVE' ? 'Live' : fixture.status === 'FINISHED' ? 'Final' : fixture.date === 'TOMORROW' ? 'Tmr' : 'Today';
  return (
    <Frame.Row data-fixture-id={fixture.id} className={`fixture-row docket-row ${fixture.status === 'LIVE' ? 'is-live' : ''} ${fixture.status === 'FINISHED' ? 'is-final' : ''}`} onClick={() => navigate('match', fixture.id)} chevron>
      <Frame.Media><div className="fixture-time-cell"><span className="fixture-time-rail" aria-hidden="true" /><span className="fixture-time-copy"><span>{phaseLabel}</span><strong>{timeLabel}</strong></span></div></Frame.Media>
      <Frame.Content>
        <Frame.Description><span>{fixture.competition}</span><span className="mini-divider">/</span><span>{fixture.round}</span></Frame.Description>
        <div className="fixture-team-stack"><span><ClubCrest club={fixture.home} /><strong>{fixture.home}</strong>{fixture.homeScore !== undefined && <b>{fixture.homeScore}</b>}</span><span><ClubCrest club={fixture.away} /><strong>{fixture.away}</strong>{fixture.awayScore !== undefined && <b>{fixture.awayScore}</b>}</span></div>
      </Frame.Content>
      <Frame.Actions>
        <div className="fixture-market-head"><span>Match result</span><small>1 / X / 2</small></div>
        <div className="row-market-actions">
          {fixture.status === 'FINISHED' && <div className="row-suspended market-closed"><Icon name="lock" size={13} /> Sample market closed</div>}
          {fixture.status !== 'FINISHED' && fixture.suspended && <div className="row-suspended"><Icon name="lock" size={13} /> Sample market suspended</div>}
          {fixture.status !== 'FINISHED' && !fixture.suspended && <div className="row-odds">{fixture.odds.map((odd, index) => <button key={index} className="row-odd" onClick={(event) => { event.stopPropagation(); makeSelection(fixture, index); }} aria-label={`Select ${index === 0 ? fixture.home : index === 1 ? 'Draw' : fixture.away} at ${odd.toFixed(2)}`}><small>{['1', 'X', '2'][index]}</small><strong>{odd.toFixed(2)}</strong></button>)}</div>}
          {fixture.status !== 'FINISHED' && <button className="extra-market-count" onClick={(event) => { event.stopPropagation(); navigate('match', fixture.id); }}>+{fixture.extraMarkets} markets <span>↗</span></button>}
        </div>
      </Frame.Actions>
    </Frame.Row>
  );
}

function MatchPage({ fixture, fixtures: fixtureOptions, marketSuspended, selection, makeSelection, navigate, marketCategory, setMarketCategory, marketQuery, setMarketQuery, collapsedMarkets, toggleMarket, favourites, toggleFavourite, following, toggleFollow }: {
  fixture: Fixture;
  fixtures: Fixture[];
  marketSuspended: boolean;
  selection: Selection | null;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  navigate: Navigate;
  marketCategory: string;
  setMarketCategory: (value: string) => void;
  marketQuery: string;
  setMarketQuery: (value: string) => void;
  collapsedMarkets: string[];
  toggleMarket: (title: string) => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  following: string[];
  toggleFollow: (team: string) => void;
}) {
  const markets = getSampleMarkets(fixture);
  const categories = [
    ...marketGroups.map((name) => ({ name, count: markets.filter((market) => market.category === name).length })),
    { name: 'All markets', count: markets.length },
  ];
  const search = marketQuery.trim().toLowerCase();
  const shown = markets.filter((market) => (marketCategory === 'All markets' || market.category === marketCategory) && (!search || `${market.title} ${market.sub} ${market.options.join(' ')}`.toLowerCase().includes(search)));
  const marketUnavailable = fixture.status === 'FINISHED' || fixture.suspended === true || marketSuspended;
  const unavailableLabel = fixture.status === 'FINISHED' ? 'Market closed' : 'Market suspended';
  const favourite = favourites.includes(fixture.home);
  const [fixtureDetailsOpen, setFixtureDetailsOpen] = useState(false);
  return (
    <div className="page-stack match-page-stack">
      <div className="match-toolbar"><button className="match-back" onClick={() => navigate('football')}>‹ <span>Football</span></button><span className="match-toolbar-divider">/</span><span>{fixture.competition}</span><span className="match-toolbar-divider">/</span><select className="fixture-picker" aria-label="Select sample fixture" value={fixture.id} onChange={(event) => navigate('match', event.currentTarget.value)}>{fixtureOptions.map((option) => <option key={option.id} value={option.id}>{option.home} v {option.away}</option>)}</select><span className="match-toolbar-spacer" /><Badge variant="warning">Singles only</Badge></div>
      <Card className="match-hero" size="default">
        <div className="match-hero-top"><span className="competition-label"><span className="competition-mark">{fixture.competition.slice(0, 1)}</span><span className="match-competition-name">{fixture.competition}</span><span className="match-round-name"><span className="mini-divider">/</span>{fixture.round}</span></span><div className="match-hero-actions">{fixture.status === 'LIVE' ? <Badge variant="destructive" dot="pulse" className="live-tag">Sample live · {fixture.time}</Badge> : <Badge variant="secondary" className="upcoming-tag">{fixture.status === 'FINISHED' ? 'Final sample' : `${fixture.date === 'TODAY' ? 'Today' : fixture.date === 'TOMORROW' ? 'Tomorrow' : fixture.date ?? 'Upcoming'} · ${fixture.time}`}</Badge>}<button className={`icon-favourite match-fav ${favourite ? 'selected' : ''}`} onClick={() => toggleFavourite(fixture.home)} aria-label={favourite ? 'Remove team favourite' : 'Add team favourite'}><Icon name="star" size={16} /></button></div></div>
        <div className="match-hero-teams">
          <div className="match-team"><ClubCrest club={fixture.home} className="match-club-crest" /><strong>{fixture.home}</strong><small>Home side</small><button className={`follow-chip ${following.includes(fixture.home) ? 'following' : ''}`} onClick={() => toggleFollow(fixture.home)}>{following.includes(fixture.home) ? <><Icon name="star" size={14} /> Following</> : <><Icon name="plus" size={14} /> Follow</>}</button></div>
          <div className="match-score"><span>{fixture.homeScore !== undefined ? <>{fixture.homeScore}<i>:</i>{fixture.awayScore}</> : 'VS'}</span>{fixture.status === 'LIVE' ? <Badge variant="destructive" dot className="live-tag">{fixture.time}</Badge> : <Badge variant="secondary" className="upcoming-tag">{fixture.status === 'FINISHED' ? 'FINAL' : `${fixture.date ?? 'UPCOMING'} · ${fixture.time}`}</Badge>}<small>{fixture.status === 'LIVE' ? 'Simulated score · 90 min' : fixture.status === 'FINISHED' ? 'Final sample result' : 'Simulated kick-off'}</small></div>
          <div className="match-team align-right"><ClubCrest club={fixture.away} className="match-club-crest" /><strong>{fixture.away}</strong><small>Away side</small><button className={`follow-chip ${following.includes(fixture.away) ? 'following' : ''}`} onClick={() => toggleFollow(fixture.away)}>{following.includes(fixture.away) ? <><Icon name="star" size={14} /> Following</> : <><Icon name="plus" size={14} /> Follow</>}</button></div>
        </div>
        <div className="match-hero-bottom"><span>Simulated fixture · no live feed</span><span>{fixture.competition} · {fixture.round}</span></div>
      </Card>
      <section className="match-fixture-details" aria-label="Fixture details">
        <div className="match-details-heading"><div><span>Event details</span><strong>{fixture.competition} · {fixture.round}</strong></div><button aria-expanded={fixtureDetailsOpen} onClick={() => setFixtureDetailsOpen((open) => !open)}>{fixtureDetailsOpen ? 'Hide details' : 'Show details'} <Icon name="chevron" size={14} /></button></div>
        {fixtureDetailsOpen && <div className="match-details-grid"><div><small>Event</small><strong>{fixture.home} v {fixture.away}</strong></div><div><small>Format</small><strong>Football · Match result (1X2)</strong></div><div><small>Data notice</small><strong>Fictional event · fixed sample values</strong></div><div className="match-kickoff-field"><small>Kick-off</small><KickoffTimeline fixture={fixture} /></div></div>}
      </section>
      {marketUnavailable && <div className={`match-market-alert ${fixture.status === 'FINISHED' ? 'closed' : ''}`} role="status"><Icon name="lock" size={16} /><div><strong>{unavailableLabel}</strong><span>{fixture.status === 'FINISHED' ? 'This sample event has ended; its prices cannot be selected.' : 'Prices for this sample event are temporarily unavailable.'}</span></div></div>}
      <div className="market-search-row"><div className="market-search"><Icon name="search" size={15} /><Input aria-label="Search sample markets" placeholder="Search sample markets" value={marketQuery} onChange={(event) => setMarketQuery(event.currentTarget.value)} size="sm" /></div><span className="market-search-note"><Icon name="ticket" size={13} /> One selection at a time</span></div>
      <div className="market-toolbar"><div><p className="eyebrow">Market directory</p><span className="market-count-line">{shown.length} of {markets.length} sample markets · 6 groups</span></div><div className="market-tabs" role="tablist" aria-label="Market categories">{categories.map((category) => <button key={category.name} className={`market-tab ${marketCategory === category.name ? 'selected' : ''}`} onClick={() => { setMarketCategory(category.name); setMarketQuery(''); }} role="tab" aria-selected={marketCategory === category.name}>{category.name} <span>{String(category.count).padStart(2, '0')}</span></button>)}</div></div>
      <div className="market-directory">{shown.map((market) => <MarketSection key={market.title} title={market.title} sub={market.sub} count={market.options.length} options={market.options} odds={market.odds} fixture={fixture} market={market.title} makeSelection={makeSelection} selected={selection} collapsed={collapsedMarkets.includes(market.title)} toggle={() => toggleMarket(market.title)} disabled={marketUnavailable} />)}</div>
      {!shown.length && <EmptyState title="No markets match that search" copy="Try a shorter term or clear the sample-market search." />}
      <div className="info-band"><span className="info-mark">i</span><span>Real club identities; simulated event details, prices and player labels. No real player data, live feeds or money.</span><Badge variant="warning">Simulation</Badge></div>
    </div>
  );
}

function MarketSection({ title, sub, count, options, odds, fixture, market = 'Match result', makeSelection, selected, collapsed, toggle, disabled }: {
  title: string;
  sub: string;
  count: number;
  options: string[];
  odds: number[];
  fixture: Fixture;
  market?: string;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  selected: Selection | null;
  collapsed: boolean;
  toggle: () => void;
  disabled: boolean;
}) {
  return (
    <Card className={`market-card ${collapsed ? 'is-collapsed' : ''}`} size="sm">
      <button className="market-card-heading" onClick={toggle} aria-expanded={!collapsed}>
        <span><strong>{title}</strong><small>{sub}</small></span><span className="market-card-heading-right"><span className="market-count">{String(count).padStart(2, '0')} outcomes</span><span className="market-collapse-icon">{collapsed ? '+' : '−'}</span></span>
      </button>
      {!collapsed && <div className={`market-outcomes ${options.length === 2 ? 'two-outcomes' : ''} ${options.length === 3 ? 'three-outcomes' : ''}`}>
        {options.map((label, i) => <OddsButton key={label} label={label} odds={odds[i]} selected={selected?.fixtureId === fixture.id && selected.market === market && selected.label === label} disabled={disabled} onClick={() => makeSelection(fixture, i, market)} />)}
      </div>}
    </Card>
  );
}

function ActivityPage({ activityTab, setActivityTab, betFilter, setBetFilter, selection, stake, setStake, pendingOdds, marketSuspended, estimatedReturn, bets, placeDemoBet, clearSelection, acceptNewOdds, cashOutBet, navigate }: {
  activityTab: ActivityTab;
  setActivityTab: (tab: ActivityTab) => void;
  betFilter: BetStatus;
  setBetFilter: (status: BetStatus) => void;
  selection: Selection | null;
  stake: string;
  setStake: (value: string) => void;
  pendingOdds: number | null;
  marketSuspended: boolean;
  estimatedReturn: number;
  bets: DemoBet[];
  placeDemoBet: () => void;
  clearSelection: () => void;
  acceptNewOdds: () => void;
  cashOutBet: (id: string) => void;
  navigate: (page: Page) => void;
}) {
  return (
    <div className="page-stack activity-stack">
      <div className="activity-tabs" role="tablist" aria-label="Slip and bet history">
        <button className={`activity-tab ${activityTab === 'slip' ? 'active' : ''}`} onClick={() => setActivityTab('slip')} role="tab" aria-selected={activityTab === 'slip'}><Icon name="ticket" size={17} /> Bet slip <span>{selection ? '01' : '00'}</span></button>
        <button className={`activity-tab ${activityTab === 'bets' ? 'active' : ''}`} onClick={() => setActivityTab('bets')} role="tab" aria-selected={activityTab === 'bets'}><Icon name="clock" size={16} /> My bets <span>{bets.length.toString().padStart(2, '0')}</span></button>
        <span className="single-badge">Singles only</span>
      </div>
      {activityTab === 'slip' ? (
        <div className="activity-content-grid">
          <div className="activity-main-col">
            <h2 className="activity-section-title">Your selection</h2>
            {selection ? <SelectionCard selection={selection} stake={stake} setStake={setStake} pendingOdds={pendingOdds} marketSuspended={marketSuspended} estimatedReturn={estimatedReturn} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} placeDemoBet={placeDemoBet} /> : (
              <Card className="empty-slip-card" size="default"><div className="empty-illustration"><Icon name="ticket" size={26} /></div><h3>The slip is waiting.</h3><p>Pick one fictional price on any board. Singles only, and nothing is placed without your tap.</p><Button className="button-lime" onClick={() => navigate('home')}>Explore fixtures <Icon name="arrow" size={15} /></Button></Card>
            )}
            <div className="settlement-note"><span className="info-mark">i</span><span>Demo USDT labels are simulated units only; no token, wallet, balance or transfer is connected.</span></div>
          </div>
          <div className="activity-side-col"><div className="desk-card dark-mini-card"><span className="eyebrow">How this works</span><h3>One pick.<br />One simple flow.</h3><ol><li><span>01</span> Choose a price</li><li><span>02</span> Enter demo USDT</li><li><span>03</span> Place the sample bet</li></ol><div className="no-multi">Singles only <span>×</span> No combos</div></div></div>
        </div>
      ) : <MyBetsView bets={bets} filter={betFilter} setFilter={setBetFilter} cashOutBet={cashOutBet} />}
    </div>
  );
}

function SelectionCard({ selection, stake, setStake, pendingOdds, marketSuspended, estimatedReturn, clearSelection, acceptNewOdds, placeDemoBet }: {
  selection: Selection;
  stake: string;
  setStake: (value: string) => void;
  pendingOdds: number | null;
  marketSuspended: boolean;
  estimatedReturn: number;
  clearSelection: () => void;
  acceptNewOdds: () => void;
  placeDemoBet: () => void;
}) {
  const disabled = pendingOdds !== null || marketSuspended || !isValidStake(stake);
  return (
    <Card className="selection-card" size="default">
      <div className="selection-card-top"><div><Badge variant="info" className="slip-market-badge">Single · demo</Badge><p className="selection-competition">{selection.competition} <span>·</span> {selection.market}</p></div><Button variant="ghost" size="icon-sm" className="remove-selection" onClick={clearSelection} aria-label="Remove selection"><Icon name="close" size={16} /></Button></div>
      <div className="selection-pick"><div><strong>{selection.label}</strong><small><ClubPair fixtureId={selection.fixtureId} />{selection.fixture}</small></div><div className="pick-odds"><span>Odds</span><RollingNumber duration={320} value={selection.odds} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="rolling-odds" /></div></div>
      <div className="selection-safety-row"><span><Icon name="ticket" size={13} /> One single selection</span><span>No combos · demo USDT only</span></div>
      {pendingOdds !== null && <div className="state-banner state-warning"><span>↗</span><div><strong>Odds have changed</strong><small>{selection.odds.toFixed(2)} → {pendingOdds.toFixed(2)} · accept to keep going</small></div><Button size="sm" className="accept-odds-button" onClick={acceptNewOdds}>Accept {pendingOdds.toFixed(2)}</Button></div>}
      {marketSuspended && <div className="state-banner state-warning"><Icon name="lock" size={17} /><div><strong>Market suspended</strong><small>This sample selection is temporarily unavailable.</small></div></div>}
      <label className="stake-label" htmlFor="main-stake">Demo stake <span>Simulated USDT</span></label>
      <div className="stake-input-row"><span className="stake-currency">USDT</span><Input id="main-stake" type="number" min="1" step="0.01" value={stake} onChange={(event) => setStake(event.currentTarget.value)} className="stake-input" aria-label="Demo USDT stake" aria-invalid={!isValidStake(stake)} aria-describedby="main-stake-hint" /><span className="stake-unit">demo</span></div>
      <p id="main-stake-hint" className={`stake-hint ${!isValidStake(stake) ? 'stake-error' : ''}`}>Minimum 1.00 · up to 2 decimals · demo only</p>
      <div className="quick-stakes">{['5', '10', '20', '50'].map((value) => <Button key={value} variant="outline" size="sm" className={`quick-stake ${stake === value ? 'chosen' : ''}`} onClick={() => setStake(value)}>{value} <small>USDT</small></Button>)}</div>
      <div className="return-line"><span>Est. return</span><strong><RollingNumber duration={320} value={estimatedReturn} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> <small>Demo USDT</small></strong></div>
      <Button className="place-button" disabled={disabled} onClick={placeDemoBet}>Place demo bet <Icon name="arrow" size={16} /></Button>
      <p className="slip-disclaimer">No real account · No real money · Singles only</p>
    </Card>
  );
}

function MyBetsView({ bets, filter, setFilter, cashOutBet }: { bets: DemoBet[]; filter: BetStatus; setFilter: (status: BetStatus) => void; cashOutBet: (id: string) => void }) {
  const [dateRange, setDateRange] = useState('All time');
  const [sport, setSport] = useState('All sports');
  const [search, setSearch] = useState('');
  const filteredBets = bets.filter((bet) => {
    if (bet.status !== filter) return false;
    if (sport !== 'All sports' && bet.sport !== sport) return false;
    if (dateRange === 'Today' && !bet.placedAt.toLowerCase().includes('today') && !bet.placedAt.toLowerCase().includes('just now')) return false;
    if (dateRange === 'Last 7 days' && bet.placedAt.toLowerCase().includes('older')) return false;
    const normalized = search.trim().toLowerCase();
    return !normalized || `${bet.fixture} ${bet.competition} ${bet.selection} ${bet.market}`.toLowerCase().includes(normalized);
  });
  const openCount = bets.filter((bet) => bet.status === 'open').length;
  const settledCount = bets.filter((bet) => bet.status === 'settled').length;
  return (
    <div className="mybets-page">
      <div className="mybets-summary-row"><div><span className="eyebrow">Bet history</span><h2 className="activity-section-title">A clear record of every demo pick</h2></div><div className="mybets-summary-cards"><span><b>{String(openCount).padStart(2, '0')}</b> Open</span><span><b>{String(settledCount).padStart(2, '0')}</b> Settled</span></div></div>
      <div className="mybets-controls"><div className="bet-filter-tabs"><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>Open <span>{openCount}</span></button><button className={filter === 'settled' ? 'active' : ''} onClick={() => setFilter('settled')}>Settled <span>{settledCount}</span></button></div><div className="mybets-filter-controls"><label className="date-filter"><Icon name="clock" size={14} /><select aria-label="Filter by date" value={dateRange} onChange={(event) => setDateRange(event.currentTarget.value)}><option>All time</option><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select></label><label className="date-filter sport-filter"><select aria-label="Filter by sport" value={sport} onChange={(event) => setSport(event.currentTarget.value)}><option>All sports</option><option>Football</option></select><span>⌄</span></label><div className="mybets-search"><Icon name="search" size={14} /><Input aria-label="Search demo bets" placeholder="Search bets" value={search} onChange={(event) => setSearch(event.currentTarget.value)} size="sm" /></div></div></div>
      {filteredBets.length ? (
        <div className="mybets-list">
          <div className="bet-table-header"><span>Placed</span><span>Bet / event</span><span>Odds</span><span>Stake</span><span>Returns</span><span>Result</span></div>
          {filteredBets.map((bet) => <BetRecord key={bet.id} bet={bet} cashOutBet={cashOutBet} />)}
        </div>
      ) : <EmptyState title={`No ${filter} bets match these filters`} copy="Change the time range or search, or place a fictional single from the slip." />}
      <div className="history-foot"><span className="info-mark">i</span><span>History is local to this prototype and is not linked to an account or stored as a real bet.</span></div>
    </div>
  );
}

function BetRecord({ bet, cashOutBet }: { bet: DemoBet; cashOutBet: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className={`bet-record ${expanded ? 'expanded' : ''}`} size="sm">
      <button className="bet-table-row" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="bet-placed">{bet.placedAt}<small>Demo ref · {bet.id.slice(-5).toUpperCase()}</small></span>
        <span className="bet-row-event"><strong>{bet.selection}</strong><small><ClubPair fixtureId={bet.fixtureId} />{bet.fixture}</small><em>{bet.competition} · {bet.market}</em></span>
        <strong className="bet-row-number" data-label="Odds">{bet.odds.toFixed(2)}</strong>
        <strong className="bet-row-number" data-label="Stake">{bet.stake.toFixed(2)} <i>USDT</i></strong>
        <strong className="bet-row-number return-number" data-label="Return">{bet.returns.toFixed(2)} <i>USDT</i></strong>
        <span className="bet-result-cell">{bet.status === 'open' ? <Badge variant="info" dot>Open</Badge> : <Badge variant="success">Settled</Badge>}<Icon name="chevron" size={14} /></span>
      </button>
      {expanded && <div className="bet-detail-panel">
        <div><small>Fixture</small><strong>{bet.fixture}</strong></div><div><small>Competition</small><strong>{bet.competition}</strong></div><div><small>Selection</small><strong>{bet.selection} · {bet.market}</strong></div>
        <div><small>Accepted odds</small><strong>{bet.odds.toFixed(2)}</strong></div><div><small>Demo stake</small><strong>{formatDemoUSDT(bet.stake)}</strong></div><div><small>Est. return</small><strong>{formatDemoUSDT(bet.returns)}</strong></div>
        <div className="bet-lifecycle"><div className="bet-step complete"><span>01</span><strong>Demo bet placed</strong><small>{bet.placedAt}</small></div><div className={`bet-step ${bet.status === 'settled' ? 'complete' : 'pending'}`}><span>{bet.status === 'settled' ? '02' : '…'}</span><strong>{bet.status === 'settled' ? 'Sample settled' : 'Awaiting sample settlement'}</strong><small>{bet.status === 'settled' ? (bet.result ?? 'Final sample result') : 'No live event feed'}</small></div></div>
        {bet.result && <span className={`result-note ${bet.result.includes('Won') || bet.result.includes('Cashed') ? 'result-won' : ''}`}>{bet.result}</span>}
        {bet.status === 'open' && <span className="cashout-summary">Sample cash out value <b>{formatDemoUSDT(bet.cashout ?? bet.returns)}</b><Button variant="outline" size="sm" className="cashout-button" onClick={(event) => { event.stopPropagation(); cashOutBet(bet.id); }}>Demo cash out <Icon name="arrow" size={13} /></Button></span>}
      </div>}
    </Card>
  );
}

function SlipPanel({ selection, stake, setStake, pendingOdds, marketSuspended, estimatedReturn, placeDemoBet, clearSelection, acceptNewOdds, navigate }: {
  selection: Selection | null;
  stake: string;
  setStake: (value: string) => void;
  pendingOdds: number | null;
  marketSuspended: boolean;
  estimatedReturn: number;
  placeDemoBet: () => void;
  clearSelection: () => void;
  acceptNewOdds: () => void;
  navigate: (page: Page) => void;
}) {
  const stakeId = useId();
  if (!selection) return <div className="side-empty-slip"><div className="empty-ticket-icon"><Icon name="ticket" size={21} /></div><strong>Nothing on the slip</strong><p>Choose one sample price and it will appear here.</p><Button variant="outline" size="sm" className="side-add-button" onClick={() => navigate('home')}>Find a sample pick <Icon name="arrow" size={13} /></Button></div>;
  return (
    <div className="side-slip-content">
      <div className="side-slip-caption"><strong>Singles</strong><span>1 selection</span><button onClick={clearSelection}>Clear</button></div>
      <div className="side-selection-card"><div className="side-selection-head"><div><strong>{selection.label}</strong><small><ClubPair fixtureId={selection.fixtureId} />{selection.fixture}</small></div><strong className="side-odds">{selection.odds.toFixed(2)}</strong><button className="side-remove" onClick={clearSelection} aria-label="Remove selection">×</button></div><span className="side-market-line">{selection.competition} · {selection.market}</span><div className="side-single-note"><Icon name="ticket" size={12} /> Single only <span>·</span> demo USDT</div>
        {pendingOdds !== null && <div className="side-state warning">Odds changed · {selection.odds.toFixed(2)} → {pendingOdds.toFixed(2)} <Button size="sm" onClick={acceptNewOdds}>Accept</Button></div>}
        {marketSuspended && <div className="side-state warning"><Icon name="lock" size={14} /> Market suspended</div>}
        <label className="side-stake-label" htmlFor={stakeId}>Demo stake <span>USDT</span></label>
        <Input id={stakeId} type="number" min="1" step="0.01" value={stake} onChange={(event) => setStake(event.currentTarget.value)} className="side-stake-input" aria-label="Side slip demo USDT stake" aria-invalid={!isValidStake(stake)} aria-describedby={`${stakeId}-hint`} />
        <p id={`${stakeId}-hint`} className={`stake-hint ${!isValidStake(stake) ? 'stake-error' : ''}`}>Minimum 1.00 · up to 2 decimals</p>
      </div>
      <div className="side-return"><span>Est. return</span><strong>{estimatedReturn.toFixed(2)} <small>Demo USDT</small></strong></div>
      <Button className="side-place-button" disabled={pendingOdds !== null || marketSuspended || !isValidStake(stake)} onClick={placeDemoBet}>Place demo bet <Icon name="arrow" size={14} /></Button>
      <p className="side-legal">Simulated USDT only. No token, wallet or funds involved.</p>
    </div>
  );
}

function CompactBets({ bets, cashOutBet, navigate }: { bets: DemoBet[]; cashOutBet: (id: string) => void; navigate: (page: Page) => void }) {
  const open = bets.filter((bet) => bet.status === 'open');
  return (
    <div className="compact-bets">
      <div className="compact-summary"><span>{open.length} OPEN</span><span>{bets.length - open.length} SETTLED</span></div>
      {open.slice(0, 2).map((bet) => <div className="compact-bet" key={bet.id}><div className="compact-bet-top"><Badge variant="info" dot>Open</Badge><strong>{bet.odds.toFixed(2)}</strong></div><b>{bet.selection}</b><small><ClubPair fixtureId={bet.fixtureId} />{bet.fixture}</small><div className="compact-bet-return">{bet.stake.toFixed(2)} → <strong>{formatDemoUSDT(bet.cashout ?? bet.returns)}</strong></div><Button variant="outline" size="sm" className="compact-cashout" onClick={() => cashOutBet(bet.id)}>Demo cash out</Button></div>)}
      {open.length === 0 && <p className="compact-empty">No open sample bets right now.</p>}
      <Button variant="ghost" size="sm" className="view-history-button" onClick={() => navigate('activity')}>View full activity <Icon name="arrow" size={13} /></Button>
    </div>
  );
}

function DemoLab({ selection, canPlaceDemoBet, pendingOdds, marketSuspended, failNext, openCount, simulateOddsChange, toggleSuspended, setFailNext, placeDemoBet, settleOpenBet, cancelFail }: {
  selection: Selection | null;
  canPlaceDemoBet: boolean;
  pendingOdds: number | null;
  marketSuspended: boolean;
  failNext: boolean;
  openCount: number;
  simulateOddsChange: () => void;
  toggleSuspended: () => void;
  setFailNext: () => void;
  placeDemoBet: () => void;
  settleOpenBet: () => void;
  cancelFail: () => void;
}) {
  return (
    <div className="demo-lab">
      <div className="demo-lab-heading"><div><span className="eyebrow">Simulation controls</span><h3>Demo controls</h3></div><span className="lab-stamp">Sample</span></div>
      <div className="demo-control-list">
        <button className="demo-control" onClick={simulateOddsChange}><span><strong>Move the odds</strong><small>{pendingOdds !== null ? 'Waiting for your acceptance' : selection ? 'Ask player to accept new odds' : 'Choose a price first'}</small></span><span className="control-chevron">↗</span></button>
        <button className="demo-control" onClick={toggleSuspended}><span><strong>{marketSuspended ? 'Resume market' : 'Suspend market'}</strong><small>{marketSuspended ? 'Unlock the sample selection' : 'Show a locked price state'}</small></span><span className="control-chevron">{marketSuspended ? '↻' : '⊘'}</span></button>
        <button className={`demo-control ${failNext ? 'control-armed' : ''}`} onClick={failNext ? cancelFail : setFailNext}><span><strong>{failNext ? 'Failure queued' : 'Queue failed bet'}</strong><small>{failNext ? 'Tap again to cancel' : 'Next placement will be rejected'}</small></span><span className="control-chevron">!</span></button>
        <button className="demo-control" onClick={placeDemoBet} disabled={!canPlaceDemoBet}><span><strong>Place a demo bet</strong><small>See the success state in My bets</small></span><span className="control-chevron">→</span></button>
        <button className="demo-control" onClick={settleOpenBet} disabled={openCount === 0}><span><strong>Settle open sample</strong><small>Move an open bet to settled</small></span><span className="control-chevron">✓</span></button>
      </div>
      <div className="lab-footer"><span className="lab-footer-dot" /> State controls affect this session only.</div>
    </div>
  );
}

function OddsButton({ label, odds, onClick, compact = false, selected = false, disabled = false }: { label: string; odds: number; onClick: () => void; compact?: boolean; selected?: boolean; disabled?: boolean }) {
  return <Button variant="outline" size="sm" aria-pressed={selected} disabled={disabled} className={`odds-button ${compact ? 'odds-compact' : ''} ${selected ? 'is-selected' : ''}`} onClick={(event) => { event.stopPropagation(); onClick(); }}><span className="odds-label">{label}</span><RollingNumber duration={320} value={odds} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="odds-value" /></Button>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <Card className="empty-state-card"><span className="empty-state-mark">—</span><h3>{title}</h3><p>{copy}</p></Card>;
}

export default App;
