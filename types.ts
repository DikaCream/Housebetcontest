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

export type Selection = {
  fixtureId: string;
  fixture: string;
  competition: string;
  market: string;
  label: string;
  odds: number;
};
