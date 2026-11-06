import React from 'react';

type MarkShape = 'flag' | 'globe';

type CompetitionLogoProps = {
  competition: string;
  className?: string;
};

const competitionMarks: Record<string, { file: string; shape: MarkShape }> = {
  'Premier League': { file: 'england.svg', shape: 'flag' },
  'UEFA Champions League': { file: 'globe.svg', shape: 'globe' },
  LaLiga: { file: 'spain.svg', shape: 'flag' },
  'Serie A': { file: 'italy.svg', shape: 'flag' },
  Bundesliga: { file: 'germany.svg', shape: 'flag' },
  'Ligue 1': { file: 'france.svg', shape: 'flag' },
};

export default function CompetitionLogo({ competition, className = '' }: CompetitionLogoProps) {
  const mark = competitionMarks[competition];
  if (!mark) return null;

  const classes = [
    'competition-logo-badge',
    `competition-logo-badge--${mark.shape}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-hidden="true">
      <img src={`/league-logos/${mark.file}`} alt="" draggable={false} />
    </span>
  );
}
