import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Badge } from 'panelui-web/badge';
import { Button } from 'panelui-web/button';
import { Card } from 'panelui-web/card';
import { Input } from 'panelui-web/input';
import { RollingNumber } from 'panelui-web/rolling-number';
import type { Fixture, Selection } from './types';
import ClubCrest from './ClubCrest';
import CompetitionLogo from './CompetitionLogo';
import HubieMatchHero from './HubieMatchHero';
import MatchLiveSignal from './MatchLiveSignal';
import TopMatchesCarousel from './TopMatchesCarousel';
import MobileSheet from './MobileSheet';
import './global.css';
import './housebets-brand.css';
import './total-redesign.css';
import './independent-ledger.css';
import './audit-polish.css';
import './fieldside.css';
import './fieldside-fixes.css';
import './fixture-board.css';
import './mobile-reference.css';
import './redline-fixes.css';
import './screenshot-reference.css';
import './original-matchday.css';
import './lavender-wellness.css';
import './competition-logos.css';
import './match-pitch-hero.css';
import './hubie-hero.css';
import './home-results.css';
import './audit-completion.css';
import './approved-ui-revisions.css';
import './live-mobile-refinements.css';
import './mybets-mobile-refinements.css';
export type { Fixture, Selection } from './types';
type Page = 'home' | 'menu' | 'live' | 'football' | 'match' | 'activity';
type ActivityTab = 'slip' | 'bets';
type BetStatus = 'open' | 'settled';
type Navigate = (page: Page, fixtureId?: string) => void;
type Notice = { type: 'success' | 'error' | 'warning' | 'info'; text: string };
const isValidStake = (value: string) => /^\d+(?:\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) >= 1;
const formatDemoUSDT = (value: number) => `${value.toFixed(2)} USDT`;
const scrollPageTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
    { title: 'First-half result', sub: 'First 45 minutes · 1X2', category: 'Halves', options: [fixture.home, 'Draw', fixture.away], odds: [2.35, 2.05, 4.20] },
    { title: 'Second-half total goals', sub: 'Second half only · line 1.5', category: 'Halves', options: ['Over 1.5', 'Under 1.5'], odds: [1.95, 1.85] },
    { title: 'Asian handicap', sub: '90 minutes · home -0.5 / away +0.5', category: 'Handicaps', options: [`${fixture.home} -0.5`, `${fixture.away} +0.5`], odds: [2.10, 1.78] },
    { title: '3-way handicap', sub: '90 minutes · home starts one goal behind', category: 'Handicaps', options: [`${fixture.home} -1`, 'Handicap draw', `${fixture.away} +1`], odds: [3.50, 3.70, 1.87] },
    { title: 'Anytime goalscorer', sub: 'Invented player labels · no real player data', category: 'Goalscorers', options: [homePlayer, awayPlayer], odds: [2.60, 3.10] },
    { title: 'Next goalscorer', sub: 'Next goal · invented player labels', category: 'Goalscorers', options: [homePlayer, awayPlayer, 'No further goal'], odds: [4.20, 5.40, 2.65] },
    { title: 'Total corners', sub: '90 minutes · total line 9.5', category: 'Corners & cards', options: ['Over 9.5', 'Under 9.5'], odds: [1.95, 1.85] },
    { title: 'Total cards', sub: '90 minutes · total line 3.5', category: 'Corners & cards', options: ['Over 3.5', 'Under 3.5'], odds: [1.88, 1.92] },
    { title: 'Most corners', sub: '90 minutes · team with more corners', category: 'Corners & cards', options: [fixture.home, 'Draw', fixture.away], odds: [2.05, 7.50, 2.20] },
  ];
}

function fixtureSearchText(fixture: Fixture) {
  const markets = getSampleMarkets(fixture);
  return [fixture.home, fixture.away, fixture.competition, fixture.round, 'Home #9', 'Away #11', ...markets.flatMap((market) => [market.title, market.sub, ...market.options])].join(' ').toLowerCase();
}

type OddsOverrides = Record<string, number>;
const oddsOverrideKey = (fixtureId: string, market: string, label: string) => `${fixtureId}::${market}::${label}`;
function getMarketOdds(fixture: Fixture, market: string, pickIndex: number, overrides: OddsOverrides) {
  const definition = getSampleMarkets(fixture).find((item) => item.title === market);
  const label = definition?.options[pickIndex];
  if (!definition || !label) return 0;
  return overrides[oddsOverrideKey(fixture.id, market, label)] ?? definition.odds[pickIndex];
}

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
  placedAtMs: number;
  sport: string;
};

const fixtures: Fixture[] = [
  {
    id: 'arsenal-brighton', competition: 'Premier League', round: 'Round 9',
    home: 'Arsenal', away: 'Brighton & Hove Albion', homeScore: 1, awayScore: 0,
    status: 'LIVE', phase: '2H', time: "47′", odds: [1.84, 3.20, 4.60], extraMarkets: 12,
  },
  {
    id: 'real-madrid-arsenal', competition: 'UEFA Champions League', round: 'Sample pairing',
    home: 'Real Madrid', away: 'Arsenal', status: 'UPCOMING',
    time: '20:15', date: 'TOMORROW', odds: [2.65, 3.35, 2.70], extraMarkets: 12,
  },
  {
    id: 'liverpool-man-utd', competition: 'Premier League', round: 'Round 9',
    home: 'Liverpool', away: 'Manchester United', homeScore: 1, awayScore: 1,
    status: 'LIVE', phase: 'HT', time: '45′', odds: [2.35, 2.90, 3.00], extraMarkets: 12,
  },
  {
    id: 'toulouse-strasbourg', competition: 'Ligue 1', round: 'Round 10',
    home: 'Toulouse FC', away: 'RC Strasbourg Alsace', homeScore: 0, awayScore: 0,
    status: 'LIVE', phase: 'HT', time: '45′', odds: [2.35, 2.90, 3.00], suspended: true, extraMarkets: 12,
  },
  {
    id: 'real-madrid-bayern', competition: 'UEFA Champions League', round: 'Quarter-final',
    home: 'Real Madrid', away: 'FC Bayern München', homeScore: 2, awayScore: 1, status: 'FINISHED', phase: 'FT',
    time: '90′', date: 'FINAL SAMPLE', odds: [1.72, 3.55, 4.75], extraMarkets: 0,
  },
  {
    id: 'liverpool-tottenham-final', competition: 'Premier League', round: 'Round 8',
    home: 'Liverpool', away: 'Tottenham Hotspur', homeScore: 2, awayScore: 1, status: 'FINISHED', phase: 'FT',
    time: '90′', date: 'FINAL SAMPLE', odds: [1.95, 3.35, 3.80], extraMarkets: 0,
  },
  {
    id: 'sevilla-inter-final', competition: 'UEFA Champions League', round: 'Group stage',
    home: 'Sevilla FC', away: 'Inter Milan', homeScore: 1, awayScore: 1, status: 'FINISHED', phase: 'FT',
    time: '90′', date: 'FINAL SAMPLE', odds: [2.75, 3.10, 2.65], extraMarkets: 0,
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

function isFinishedFixture(fixture: Fixture) {
  return fixture.status === 'FINISHED' || fixture.phase === 'FT';
}
function isLiveFixture(fixture: Fixture) {
  return fixture.status === 'LIVE' && fixture.phase !== 'FT';
}
function isActivelyLiveFixture(fixture: Fixture) {
  return fixture.status === 'LIVE' && fixture.phase !== 'HT' && fixture.phase !== 'FT';
}
function fixturePeriodText(fixture: Fixture) {
  switch (fixture.phase) {
    case '1H': return '1st half';
    case 'HT': return 'Half-time';
    case '2H': return '2nd half';
    case 'ET': return 'Extra time';
    case 'FT': return 'Full time';
    default: return 'In play';
  }
}
function FixtureStatusBadge({ fixture, className = '' }: { fixture: Fixture; className?: string }) {
  const classes = `match-card-period-tag ${className}`.trim();
  if (isFinishedFixture(fixture)) return <span className={`${classes} is-fulltime`} title="Full time" aria-label="FT, full time">FT</span>;
  if (fixture.status === 'LIVE' && fixture.phase === 'HT') return <span className={`${classes} is-halftime`} title="Half-time" aria-label="HT, half-time">HT</span>;
  if (isActivelyLiveFixture(fixture)) return <MatchLiveSignal className={className} />;
  return null;
}
function ClubPair({ fixtureId, className = '' }: { fixtureId: string; className?: string }) {
  const fixture = fixtures.find((item) => item.id === fixtureId);
  if (!fixture) return null;
  return <span className={`club-pair ${className}`} aria-hidden="true"><ClubCrest club={fixture.home} /><ClubCrest club={fixture.away} /></span>;
}

const navItems: { id: Page; label: string; icon: string; count?: string }[] = [
  { id: 'home', label: 'Sports home', icon: 'home' },
  { id: 'live', label: 'Live now', icon: 'live', count: String(fixtures.filter(isLiveFixture).length).padStart(2, '0') },
  { id: 'football', label: 'Football', icon: 'ball' },
  { id: 'match', label: 'Match centre', icon: 'grid' },
  { id: 'activity', label: 'Bet slip & My bets', icon: 'ticket' },
];

// Keep mobile reading/focus order aligned with the central Bets destination.
const mobileNavItems: typeof navItems = [{ id: 'menu', label: 'Menu', icon: 'menu' }, navItems[1], navItems[4], navItems[2], navItems[3]];

const mobileSports = [
  { name: 'Football', icon: 'ball' },
  { name: 'Tennis', icon: 'tennis' },
  { name: 'Basketball', icon: 'basketball' },
  { name: 'Cricket', icon: 'cricket' },
  { name: 'Volleyball', icon: 'volleyball' },
  { name: 'Handball', icon: 'ball' },
];

const pageLabels: Record<Page, { crumb: string; title: string; subtitle: string }> = {
  home: { crumb: 'Sports', title: 'Matchday', subtitle: 'Club fixtures, scores and odds.' },
  menu: { crumb: 'Menu', title: 'Menu', subtitle: 'Sports and your saved favourites.' },
  live: { crumb: 'Live now', title: 'Matches in play', subtitle: 'Scores and odds are examples; there is no live feed.' },
  football: { crumb: 'Football', title: 'Football fixtures', subtitle: 'Browse club matchups and choose one price.' },
  match: { crumb: 'Match centre', title: 'Match centre', subtitle: 'One fixture across six market groups.' },
  activity: { crumb: 'Your bets', title: 'Bet slip & My bets', subtitle: 'One pick at a time, with a local bet record.' },
};

const initialBets: DemoBet[] = [
  {
    id: 'demo-open-01', fixtureId: 'arsenal-brighton', fixture: 'Arsenal v Brighton & Hove Albion', competition: 'Premier League',
    selection: 'Arsenal', market: 'Match result', odds: 1.72, stake: 10,
    status: 'open', returns: 17.20, cashout: 14.80, placedAtMs: Date.now() - 45 * 60 * 1000, sport: 'Football',
  },
  {
    id: 'demo-settled-01', fixtureId: 'real-madrid-bayern', fixture: 'Real Madrid v FC Bayern München', competition: 'UEFA Champions League',
    selection: 'Real Madrid', market: 'Match result', odds: 2.10, stake: 5,
    status: 'settled', result: 'Won · sample result', returns: 10.50,
    placedAtMs: Date.now() - 12 * 24 * 60 * 60 * 1000, sport: 'Football',
  },
];
function isWithinBetDateRange(timestamp: number, range: string, now = Date.now()) {
  if (range === 'All time') return true;
  if (range === 'Today') {
    const today = new Date(now);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return timestamp >= start && timestamp <= now;
  }
  const days = range === 'Last 7 days' ? 7 : range === 'Last 30 days' ? 30 : 0;
  return days > 0 && timestamp >= now - days * 24 * 60 * 60 * 1000 && timestamp <= now;
}
function formatBetPlacedAt(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayOffset = Math.round((startToday - startDate) / (24 * 60 * 60 * 1000));
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dayOffset === 0) return `Today · ${time}`;
  if (dayOffset === 1) return `Yesterday · ${time}`;
  if (dayOffset > 1 && dayOffset < 7) return `${dayOffset} days ago · ${time}`;
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · ${time}`;
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  switch (name) {
    case 'home': return <svg {...common}><path d="m3 10 9-7 9 7"/><path d="M5.5 9v11h13V9M9.5 20v-6h5v6"/></svg>;
    case 'menu': return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
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
  const [priceOverrides, setPriceOverrides] = useState<OddsOverrides>({});
  const [stake, setStake] = useState('10');
  const [pendingOdds, setPendingOdds] = useState<number | null>(null);
  const [suspendedFixtureIds, setSuspendedFixtureIds] = useState<string[]>([]);
  const [failNext, setFailNext] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [slipMessage, setSlipMessage] = useState<Notice | null>(null);
  const [bets, setBets] = useState<DemoBet[]>(initialBets);
  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('All football');
  const [liveSportFilter, setLiveSportFilter] = useState('Football');
  const [liveCompetitionFilter, setLiveCompetitionFilter] = useState('All competitions');
  const [favourites, setFavourites] = useState<string[]>(['Premier League', 'Arsenal']);
  const following = favourites;
  const [footballScope, setFootballScope] = useState<'live-upcoming' | 'all'>('live-upcoming');
  const [marketCategory, setMarketCategory] = useState('Popular');
  const [marketQuery, setMarketQuery] = useState('');
  const [collapsedMarkets, setCollapsedMarkets] = useState<string[]>([]);
  const [marketJumpRequest, setMarketJumpRequest] = useState(0);
  const handledMarketJump = useRef(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const activeMeta = pageLabels[page];
  const openCount = bets.filter((bet) => bet.status === 'open').length;
  const stakeNumber = Number(stake) || 0;
  const activeOdds = selection?.odds ?? 0;
  const selectionMotionKey = selection ? `${selection.fixtureId}|${selection.market}|${selection.label}|${selection.odds}` : 'empty';
  const estimatedReturn = isValidStake(stake) ? stakeNumber * activeOdds : 0;
  const selectedFixture = selection ? fixtures.find((fixture) => fixture.id === selection.fixtureId) : undefined;
  const selectedFixtureSuspended = Boolean(selection && (selectedFixture?.suspended || suspendedFixtureIds.includes(selection.fixtureId)));
  const demoFixtureId = page === 'match' ? matchFixtureId : selection?.fixtureId ?? matchFixtureId;
  const demoFixture = fixtures.find((fixture) => fixture.id === demoFixtureId) ?? fixtures[0];
  const demoFixtureSuspended = suspendedFixtureIds.includes(demoFixtureId);
  const visibleFixtures = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return fixtures;
    return fixtures.filter((fixture) => fixtureSearchText(fixture).includes(normalized));
  }, [query]);
  const homeFeatured = visibleFixtures.find((fixture) => fixture.id === 'real-madrid-arsenal') ?? visibleFixtures.find(isLiveFixture) ?? visibleFixtures[0];
  const homeFeaturedOdds = homeFeatured
    ? homeFeatured.odds.map((_, index) => getMarketOdds(homeFeatured, 'Match result', index, priceOverrides)) as [number, number, number]
    : undefined;

  useEffect(() => {
    if (!notice || notice.type === 'error') return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (page !== 'match' || marketJumpRequest === handledMarketJump.current) return;
    const directory = document.getElementById('match-market-directory');
    if (!directory) return;
    handledMarketJump.current = marketJumpRequest;
    directory.querySelector('[role="tab"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    directory.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [page, matchFixtureId, marketJumpRequest]);

  function updateStake(value: string) {
    setStake(value);
    if (isValidStake(value)) setSlipMessage(null);
  }

  function openFullSlip() {
    setActivityTab('slip');
    setRailTab('slip');
    if (window.matchMedia('(max-width: 760px)').matches) {
      setMobileSheetOpen(true);
      setNotice(null);
      return;
    }
    navigate('activity');
  }

  function reportSlipMessage(type: Notice['type'], text: string) {
    const message = { type, text };
    setSlipMessage(message);
    setNotice(message);
  }

  function navigate(next: Page, fixtureId?: string, scrollToTop = true) {
    if (next === 'match' && fixtureId) setMatchFixtureId(fixtureId);
    if (next !== page) setNotice(null);
    setPage(next);
    setMobileSheetOpen(false);
    if (scrollToTop) scrollPageTop();
  }

  function openMarket(fixtureId: string, category: string) {
    const targetFixture = fixtures.find((fixture) => fixture.id === fixtureId);
    if (targetFixture) {
      const categoryTitles = getSampleMarkets(targetFixture).filter((market) => market.category === category).map((market) => market.title);
      setCollapsedMarkets((current) => current.filter((title) => !categoryTitles.includes(title)));
    }
    setMarketCategory(category);
    setMarketQuery('');
    setMarketJumpRequest((current) => current + 1);
    navigate('match', fixtureId, false);
  }

  function openFullBets() {
    setActivityTab('bets');
    setRailTab('bets');
    navigate('activity');
  }

  function toggleFixtureSuspension(fixtureId: string) {
    setSuspendedFixtureIds((current) => current.includes(fixtureId)
      ? current.filter((id) => id !== fixtureId)
      : [...current, fixtureId]);
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
  function openMenuSport(sport: string) {
    setQuery('');
    if (sport === 'Football') {
      setSportFilter('All football');
      setFootballScope('all');
      navigate('football');
      return;
    }
    setLiveSportFilter(sport);
    setLiveCompetitionFilter('All competitions');
    navigate('live');
    setNotice({ type: 'info', text: `No ${sport} fixtures are included in this football-only demo yet.` });
  }

  function openFavourite(item: string) {
    setQuery('');
    if (fixtures.some((fixture) => fixture.competition === item)) {
      openCompetition(item);
      return;
    }
    const fixture = fixtures.find((candidate) => candidate.home === item || candidate.away === item);
    if (fixture) {
      navigate('match', fixture.id);
      return;
    }
    setSportFilter('All football');
    setFootballScope('all');
    setQuery(item);
    navigate('football');
  }


  function toggleFavourite(item: string) {
    setFavourites((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  }

  function toggleFollow(team: string) {
    toggleFavourite(team);
  }

  function toggleMarket(title: string) {
    setCollapsedMarkets((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  function makeSelection(fixture: Fixture, pickIndex: number, market = 'Match result') {
    const selectedMarket = getSampleMarkets(fixture).find((item) => item.title === market);
    const clickedLabel = selectedMarket?.options[pickIndex];
    if (selection && clickedLabel && selection.fixtureId === fixture.id && selection.market === market && selection.label === clickedLabel) {
      clearSelection();
      return;
    }
    if (isFinishedFixture(fixture)) {
      setNotice({ type: 'warning', text: 'This sample match has finished. Its markets are closed.' });
      return;
    }
    if (fixture.suspended || suspendedFixtureIds.includes(fixture.id)) {
      setNotice({ type: 'warning', text: 'Market suspended. This selection is unavailable for now.' });
      return;
    }
    if (!selectedMarket || !selectedMarket.options[pickIndex] || !Number.isFinite(selectedMarket.odds[pickIndex])) return;
    const nextSelection: Selection = {
      fixtureId: fixture.id,
      fixture: `${fixture.home} v ${fixture.away}`,
      competition: fixture.competition,
      market,
      label: selectedMarket.options[pickIndex],
      odds: priceOverrides[oddsOverrideKey(fixture.id, market, selectedMarket.options[pickIndex])] ?? selectedMarket.odds[pickIndex],
    };
    if (pendingOdds !== null) {
      reportSlipMessage('warning', 'Accept the changed odds or clear this selection before choosing another price.');
      return;
    }
    if (selection && (selection.fixtureId !== nextSelection.fixtureId || selection.market !== nextSelection.market || selection.label !== nextSelection.label)) {
      setUndoSelection(selection);
      setNotice({ type: 'info', text: `Replaced ${selection.label} with ${nextSelection.label} at ${nextSelection.odds.toFixed(2)}.` });
    } else {
      setUndoSelection(null);
      setNotice(null);
    }
    setSelection(nextSelection);
    setSlipMessage(null);
    setRailTab('slip');
    setActivityTab('slip');
  }

  function undoSelectionReplacement() {
    if (!undoSelection) return;
    setSelection(undoSelection);
    setSlipMessage(null);
    setNotice({ type: 'success', text: `Restored ${undoSelection.label} at ${undoSelection.odds.toFixed(2)}.` });
    setUndoSelection(null);
    setPendingOdds(null);
  }

  function clearSelection() {
    setSelection(null);
    setUndoSelection(null);
    setSlipMessage(null);
    setPendingOdds(null);
    setNotice(null);
  }

  function placeDemoBet() {
    if (!selection) return;
    if (!isValidStake(stake)) {
      reportSlipMessage('error', 'Enter a stake of at least 1.00 with no more than two decimal places.');
      return;
    }
    if (selectedFixtureSuspended) {
      reportSlipMessage('warning', 'Market suspended. Resume it before placing this demo bet.');
      return;
    }
    if (pendingOdds !== null) {
      reportSlipMessage('warning', 'Accept the changed odds before placing this demo bet.');
      return;
    }
    if (failNext) {
      setFailNext(false);
      reportSlipMessage('error', 'Demo placement failed. Your slip is unchanged—try again when ready.');
      return;
    }
    const returns = Number((stakeNumber * selection.odds).toFixed(2));
    const newBet: DemoBet = {
      id: `demo-${Date.now()}`, fixtureId: selection.fixtureId, fixture: selection.fixture, competition: selection.competition,
      selection: selection.label, market: selection.market, odds: selection.odds,
      stake: stakeNumber, status: 'open', returns, cashout: Number((returns * 0.86).toFixed(2)),
      placedAtMs: Date.now(), sport: 'Football',
    };
    setBets((current) => [newBet, ...current]);
    setActivityTab('bets');
    setBetFilter('open');
    setRailTab('bets');
    setPage('activity');
    setSelection(null);
    setUndoSelection(null);
    setSlipMessage(null);
    setPendingOdds(null);
    setMobileSheetOpen(false);
    setNotice({ type: 'success', text: `Demo bet placed: ${newBet.selection} · ${formatDemoUSDT(newBet.stake)}.` });
    scrollPageTop();
  }

  function cashOutBet(id: string) {
    setBets((current) => current.map((bet) => bet.id === id && bet.status === 'open'
      ? { ...bet, status: 'settled', result: 'Cashed out · sample only', returns: bet.cashout ?? bet.returns }
      : bet));
    setBetFilter('settled');
    setActivityTab('bets');
    setRailTab('bets');
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
    setBetFilter('settled');
    setActivityTab('bets');
    setRailTab('bets');
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
    setPriceOverrides((current) => ({ ...current, [oddsOverrideKey(selection.fixtureId, selection.market, selection.label)]: pendingOdds }));
    setSelection({ ...selection, odds: pendingOdds });
    setPendingOdds(null);
    setSlipMessage(null);
    setNotice({ type: 'success', text: `New odds accepted: ${pendingOdds.toFixed(2)}.` });
  }

  const compactLabels: Record<Page, string> = { home: 'Home', menu: 'Menu', live: 'Live', football: 'Football', match: 'Match', activity: 'Bets' };
  const nav = (compact = false) => (
    <>
      {(compact ? mobileNavItems : navItems).map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          size="md"
          className={`nav-link ${page === item.id || (compact && item.id === 'activity' && mobileSheetOpen) ? 'is-active' : ''} ${compact ? 'mobile-nav-link' : ''}`}
          data-destination={item.id}
          aria-current={page === item.id ? 'page' : undefined}
          aria-expanded={compact && item.id === 'activity' ? mobileSheetOpen : undefined}
          aria-label={compact && item.id === 'activity' ? `Bets${selection ? ', 1 selection' : ''}` : item.label}
          onClick={() => {
            if (compact && item.id === 'activity') {
              if (mobileSheetOpen) setMobileSheetOpen(false);
              else openFullSlip();
              return;
            }
            navigate(item.id);
          }}
        >
          <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
          <span className="nav-label">{compact ? compactLabels[item.id] : item.id === 'activity' ? 'Slip & bets' : item.label}</span>
          {item.count && <span className="nav-count">{item.count}</span>}
          {item.id === 'activity' && selection && (compact
            ? <span className="nav-count nav-slip-count" aria-hidden="true">1</span>
            : <span className="nav-count nav-count-lime" aria-hidden="true">1</span>)}
        </Button>
      ))}
    </>
  );

  return (
    <div id="housebets-app" className="app-shell" data-page={page} data-has-selection={Boolean(selection)} data-sheet-open={mobileSheetOpen} data-design="original-matchday" data-theme="lavender">
      <StatusBar style="light" />
      <header className="topbar">
        <button className="brand-lockup" onClick={() => navigate('home')} aria-label="Sports home">
          <img className="brand-logo" src="/housebets-logo.svg" alt="Housebets" />
          <span className="brand-divider" />
          <span className="brand-sport">SPORTS</span>
        </button>
        <div className="top-search header-search">
          <Icon name="search" size={15} />
          <Input aria-label="Search teams, players or leagues" placeholder="Teams, competitions, markets" value={query} onChange={(event) => setQuery(event.currentTarget.value)} size="sm" className="search-input" />
          <span className="search-key">/</span>
        </div>
        <div className="topbar-actions">
          <Badge variant="success" dot className="demo-badge">Demo board</Badge>
          <button className="account-button" onClick={() => navigate('activity')} aria-label="Open demo activity">
            <span className="account-avatar">H</span><span className="account-label">Guest</span><span className="account-chevron">⌄</span>
          </button>
        </div>
      </header>

      <aside className="left-rail" aria-label="Sports navigation">
        <div className="rail-section-label">Your board</div>
        <nav className="primary-nav">{nav()}</nav>
        <section className="sidebar-favourites" aria-labelledby="sidebar-favourites-heading">
          <div className="sidebar-favourites-heading">
            <h2 id="sidebar-favourites-heading">Favourites</h2>
            <span aria-label={`${favourites.length} favourites`}>{favourites.length}</span>
          </div>
          {favourites.length > 0 ? <div className="sidebar-favourite-list">
            {favourites.map((item) => {
              const isCompetition = fixtures.some((fixture) => fixture.competition === item);
              return <div className="sidebar-favourite-row" key={item}>
                <button type="button" className="sidebar-favourite-open" onClick={() => openFavourite(item)} aria-label={`Open ${item}`} title={item}>
                  {isCompetition ? <CompetitionLogo competition={item} className="sidebar-favourite-logo" /> : <ClubCrest club={item} className="sidebar-favourite-logo" />}
                  <span className="sidebar-favourite-copy"><strong>{item}</strong><small>{isCompetition ? 'Competition' : 'Team'}</small></span>
                </button>
                <button type="button" className="sidebar-favourite-remove" onClick={() => toggleFavourite(item)} aria-label={`Remove ${item} from favourites`} title={`Remove ${item} from favourites`}><Icon name="close" size={14} /></button>
              </div>;
            })}
          </div> : <div className="sidebar-favourites-empty">
            <p>No favourites yet. Save a team with the star or Follow button.</p>
            <button type="button" onClick={() => openMenuSport('Football')}>Browse football</button>
          </div>}
        </section>
        <div className="rail-note">
          <span className="rail-note-mark">HB</span>
          <strong>Sample board.</strong>
          <p>Fixtures and prices are simulated; no real bets.</p>
        </div>
      </aside>

      <main className="main-content">
        {page !== 'home' && <>
        <div className="page-topline"><div className="breadcrumbs"><span>HOUSEBETS</span><span className="crumb-slash">/</span><span>{activeMeta.crumb}</span></div><span className="updated-note">Sample data only</span></div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{activeMeta.crumb}</p>
            <h1>{activeMeta.title}</h1>
            <p className="page-subtitle">{page === 'live' ? <><span className="live-subtitle-long">{activeMeta.subtitle}</span><span className="live-subtitle-compact" aria-hidden="true">Demo scores · no live feed</span></> : activeMeta.subtitle}</p>
          </div>
          <div className="page-head-actions">
            <Button variant="outline" size="sm" className="head-action" onClick={() => { setActivityTab('bets'); setRailTab('bets'); navigate('activity'); }}>My activity <Icon name="arrow" size={14} /></Button>
          </div>
        </div>
        </>}
        {page === 'home' && homeFeatured && homeFeaturedOdds && <HubieMatchHero fixture={homeFeatured} odds={homeFeaturedOdds} selection={selection} onOpen={() => navigate('match', homeFeatured.id)} onSelect={(index) => makeSelection(homeFeatured, index)} />}

        <div className="top-search page-search">
          <Icon name="search" size={16} />
          <Input aria-label="Search teams, players or leagues" placeholder="Search teams, players or leagues" value={query} onChange={(event) => setQuery(event.currentTarget.value)} size="sm" className="search-input" />
          <span className="search-key">/</span>
        </div>
        {page === 'home' && <MobileSportsHeader page={page} navigate={navigate} onChooseSport={selectMobileSport} />}
        {notice && (
        <div className={`notice notice-${notice.type}`} role="status">
          <span className="notice-mark">{notice.type === 'success' ? '✓' : notice.type === 'error' ? '!' : notice.type === 'warning' ? '↗' : 'i'}</span>
          <span>{notice.text}</span>
          {undoSelection && notice.type === 'info' && <button className="notice-undo" onClick={undoSelectionReplacement}>Undo</button>}
          <button className="notice-close" onClick={() => setNotice(null)} aria-label="Dismiss message"><Icon name="close" size={14} /></button>
          </div>
        )}
        {page === 'home' && <HomePage fixtures={visibleFixtures} featuredId={homeFeatured?.id} navigate={navigate} makeSelection={makeSelection} selection={selection} priceOverrides={priceOverrides} onCompetition={openCompetition} onChooseSport={selectMobileSport} favourites={favourites} toggleFavourite={toggleFavourite} openMarket={openMarket} />}
        {page === 'menu' && <MenuPage favourites={favourites} onChooseSport={openMenuSport} onOpenFavourite={openFavourite} toggleFavourite={toggleFavourite} onBrowseFootball={() => openMenuSport('Football')} />}
        {page === 'live' && <LivePage fixtures={visibleFixtures} navigate={navigate} makeSelection={makeSelection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} sportFilter={liveSportFilter} setSportFilter={setLiveSportFilter} competitionFilter={liveCompetitionFilter} setCompetitionFilter={setLiveCompetitionFilter} searchQuery={query} selection={selection} openMarket={openMarket} />}
        {page === 'football' && <FootballPage fixtures={visibleFixtures} navigate={navigate} makeSelection={makeSelection} priceOverrides={priceOverrides} sportFilter={sportFilter} setSportFilter={setSportFilter} footballScope={footballScope} setFootballScope={setFootballScope} favourites={favourites} toggleFavourite={toggleFavourite} selection={selection} openMarket={openMarket} />}
        {page === 'match' && (
          <MatchPage
            fixture={fixtures.find((fixture) => fixture.id === matchFixtureId) ?? fixtures[0]}
            fixtures={fixtures}
            priceOverrides={priceOverrides}
            marketSuspended={suspendedFixtureIds.includes(matchFixtureId)}
            selection={selection}
            makeSelection={makeSelection}
            navigate={navigate}
            marketCategory={marketCategory}
            setMarketCategory={setMarketCategory}
            marketQuery={marketQuery}
            setMarketQuery={setMarketQuery}
            collapsedMarkets={collapsedMarkets}
            toggleMarket={toggleMarket}
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
            openCount={openCount}
            stake={stake}
            setStake={updateStake}
            slipMessage={slipMessage}
            pendingOdds={pendingOdds}
            marketSuspended={selectedFixtureSuspended}
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
            canPlaceDemoBet={Boolean(selection && isValidStake(stake) && pendingOdds === null && !selectedFixtureSuspended)}
            pendingOdds={pendingOdds}
            marketSuspended={demoFixtureSuspended}
            fixtureLabel={`${demoFixture.home} v ${demoFixture.away}`}
            failNext={failNext}
            openCount={openCount}
            simulateOddsChange={simulateOddsChange}
            toggleSuspended={() => toggleFixtureSuspension(demoFixtureId)}
            setFailNext={() => { setFailNext(true); setNotice({ type: 'warning', text: 'The next demo placement will fail. Tap again to cancel.' }); }}
            placeDemoBet={placeDemoBet}
            settleOpenBet={settleOpenBet}
            cancelFail={() => setFailNext(false)}
          />
        </details>
        <footer className="page-footer"><span className="footer-mark">HB</span><span><strong>Demo board.</strong> Fixtures, prices and returns are examples. No real players, bets or money are connected. Club marks belong to their owners.</span></footer>
      </main>

      <aside className="right-rail" aria-label="Demo activity panel">
        <div className="right-rail-top">
          <div className="side-tabs" role="tablist" aria-label="Demo activity">
            <button className={`side-tab ${railTab === 'slip' ? 'selected' : ''}`} onClick={() => { setRailTab('slip'); setActivityTab('slip'); }} role="tab" aria-selected={railTab === 'slip'}>Bet slip <span key={selectionMotionKey} className="slip-count-update" data-active={Boolean(selection)}>{selection ? '1' : '0'}</span></button>
            <button className={`side-tab ${railTab === 'bets' ? 'selected' : ''}`} onClick={() => { setRailTab('bets'); setActivityTab('bets'); }} role="tab" aria-label={`Open bets, ${openCount} open`} aria-selected={railTab === 'bets'}>My bets <span aria-label={`${openCount} open bets`}>{openCount}</span></button>
          </div>
          <div key={selectionMotionKey} className="rail-panel-body slip-refresh" data-has-selection={Boolean(selection)}>
            {railTab === 'slip' ? (
              <SlipPanel idPrefix="rail" selection={selection} stake={stake} setStake={updateStake} slipMessage={slipMessage} pendingOdds={pendingOdds} marketSuspended={selectedFixtureSuspended} estimatedReturn={estimatedReturn} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} placeDemoBet={placeDemoBet} navigate={navigate} />
            ) : (
              <CompactBets bets={bets} cashOutBet={cashOutBet} openFullBets={openFullBets} />
            )}
          </div>
        </div>
        <details className="rail-demo-disclosure">
          <summary><span>Prototype controls</span><small>Session only</small><b>＋</b></summary>
          <DemoLab
            selection={selection}
            canPlaceDemoBet={Boolean(selection && isValidStake(stake) && pendingOdds === null && !selectedFixtureSuspended)}
            pendingOdds={pendingOdds}
            marketSuspended={demoFixtureSuspended}
            fixtureLabel={`${demoFixture.home} v ${demoFixture.away}`}
            failNext={failNext}
            openCount={openCount}
            simulateOddsChange={simulateOddsChange}
            toggleSuspended={() => toggleFixtureSuspension(demoFixtureId)}
            setFailNext={() => { setFailNext(true); setNotice({ type: 'warning', text: 'The next demo placement will fail. Tap again to cancel.' }); }}
            placeDemoBet={placeDemoBet}
            settleOpenBet={settleOpenBet}
            cancelFail={() => setFailNext(false)}
          />
        </details>
      </aside>

      {mobileSheetOpen && (
        <MobileSheet onClose={() => setMobileSheetOpen(false)}>
            <div className="mobile-sheet-head">
              <div className="mobile-sheet-tabs" role="tablist" aria-label="Slip or My bets">
                <button role="tab" aria-selected={railTab === 'slip'} className={railTab === 'slip' ? 'active' : ''} onClick={() => { setRailTab('slip'); setActivityTab('slip'); }}>Bet slip <span>{selection ? 1 : 0}</span></button>
                <button role="tab" aria-selected={railTab === 'bets'} className={railTab === 'bets' ? 'active' : ''} aria-label={`Open bets, ${openCount} open`} onClick={() => { setRailTab('bets'); setActivityTab('bets'); }}>My bets <span aria-label={`${openCount} open bets`}>{openCount}</span></button>
              </div>
              <button className="mobile-sheet-close" onClick={() => setMobileSheetOpen(false)} aria-label="Close bet slip"><Icon name="close" size={18} /></button>
            </div>
            <div key={selectionMotionKey} className="mobile-sheet-body slip-refresh" data-has-selection={Boolean(selection)}>
              {railTab === 'slip'
                ? <SlipPanel idPrefix="mobile" selection={selection} stake={stake} setStake={updateStake} slipMessage={slipMessage} pendingOdds={pendingOdds} marketSuspended={selectedFixtureSuspended} estimatedReturn={estimatedReturn} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} placeDemoBet={placeDemoBet} navigate={navigate} />
                : <CompactBets bets={bets} cashOutBet={cashOutBet} openFullBets={openFullBets} />}
            </div>
        </MobileSheet>
      )}
      <nav className="mobile-nav" aria-label="Mobile navigation">{nav(true)}</nav>
    </div>
  );
}


function MobileSportsHeader({ page, navigate, onChooseSport }: { page: Page; navigate: Navigate; onChooseSport: (sport: string) => void }) {
  const liveCount = String(fixtures.filter(isLiveFixture).length).padStart(2, '0');
  const destinations: { name: string; page: Page; count?: string }[] = [
    { name: 'Home', page: 'home' },
    { name: 'Live', page: 'live', count: liveCount },
    { name: 'Soccer', page: 'football' },
  ];
  return (
    <nav className="sports-index" aria-label="Sports and sections">
      <div className="sports-index-items">
        {destinations.map((destination) => <button key={destination.page} className={`sports-index-item ${page === destination.page ? 'active' : ''}`} aria-current={page === destination.page ? 'page' : undefined} aria-pressed={page === destination.page} onClick={() => navigate(destination.page)}>{destination.name}{destination.count && <span>{destination.count}</span>}</button>)}
        {mobileSports.filter((sport) => sport.name === 'Tennis' || sport.name === 'Basketball').map((sport) => <button key={sport.name} className="sports-index-item sport-preview" aria-pressed={false} onClick={() => onChooseSport(sport.name)}>{sport.name}</button>)}
      </div>
      <span className="sports-index-note">Football fixtures</span>
    </nav>
  );
}


function MenuPage({ favourites, onChooseSport, onOpenFavourite, toggleFavourite, onBrowseFootball }: {
  favourites: string[];
  onChooseSport: (sport: string) => void;
  onOpenFavourite: (item: string) => void;
  toggleFavourite: (item: string) => void;
  onBrowseFootball: () => void;
}) {
  return (
    <div className="page-stack menu-page">
      <section className="menu-section" aria-labelledby="menu-sports-heading">
        <div className="menu-section-heading">
          <div><h2 id="menu-sports-heading">Sports</h2><p>Choose a sport to open its board.</p></div>
        </div>
        <div className="menu-sport-grid">
          {mobileSports.map((sport) => <button key={sport.name} type="button" className="menu-sport-button" onClick={() => onChooseSport(sport.name)}>
            <span className="menu-sport-icon"><Icon name={sport.icon} size={18} /></span>
            <span className="menu-sport-name">{sport.name}</span>
            <span className="menu-sport-description">{sport.name === 'Football' ? 'Fixtures and leagues' : 'Open sport board'}</span>
            <Icon name="chevron" size={16} />
          </button>)}
        </div>
      </section>
      <section className="menu-section" aria-labelledby="menu-favourites-heading">
        <div className="menu-section-heading">
          <div><h2 id="menu-favourites-heading">Favourites</h2><p>Open a saved team or competition.</p></div>
          <span className="menu-favourite-count" aria-label={`${favourites.length} favourites`}>{favourites.length}</span>
        </div>
        {favourites.length > 0 ? <div className="menu-favourite-list">
          {favourites.map((item) => {
            const isCompetition = fixtures.some((fixture) => fixture.competition === item);
            return <div className="menu-favourite-row" key={item}>
              <button type="button" className="menu-favourite-open" onClick={() => onOpenFavourite(item)} aria-label={`Open ${item}`}>
                <span className="menu-favourite-marker"><Icon name={isCompetition ? 'grid' : 'star'} size={17} /></span>
                <span className="menu-favourite-copy"><strong>{item}</strong><small>{isCompetition ? 'Competition' : 'Team'}</small></span>
                <Icon name="chevron" size={16} />
              </button>
              <button type="button" className="menu-favourite-remove" onClick={() => toggleFavourite(item)} aria-label={`Remove ${item} from favourites`} title={`Remove ${item} from favourites`}><Icon name="close" size={16} /></button>
            </div>;
          })}
        </div> : <div className="menu-favourites-empty">
          <span className="menu-favourite-marker"><Icon name="star" size={17} /></span>
          <div><strong>No favourites yet</strong><p>Save a team from a match card and it will appear here.</p></div>
          <button type="button" onClick={onBrowseFootball}>Browse football</button>
        </div>}
      </section>
      <p className="menu-demo-note">This demo includes sample football fixtures only. Other sports show an empty board until fixtures are available.</p>
    </div>
  );
}
function HomePage({ fixtures, featuredId, navigate, makeSelection, selection, priceOverrides, onCompetition, onChooseSport, favourites, toggleFavourite, openMarket }: {
  fixtures: Fixture[];
  featuredId?: string;
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  selection: Selection | null;
  priceOverrides: OddsOverrides;
  onCompetition: (competition: string) => void;
  onChooseSport: (sport: string) => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  openMarket: (fixtureId: string, category: string) => void;
}) {
  const schedule = fixtures.filter((fixture) => fixture.id !== featuredId);
  const topCompetitions = [
    { name: 'Premier League' },
    { name: 'UEFA Champions League' },
    { name: 'LaLiga' },
    { name: 'Serie A' },
    { name: 'Bundesliga' },
  ];
  const sports = ['Football', 'Tennis', 'Basketball', 'Cricket'];
  const topMatches = ['real-madrid-arsenal', 'arsenal-brighton', 'man-city-tottenham', 'liverpool-man-utd', 'dortmund-bayern', 'napoli-milan'].flatMap((id) => {
    const fixture = fixtures.find((item) => item.id === id);
    return fixture && !isFinishedFixture(fixture) ? [fixture] : [];
  });
  const liveRows = schedule.filter(isLiveFixture);
  const upcomingRows = schedule.filter((fixture) => fixture.status === 'UPCOMING');
  const finalRows = schedule.filter(isFinishedFixture);
  const hasBothLanes = liveRows.length > 0 && upcomingRows.length > 0;
  return (
    <div className="page-stack home-dashboard fixture-ledger">
      {fixtures.length === 0 && <EmptyState title="No fixtures match that search" copy="Try another club or competition, or clear the search." />}
      <nav className="home-sports-nav" aria-label="Sports">
        {sports.map((sport) => <button key={sport} type="button" className={sport === 'Football' ? 'selected' : ''} aria-pressed={sport === 'Football'} onClick={() => sport === 'Football' ? navigate('football') : onChooseSport(sport)}>{sport}</button>)}
      </nav>
      <section className="top-competitions" aria-label="Top competitions">
        <div className="top-competition-heading"><div><h2>Top competitions</h2><p>Jump to a league board</p></div></div>
        <div className="top-competition-list">{topCompetitions.map((competition) => <button key={competition.name} onClick={() => onCompetition(competition.name)}><CompetitionLogo competition={competition.name} /><span>{competition.name === 'UEFA Champions League' ? 'Champions League' : competition.name}</span><Icon name="arrow" size={14} /></button>)}</div>
      </section>
      {topMatches.length > 0 && <TopMatchesCarousel>{topMatches.map((fixture) => <HomeFixtureCard key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} selection={selection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} openMarket={openMarket} />)}</TopMatchesCarousel>}
      <div className="fieldside-schedule-heading"><div><h2>Live now &amp; starting soon</h2><p>Scores, kick-off times and prices</p></div><button aria-label="View full board" onClick={() => navigate('live')}><span className="fieldside-board-label">View full board</span><Icon name="arrow" size={14} /></button></div>
      <div className={`home-fixture-lanes${hasBothLanes ? '' : ' is-single'}`}>
        {[
          { id: 'live', label: 'Live now', rows: liveRows },
          { id: 'upcoming', label: 'Starting soon', rows: upcomingRows },
        ].map((lane) => lane.rows.length > 0 && <section className={`home-fixture-lane home-fixture-lane--${lane.id}`} key={lane.id}>
          <header className="home-fixture-lane-heading">
            <div className="home-fixture-lane-title"><span className="home-fixture-lane-mark" aria-hidden="true" /><h3>{lane.label}</h3></div>
            <span className="home-fixture-lane-count">{lane.rows.length} {lane.rows.length === 1 ? 'match' : 'matches'}</span>
          </header>
          <div className="home-fixture-list">{lane.rows.map((fixture) => <HomeFixtureCard key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} selection={selection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} openMarket={openMarket} />)}</div>
        </section>)}
      </div>
      {finalRows.length > 0 && <section className="ledger-lane fieldside-lane home-final-samples">
        <header className="ledger-lane-heading"><span className="lane-status-mark" aria-hidden="true" /><div><h3>Final results</h3></div><span className="ledger-lane-count">{finalRows.length} {finalRows.length === 1 ? 'match' : 'matches'}</span></header>
        <div className="home-final-list">{finalRows.map((fixture) => <HomeFixtureCard key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} selection={selection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} openMarket={openMarket} />)}</div>
      </section>}
      <div className="info-band"><span className="info-mark">i</span><span>Club names and crests are authentic; fixtures, scores, odds, stakes and returns are examples.</span><Badge variant="warning">Demo board</Badge></div>
    </div>
  );
}

function HomeFixtureCard({ fixture, navigate, makeSelection, selection, priceOverrides, favourites, toggleFavourite, openMarket, mobileScoreboard = false }: {
  fixture: Fixture;
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  selection: Selection | null;
  priceOverrides: OddsOverrides;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  openMarket: (fixtureId: string, category: string) => void;
  mobileScoreboard?: boolean;
}) {
  const [favouritePressCount, setFavouritePressCount] = useState(0);
  const outcomes = [fixture.home, 'Draw', fixture.away];
  const isFinished = isFinishedFixture(fixture);
  const isActivelyLive = isActivelyLiveFixture(fixture);
  const isHalfTime = fixture.status === 'LIVE' && fixture.phase === 'HT';
  const favourite = favourites.includes(fixture.home);
  const kickoff = `${fixture.date === 'TOMORROW' ? 'Tomorrow' : fixture.date === 'TODAY' ? 'Today' : fixture.date ?? 'Today'} · ${fixture.time}`;

  return (
    <article className={`match-fixture-card${fixture.suspended ? ' is-suspended' : ''}`} data-fixture-id={fixture.id} data-phase={fixture.phase ?? fixture.status}>
      <div className="match-card-header">
        <button className="match-card-competition" type="button" onClick={() => navigate('match', fixture.id)} aria-label={`Open ${fixture.home} v ${fixture.away} match centre`}>
          <CompetitionLogo competition={fixture.competition} /><span>{fixture.competition}</span><i aria-hidden="true">·</i><small>{fixture.round}</small>
        </button>
        <button className={`match-card-favourite${favourite ? ' selected' : ''}`} type="button" aria-pressed={favourite} aria-label={`Favourite ${fixture.home}`} title={favourite ? `Remove ${fixture.home} from favourites` : `Add ${fixture.home} to favourites`} onClick={(event) => { event.stopPropagation(); setFavouritePressCount((count) => count + 1); toggleFavourite(fixture.home); }}>
          <span key={favouritePressCount} className={`favourite-star${favouritePressCount ? ' is-animated' : ''}`} aria-hidden="true"><Icon name="star" size={16} /></span>
        </button>
      </div>
      <div className={`match-card-status${isActivelyLive ? ' is-live' : isHalfTime ? ' is-halftime' : isFinished ? ' is-fulltime' : ' is-upcoming'}`}>
        {isActivelyLive ? <><div className="match-card-clock"><strong>{fixture.time}</strong><span aria-hidden="true">·</span><span>{fixturePeriodText(fixture)}</span></div><MatchLiveSignal /></> : isHalfTime ? <><span className="match-card-period-tag is-halftime" aria-label="HT, half-time">HT</span><span>Half-time</span></> : isFinished ? <><span className="match-card-period-tag is-fulltime" aria-label="FT, full time">FT</span><span>Full time</span></> : <><strong className="match-card-kickoff">{kickoff}</strong><span className="match-card-period-tag is-upcoming">UPCOMING</span></>}
      </div>
      <button className="match-card-teams" type="button" onClick={() => navigate('match', fixture.id)} aria-label={`Open ${fixture.home} ${fixture.homeScore ?? ''} v ${fixture.away} ${fixture.awayScore ?? ''}`}>
        <span className="match-card-team-list">
          {[fixture.home, fixture.away].map((club, index) => <span className="match-card-team" key={club}>
            <ClubCrest club={club} />
            <strong>{club}</strong>
            <b>{index === 0 ? fixture.homeScore ?? '–' : fixture.awayScore ?? '–'}</b>
          </span>)}
        </span>
        {mobileScoreboard && <span className="match-card-scoreboard-mobile" aria-hidden="true">
          <span className="match-card-score-side match-card-score-side--home"><ClubCrest club={fixture.home} /><strong>{fixture.home}</strong></span>
          <span className={`match-card-score-column${fixture.homeScore === undefined || fixture.awayScore === undefined ? ' is-pending' : ''}`}>{fixture.homeScore !== undefined && fixture.awayScore !== undefined ? <><b>{fixture.homeScore}</b><i>:</i><b>{fixture.awayScore}</b></> : 'VS'}</span>
          <span className="match-card-score-side match-card-score-side--away"><strong>{fixture.away}</strong><ClubCrest club={fixture.away} /></span>
        </span>}
      </button>
      <section className="match-card-market" aria-label="1X2 market">
        <div className="match-card-market-heading"><strong>1X2</strong></div>
        <div className="match-card-market-actions">
          {isFinished ? <div className="match-card-lock-panel is-closed" role="status"><Icon name="lock" size={15} /><strong>Market closed</strong></div> : fixture.suspended ? <div className="match-card-lock-panel is-suspended" role="status" aria-label="1X2 market suspended"><Icon name="lock" size={15} /><strong>Suspended</strong></div> : <div className="match-card-odds" aria-label="Decimal 1X2 odds">
            {fixture.odds.map((_, index) => {
              const odd = getMarketOdds(fixture, 'Match result', index, priceOverrides);
              const selected = selection?.fixtureId === fixture.id && selection.market === 'Match result' && selection.label === outcomes[index];
              return <button key={index} type="button" className={`match-card-odd${selected ? ' is-selected' : ''}`} onClick={() => makeSelection(fixture, index, 'Match result')} aria-pressed={selected} aria-label={`Select ${outcomes[index]} at ${odd.toFixed(2)}${selected ? ', selected' : ''}`}>
                <span>{['1', 'Draw', '2'][index]}</span><strong>{odd.toFixed(2)}</strong>
              </button>;
            })}
          </div>}
          {!isFinished && <button className="match-card-more-markets" type="button" onClick={() => openMarket(fixture.id, 'Handicaps')} aria-label={`More markets for ${fixture.home} v ${fixture.away}: open Handicaps`}><span>More markets</span><b>+{fixture.extraMarkets}</b><Icon name="chevron" size={14} /></button>}
        </div>
      </section>
    </article>
  );
}

function LivePage({ fixtures: rows, navigate, makeSelection, priceOverrides, favourites, toggleFavourite, sportFilter, setSportFilter, competitionFilter, setCompetitionFilter, searchQuery, selection, openMarket }: {
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  priceOverrides: OddsOverrides;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  sportFilter: string;
  setSportFilter: (value: string) => void;
  competitionFilter: string;
  setCompetitionFilter: (value: string) => void;
  searchQuery: string;
  selection: Selection | null;
  openMarket: (fixtureId: string, category: string) => void;
}) {
  const sports = ['All sports', 'Football', 'Tennis', 'Basketball', 'Cricket'];
  const competitions = [...new Set(fixtures.map((fixture) => fixture.competition))];
  const bySport = sportFilter === 'All sports' || sportFilter === 'Football' ? rows : [];
  const scoped = competitionFilter === 'All competitions' ? bySport : bySport.filter((fixture) => fixture.competition === competitionFilter);
  const liveRows = scoped.filter(isLiveFixture);
  const activeLiveCount = scoped.filter(isActivelyLiveFixture).length;
  const upcomingRows = scoped.filter((fixture) => fixture.status === 'UPCOMING');
  const liveGroups = groupByCompetition(liveRows);
  const upcomingGroups = groupByCompetition(upcomingRows);
  return (
    <div className="page-stack">
      <section className="live-filter-panel" aria-label="Live board filters">
        <div className="live-filter-heading"><span className="eyebrow">Board filters</span><strong>Choose a sport and competition</strong></div>
        <div className="live-sport-tabs" role="tablist" aria-label="Filter by sport">
          {sports.map((sport) => <button key={sport} type="button" className={`live-sport-tab ${sportFilter === sport ? 'active' : ''}`} aria-pressed={sportFilter === sport} onClick={() => setSportFilter(sport)}>{sport === 'All sports' ? 'All' : sport === 'Football' ? 'Soccer' : sport}</button>)}
        </div>
        <label className="live-filter-select"><span>Competition</span><select aria-label="Filter live board by competition" value={competitionFilter} onChange={(event) => setCompetitionFilter(event.currentTarget.value)}><option>All competitions</option>{competitions.map((competition) => <option key={competition}>{competition}</option>)}</select></label>
      </section>
      <div className="listing-toolbar live-summary-toolbar"><div className="listing-filter-tabs"><button className={liveRows.length ? 'active' : ''}>Live now <b>{String(liveRows.length).padStart(2, '0')}</b>{activeLiveCount > 0 && <span className="live-board-signal" aria-label={`${activeLiveCount} match currently in play`}><MatchLiveSignal /></span>}</button>{!liveRows.length && upcomingRows.length > 0 && <span className="starting-soon-indicator">Starting soon <b>{String(upcomingRows.length).padStart(2, '0')}</b></span>}</div><div className="filter-note">Sample scores · no live feed</div></div>
      {liveGroups.length > 0 ? (
        <div key={`${sportFilter}-${competitionFilter}`} className="live-result-surface">
          <div className="desktop-competition-list">
            {liveGroups.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} selection={selection} openMarket={openMarket} mobileScoreboard />)}
          </div>
        </div>
      ) : upcomingGroups.length > 0 ? (
        <section key={`${sportFilter}-${competitionFilter}`} className="starting-soon-block live-result-surface">
          <header><span className="eyebrow">No match in play</span><h2>Starting soon</h2><p>Upcoming fixtures match these filters.</p></header>
          <div className="desktop-competition-list">
            {upcomingGroups.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} selection={selection} openMarket={openMarket} mobileScoreboard />)}
          </div>
        </section>
      ) : <EmptyState title={searchQuery.trim() ? 'No fixtures match that search' : `No live or upcoming ${sportFilter === 'All sports' ? '' : sportFilter.toLowerCase() + ' '} fixtures`} copy={searchQuery.trim() ? 'Try another team, competition, player label or market.' : 'Try another sport or competition. This board contains football fixtures only.'} />}
      <div className="info-band"><span className="info-mark">i</span><span>Scores, clocks and odds are examples, not a live feed.</span><Badge variant="warning">Demo board</Badge></div>
    </div>
  );
}

function FootballPage({ fixtures: rows, navigate, makeSelection, priceOverrides, sportFilter, setSportFilter, footballScope, setFootballScope, favourites, toggleFavourite, selection, openMarket }: {
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  priceOverrides: OddsOverrides;
  sportFilter: string;
  setSportFilter: (value: string) => void;
  footballScope: 'live-upcoming' | 'all';
  setFootballScope: (value: 'live-upcoming' | 'all') => void;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  selection: Selection | null;
  openMarket: (fixtureId: string, category: string) => void;
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
  const liveUpcoming = filtered.filter((fixture) => isLiveFixture(fixture) || fixture.status === 'UPCOMING');
  const visibleFixtures = footballScope === 'live-upcoming' ? liveUpcoming : filtered;
  const grouped = groupByCompetition(visibleFixtures);
  return (
    <div className="page-stack">
      <div className="football-toolbar">
        <div className="league-select-label">Competition</div>
        <div className="league-chips">{leagues.map((league) => <button key={league.value} aria-pressed={sportFilter === league.value || (sportFilter === 'All sports' && league.value === 'All football')} className={`league-chip ${sportFilter === league.value || (sportFilter === 'All sports' && league.value === 'All football') ? 'active' : ''}`} onClick={() => setSportFilter(league.value)}><CompetitionLogo competition={league.value} />{league.label}</button>)}</div>
        <span className="fixtures-total">{visibleFixtures.length} fixtures</span>
      </div>
      <div className="listing-toolbar football-scope-toolbar"><div className="listing-filter-tabs"><button className={footballScope === 'live-upcoming' ? 'active' : ''} onClick={() => setFootballScope('live-upcoming')}>Live &amp; upcoming <b>{liveUpcoming.length}</b></button><button className={footballScope === 'all' ? 'active' : ''} onClick={() => setFootballScope('all')}>All football <b>{filtered.length}</b></button></div><div className="filter-note">Match result <span>·</span> singles</div></div>
      {sportFilter === 'Basketball' || sportFilter === 'Tennis' ? (
        <div className="desktop-competition-list"><EmptyState title={`No ${sportFilter.toLowerCase()} samples in this build`} copy="This contest prototype focuses on fictional football fixtures." /></div>
      ) : grouped.length ? (
        <><div className="desktop-competition-list">{grouped.map(([competition, group]) => <CompetitionBlock key={competition} competition={competition} fixtures={group} navigate={navigate} makeSelection={makeSelection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} selection={selection} openMarket={openMarket} />)}</div><div className="info-band"><span className="info-mark">i</span><span>Club names and crests are real. Events, scores, dates and odds are fixed samples.</span><Badge variant="warning">Sample data</Badge></div></>
      ) : <div className="desktop-competition-list"><EmptyState title="No matches here yet" copy="Try another competition or clear your search." /></div>}
      <button className="text-link back-home" onClick={() => navigate('home')}>Back to sports home <Icon name="arrow" size={15} /></button>
    </div>
  );
}

function groupByCompetition(rows: Fixture[]): [string, Fixture[]][] {
  const names = [...new Set(rows.map((fixture) => fixture.competition))];
  return names.map((name) => [name, rows.filter((fixture) => fixture.competition === name)]);
}

function CompetitionBlock({ competition, fixtures: rows, navigate, makeSelection, priceOverrides, favourites, toggleFavourite, selection, openMarket, mobileScoreboard = false }: {
  competition: string;
  fixtures: Fixture[];
  navigate: Navigate;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  priceOverrides: OddsOverrides;
  favourites: string[];
  toggleFavourite: (item: string) => void;
  selection: Selection | null;
  openMarket: (fixtureId: string, category: string) => void;
  mobileScoreboard?: boolean;
}) {
  return (
    <section className="match-card-group" data-competition={competition} aria-label={`${competition} fixtures`}>
      {rows.map((fixture) => <HomeFixtureCard key={fixture.id} fixture={fixture} navigate={navigate} makeSelection={makeSelection} selection={selection} priceOverrides={priceOverrides} favourites={favourites} toggleFavourite={toggleFavourite} openMarket={openMarket} mobileScoreboard={mobileScoreboard} />)}
    </section>
  );
}

function MatchPage({ fixture, fixtures: fixtureOptions, priceOverrides, marketSuspended, selection, makeSelection, navigate, marketCategory, setMarketCategory, marketQuery, setMarketQuery, collapsedMarkets, toggleMarket, following, toggleFollow }: {
  fixture: Fixture;
  fixtures: Fixture[];
  priceOverrides: OddsOverrides;
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
  const isFinished = isFinishedFixture(fixture);
  const isLive = isLiveFixture(fixture);
  const marketUnavailable = isFinished || fixture.suspended === true || marketSuspended;
  const unavailableLabel = isFinished ? 'Market closed' : 'Market suspended';
  const [fixtureDetailsOpen, setFixtureDetailsOpen] = useState(false);
  return (
    <div className="page-stack match-page-stack">
      <div className="match-toolbar"><button className="match-back" onClick={() => navigate('football')}>‹ <span>Football</span></button><span className="match-toolbar-divider">/</span><span>{fixture.competition}</span><span className="match-toolbar-divider">/</span><select className="fixture-picker" aria-label="Select sample fixture" value={fixture.id} onChange={(event) => navigate('match', event.currentTarget.value)}>{fixtureOptions.map((option) => <option key={option.id} value={option.id}>{option.home} v {option.away}</option>)}</select><span className="match-toolbar-spacer" /><Badge variant="warning">Singles only</Badge></div>
      <Card className={`match-hero ${fixture.id === 'real-madrid-arsenal' ? 'has-pitch-illustration' : ''}`} size="default">
        <div className="match-hero-top"><span className="competition-label"><CompetitionLogo competition={fixture.competition} className="match-competition-logo" /><span className="match-competition-name">{fixture.competition}</span><span className="match-round-name"><span className="mini-divider">/</span>{fixture.round}</span></span><div className="match-hero-actions">{isLive || isFinished ? <span className="match-status-line"><FixtureStatusBadge fixture={fixture} /></span> : null}</div></div>
        <div className="match-hero-teams">
          <div className="match-team"><ClubCrest club={fixture.home} className="match-club-crest" /><strong>{fixture.home}</strong><small>Home side</small><button className={`follow-chip ${following.includes(fixture.home) ? 'following' : ''}`} onClick={() => toggleFollow(fixture.home)}>{following.includes(fixture.home) ? <><Icon name="star" size={14} /> Following</> : <><Icon name="plus" size={14} /> Follow</>}</button></div>
          <div className="match-score"><span>{fixture.homeScore !== undefined ? <>{fixture.homeScore}<i>:</i>{fixture.awayScore}</> : 'VS'}</span>{isLive ? <span className="match-score-phase">{fixture.phase === 'HT' ? 'Half-time' : `${fixture.time} · ${fixturePeriodText(fixture)}`}</span> : isFinished ? <span className="match-score-phase">FT · Full time</span> : <Badge variant="secondary" className="upcoming-tag">{`${fixture.date ?? 'UPCOMING'} · ${fixture.time}`}</Badge>}<small>{isLive ? 'Simulated score · 90 min' : isFinished ? 'Final sample result' : 'Simulated kick-off'}</small></div>
          <div className="match-team align-right"><ClubCrest club={fixture.away} className="match-club-crest" /><strong>{fixture.away}</strong><small>Away side</small><button className={`follow-chip ${following.includes(fixture.away) ? 'following' : ''}`} onClick={() => toggleFollow(fixture.away)}>{following.includes(fixture.away) ? <><Icon name="star" size={14} /> Following</> : <><Icon name="plus" size={14} /> Follow</>}</button></div>
        </div>
        <div className="match-hero-bottom"><span>{fixture.id === 'real-madrid-arsenal' ? 'Illustrated pitch · simulated fixture' : 'Simulated fixture · no live feed'}</span><span>{fixture.competition} · {fixture.round}</span></div>
      </Card>
      <section className="match-fixture-details" aria-label="Fixture details">
        <div className="match-details-heading"><div><span>Event details</span><strong>{fixture.competition} · {fixture.round}</strong></div><button aria-expanded={fixtureDetailsOpen} onClick={() => setFixtureDetailsOpen((open) => !open)}>{fixtureDetailsOpen ? 'Hide details' : 'Show details'} <Icon name="chevron" size={14} /></button></div>
        {fixtureDetailsOpen && <div className="match-details-grid"><div><small>Event</small><strong>{fixture.home} v {fixture.away}</strong></div><div><small>Format</small><strong>Football · Match result (1X2)</strong></div><div><small>Data notice</small><strong>Fictional event · fixed sample values</strong></div><div className="match-event-time"><small>{isLive ? fixture.phase === 'HT' ? 'Match phase' : 'Sample clock' : isFinished ? 'Event status' : 'Kick-off'}</small><strong>{isLive ? fixture.phase === 'HT' ? 'Half-time · simulated' : `${fixture.time} · ${fixturePeriodText(fixture)} · simulated` : isFinished ? 'FT · Full time sample' : `${fixture.date ?? 'Today'} · ${fixture.time}`}</strong></div></div>}
      </section>
      {marketUnavailable && <div className={`match-market-alert ${isFinished ? 'closed' : ''}`} role="status"><Icon name="lock" size={16} /><div><strong>{unavailableLabel}</strong><span>{isFinished ? 'This sample event has ended; its prices cannot be selected.' : 'Prices for this sample event are temporarily unavailable.'}</span></div></div>}
      <div className="market-search-row"><div className="market-search"><Icon name="search" size={15} /><Input aria-label="Search markets or players" placeholder="Search markets or players" value={marketQuery} onChange={(event) => setMarketQuery(event.currentTarget.value)} size="sm" />{marketQuery && <button type="button" className="market-search-clear" onClick={() => setMarketQuery('')} aria-label="Clear market search"><Icon name="close" size={14} /></button>}</div><span className="market-search-note"><Icon name="ticket" size={13} /> One selection at a time</span></div>
      <div className="market-toolbar" id="match-market-directory"><div><p className="eyebrow">Market directory</p><span className="market-count-line">{shown.length} of {markets.length} sample markets · 6 groups</span></div><div className="market-tabs" role="tablist" aria-label="Market categories">{categories.map((category) => <button key={category.name} className={`market-tab ${marketCategory === category.name ? 'selected' : ''}`} onClick={() => { setMarketCategory(category.name); setMarketQuery(''); }} role="tab" aria-selected={marketCategory === category.name}>{category.name} <span>{String(category.count).padStart(2, '0')}</span></button>)}</div></div>
      <div className="market-directory">{shown.map((market) => <MarketSection key={market.title} title={market.title} sub={market.sub} count={market.options.length} options={market.options} odds={market.odds} fixture={fixture} market={market.title} makeSelection={makeSelection} selected={selection} priceOverrides={priceOverrides} collapsed={collapsedMarkets.includes(market.title)} toggle={() => toggleMarket(market.title)} disabled={marketUnavailable} />)}</div>
      {!shown.length && <EmptyState title="No markets match that search" copy="Try a shorter term or clear the sample-market search." />}
      <div className="info-band"><span className="info-mark">i</span><span>Real club identities; simulated event details, prices and player labels. No real player data, live feeds or money.</span><Badge variant="warning">Simulation</Badge></div>
    </div>
  );
}

function MarketSection({ title, sub, count, options, odds, fixture, market = 'Match result', makeSelection, selected, priceOverrides, collapsed, toggle, disabled }: {
  title: string;
  sub: string;
  count: number;
  options: string[];
  odds: number[];
  fixture: Fixture;
  market?: string;
  makeSelection: (fixture: Fixture, pickIndex: number, market?: string) => void;
  selected: Selection | null;
  priceOverrides: OddsOverrides;
  collapsed: boolean;
  toggle: () => void;
  disabled: boolean;
}) {
  return (
    <Card className={`market-card ${title === 'Double chance' ? 'market-card--double-chance' : ''} ${collapsed ? 'is-collapsed' : ''}`} size="sm">
      <button className="market-card-heading" onClick={toggle} aria-expanded={!collapsed}>
        <span><strong>{title}</strong><small>{sub}</small></span><span className="market-card-heading-right"><span className="market-count">{String(count).padStart(2, '0')} outcomes</span><span className="market-collapse-icon">{collapsed ? '+' : '−'}</span></span>
      </button>
      {!collapsed && <div className={`market-outcomes ${options.length === 2 ? 'two-outcomes' : ''} ${options.length === 3 ? 'three-outcomes' : ''}`}>
        {options.map((label, i) => <OddsButton key={label} label={label} odds={getMarketOdds(fixture, market, i, priceOverrides)} selected={selected?.fixtureId === fixture.id && selected.market === market && selected.label === label} disabled={disabled} onClick={() => makeSelection(fixture, i, market)} />)}
      </div>}
    </Card>
  );
}

function ActivityPage({ activityTab, setActivityTab, betFilter, setBetFilter, selection, openCount, stake, setStake, slipMessage, pendingOdds, marketSuspended, estimatedReturn, bets, placeDemoBet, clearSelection, acceptNewOdds, cashOutBet, navigate }: {
  activityTab: ActivityTab;
  setActivityTab: (tab: ActivityTab) => void;
  betFilter: BetStatus;
  setBetFilter: (status: BetStatus) => void;
  selection: Selection | null;
  openCount: number;
  stake: string;
  setStake: (value: string) => void;
  slipMessage: Notice | null;
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
        <button className={`activity-tab ${activityTab === 'bets' ? 'active' : ''}`} onClick={() => setActivityTab('bets')} role="tab" aria-label={`My bets, ${openCount} open`} aria-selected={activityTab === 'bets'}><Icon name="clock" size={16} /> My bets <span aria-label={`${openCount} open bets`}>{openCount.toString().padStart(2, '0')}</span></button>
      </div>
      {activityTab === 'slip' ? (
        <div className="activity-content-grid activity-content-grid--single">
          <div className="activity-main-col">
            <h2 className="activity-section-title">Bet slip</h2>
            {selection ? <SelectionCard variant="full" idPrefix="activity" selection={selection} stake={stake} setStake={setStake} slipMessage={slipMessage} pendingOdds={pendingOdds} marketSuspended={marketSuspended} estimatedReturn={estimatedReturn} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} placeDemoBet={placeDemoBet} /> : (
              <Card className="empty-slip-card" size="default"><h3>Choose one price</h3><p>Start a single demo slip from any match.</p><Button className="button-lime" onClick={() => navigate('home')}>Browse matches <Icon name="arrow" size={15} /></Button></Card>
            )}
          </div>
        </div>
      ) : <MyBetsView bets={bets} filter={betFilter} setFilter={setBetFilter} cashOutBet={cashOutBet} />}
    </div>
  );
}

function SelectionCard({ variant, idPrefix, selection, stake, setStake, slipMessage, pendingOdds, marketSuspended, estimatedReturn, clearSelection, acceptNewOdds, placeDemoBet }: {
  variant: 'full' | 'compact';
  idPrefix: string;
  selection: Selection;
  stake: string;
  setStake: (value: string) => void;
  slipMessage: Notice | null;
  pendingOdds: number | null;
  marketSuspended: boolean;
  estimatedReturn: number;
  clearSelection: () => void;
  acceptNewOdds: () => void;
  placeDemoBet: () => void;
}) {
  const disabled = pendingOdds !== null || marketSuspended || !isValidStake(stake);
  const stakeId = `${idPrefix}-stake`;
  const hintId = `${idPrefix}-stake-hint`;
  const invalidStake = !isValidStake(stake);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Card className={`selection-card ${variant === 'compact' ? 'selection-card--compact' : ''}`} size="default">
      <div className="selection-card-top">
        <div className="selection-competition-group"><p className="selection-competition"><CompetitionLogo competition={selection.competition} />{selection.competition} <span>·</span> {selection.market}</p></div>
        <Button variant="ghost" size="sm" className="remove-selection" onClick={clearSelection} aria-label="Clear selection">Clear</Button>
      </div>
      <div className="selection-pick">
        <div><strong>{selection.label}</strong><small><ClubPair fixtureId={selection.fixtureId} />{selection.fixture}</small></div>
        <div className="pick-odds"><span>Odds</span><RollingNumber duration={reducedMotion ? 0 : 320} value={selection.odds} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="rolling-odds" /></div>
      </div>
      {pendingOdds !== null && <div className="state-banner state-warning"><span>↗</span><div><strong>Odds have changed</strong><small>{selection.odds.toFixed(2)} → {pendingOdds.toFixed(2)} · accept to keep going</small></div><Button size="sm" className="accept-odds-button" onClick={acceptNewOdds}>Accept {pendingOdds.toFixed(2)}</Button></div>}
      {marketSuspended && <div className="state-banner state-warning"><Icon name="lock" size={17} /><div><strong>Market suspended</strong><small>This sample selection is temporarily unavailable.</small></div></div>}
      <label className="stake-label" htmlFor={stakeId}>Stake <span>USDT</span></label>
      <div className="stake-input-row"><span className="stake-currency">USDT</span><Input id={stakeId} type="number" min="1" step="0.01" value={stake} onChange={(event) => setStake(event.currentTarget.value)} className="stake-input" aria-label="USDT stake" aria-invalid={invalidStake} aria-describedby={invalidStake ? hintId : undefined} /></div>
      <p id={hintId} className={`stake-hint ${invalidStake ? 'stake-error' : ''}`} aria-live="polite">{invalidStake ? 'Enter 1.00 or more, up to 2 decimals.' : 'Minimum 1.00'}</p>
      <div className="return-line"><span>Possible return</span><strong><RollingNumber duration={reducedMotion ? 0 : 320} value={estimatedReturn} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="rolling-return" /> <small>USDT</small></strong></div>
      {slipMessage && <div className={`placement-feedback placement-feedback--${slipMessage.type}`} role={slipMessage.type === 'error' ? 'alert' : 'status'} aria-live={slipMessage.type === 'error' ? 'assertive' : 'polite'}>{slipMessage.text}</div>}
      <Button className="place-button" disabled={disabled} onClick={placeDemoBet}>Place demo bet</Button>
      <p className="slip-disclaimer">Single pick · no real money</p>
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
    if (!isWithinBetDateRange(bet.placedAtMs, dateRange)) return false;
    const normalized = search.trim().toLowerCase();
    return !normalized || `${bet.fixture} ${bet.competition} ${bet.selection} ${bet.market}`.toLowerCase().includes(normalized);
  });
  const openCount = bets.filter((bet) => bet.status === 'open').length;
  const settledCount = bets.filter((bet) => bet.status === 'settled').length;
  return (
    <div className="mybets-page">
      <div className="mybets-summary-row"><div className="mybets-summary-heading"><h2 className="activity-section-title">Bet history</h2><p>Your local record of single picks</p></div><div className="mybets-summary-cards"><span><b>{String(openCount).padStart(2, '0')}</b> Open</span><span><b>{String(settledCount).padStart(2, '0')}</b> Settled</span></div></div>
      <div className="mybets-controls"><div className="bet-filter-tabs" role="tablist" aria-label="Filter bet history"><button className={filter === 'open' ? 'active' : ''} role="tab" aria-selected={filter === 'open'} onClick={() => setFilter('open')}>Open <span>{openCount}</span></button><button className={filter === 'settled' ? 'active' : ''} role="tab" aria-selected={filter === 'settled'} onClick={() => setFilter('settled')}>Settled <span>{settledCount}</span></button></div><div className="mybets-filter-controls"><label className="date-filter"><Icon name="clock" size={14} /><select aria-label="Filter by date" value={dateRange} onChange={(event) => setDateRange(event.currentTarget.value)}><option>All time</option><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select></label><label className="date-filter sport-filter"><select aria-label="Filter by sport" value={sport} onChange={(event) => setSport(event.currentTarget.value)}><option>All sports</option><option>Football</option></select><Icon name="chevron" size={14} /></label><div className="mybets-search"><Icon name="search" size={14} /><Input aria-label="Search bets" placeholder="Search bets" value={search} onChange={(event) => setSearch(event.currentTarget.value)} size="sm" /></div></div></div>
      {filteredBets.length ? (
        <div className="mybets-list">
          <div className="bet-table-header"><span>Placed</span><span>Bet / event</span><span>Odds</span><span>Stake</span><span>Returns</span><span>Result</span></div>
          {filteredBets.map((bet) => <BetRecord key={bet.id} bet={bet} cashOutBet={cashOutBet} />)}
        </div>
      ) : <EmptyState title={`No ${filter} bets match these filters`} copy="Change the time range or search, or choose a price from the board." />}
      <div className="history-foot"><span className="info-mark">i</span><span>This record stays in the prototype and is not linked to an account or real bets.</span></div>
    </div>
  );
}

function BetRecord({ bet, cashOutBet }: { bet: DemoBet; cashOutBet: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className={`bet-record ${expanded ? 'expanded' : ''}`} size="sm">
      <button className="bet-table-row" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="bet-placed">{formatBetPlacedAt(bet.placedAtMs)}<small>Ref · {bet.id.slice(-5).toUpperCase()}</small></span>
        <span className="bet-row-event"><strong>{bet.selection}</strong><small>{bet.fixture}</small><em><span>{bet.competition} · {bet.market}</span></em></span>
        <strong className="bet-row-number" data-label="Odds">{bet.odds.toFixed(2)}</strong>
        <strong className="bet-row-number" data-label="Stake">{bet.stake.toFixed(2)} <i>USDT</i></strong>
        <strong className="bet-row-number return-number" data-label="Return">{bet.returns.toFixed(2)} <i>USDT</i></strong>
        <span className="bet-result-cell">{bet.status === 'open' ? <Badge variant="info" dot>Open</Badge> : <Badge variant="success">Settled</Badge>}<Icon name="chevron" size={14} /></span>
      </button>
      {expanded && <div className="bet-detail-panel">
        <div><small>Fixture</small><strong>{bet.fixture}</strong></div><div><small>Competition</small><strong>{bet.competition}</strong></div><div><small>Selection</small><strong>{bet.selection} · {bet.market}</strong></div>
        <div><small>Accepted odds</small><strong>{bet.odds.toFixed(2)}</strong></div><div><small>Stake</small><strong>{formatDemoUSDT(bet.stake)}</strong></div><div><small>Est. return</small><strong>{formatDemoUSDT(bet.returns)}</strong></div>
        <div className="bet-lifecycle"><div className="bet-step complete"><span>01</span><strong>Bet placed</strong><small>{formatBetPlacedAt(bet.placedAtMs)}</small></div><div className={`bet-step ${bet.status === 'settled' ? 'complete' : 'pending'}`}><span>{bet.status === 'settled' ? '02' : '…'}</span><strong>{bet.status === 'settled' ? 'Settled' : 'Awaiting settlement'}</strong><small>{bet.status === 'settled' ? (bet.result ?? 'Final result') : 'No live event feed'}</small></div></div>
        {bet.result && <span className={`result-note ${bet.result.includes('Won') || bet.result.includes('Cashed') ? 'result-won' : ''}`}>{bet.result}</span>}
        {bet.status === 'open' && <span className="cashout-summary">Cash-out value <b>{formatDemoUSDT(bet.cashout ?? bet.returns)}</b><Button variant="outline" size="sm" className="cashout-button" onClick={(event) => { event.stopPropagation(); cashOutBet(bet.id); }}>Cash out <Icon name="arrow" size={13} /></Button></span>}
      </div>}
    </Card>
  );
}

function SlipPanel({ idPrefix, selection, stake, setStake, slipMessage, pendingOdds, marketSuspended, estimatedReturn, clearSelection, acceptNewOdds, placeDemoBet, navigate }: {
  idPrefix: string;
  selection: Selection | null;
  stake: string;
  setStake: (value: string) => void;
  slipMessage: Notice | null;
  pendingOdds: number | null;
  marketSuspended: boolean;
  estimatedReturn: number;
  clearSelection: () => void;
  acceptNewOdds: () => void;
  placeDemoBet: () => void;
  navigate: Navigate;
}) {
  if (selection) return <SelectionCard variant="compact" idPrefix={idPrefix} selection={selection} stake={stake} setStake={setStake} slipMessage={slipMessage} pendingOdds={pendingOdds} marketSuspended={marketSuspended} estimatedReturn={estimatedReturn} clearSelection={clearSelection} acceptNewOdds={acceptNewOdds} placeDemoBet={placeDemoBet} />;
  if (!selection) return (
    <div className="side-empty-slip side-empty-slip--simple">
      <strong>Your bet slip is empty</strong>
      <p>Choose one price from a match to start.</p>
      <Button variant="outline" size="sm" className="side-add-button" onClick={() => navigate('home')}>Browse matches <Icon name="arrow" size={13} /></Button>
    </div>
  );
}

function CompactBets({ bets, cashOutBet, openFullBets }: { bets: DemoBet[]; cashOutBet: (id: string) => void; openFullBets: () => void }) {
  const open = bets.filter((bet) => bet.status === 'open');
  return (
    <div className="compact-bets">
      <div className="compact-summary"><span>{open.length} OPEN</span><span>{bets.length - open.length} SETTLED</span></div>
      {open.slice(0, 2).map((bet) => <div className="compact-bet" key={bet.id}><div className="compact-bet-top"><Badge variant="info" dot>Open</Badge><strong>{bet.odds.toFixed(2)}</strong></div><b>{bet.selection}</b><small>{bet.fixture}</small><div className="compact-bet-return">{bet.stake.toFixed(2)} → <strong>{formatDemoUSDT(bet.cashout ?? bet.returns)}</strong></div><Button variant="outline" size="sm" className="compact-cashout" onClick={() => cashOutBet(bet.id)}>Cash out</Button></div>)}
      {open.length === 0 && <p className="compact-empty">No open sample bets right now.</p>}
      <Button variant="ghost" size="sm" className="view-history-button" onClick={openFullBets}>View My Bets <Icon name="arrow" size={13} /></Button>
    </div>
  );
}

function DemoLab({ selection, canPlaceDemoBet, pendingOdds, marketSuspended, fixtureLabel, failNext, openCount, simulateOddsChange, toggleSuspended, setFailNext, placeDemoBet, settleOpenBet, cancelFail }: {
  selection: Selection | null;
  canPlaceDemoBet: boolean;
  pendingOdds: number | null;
  marketSuspended: boolean;
  fixtureLabel: string;
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
        <button className="demo-control" onClick={toggleSuspended}><span><strong>{marketSuspended ? 'Resume market' : 'Suspend market'}</strong><small>{fixtureLabel} · this fixture only</small></span><span className="control-chevron">{marketSuspended ? '↻' : '⊘'}</span></button>
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
