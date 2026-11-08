import React from 'react';

type Props = { className?: string };

/** A compact broadcast-style cue reserved for a match currently in play. */
export default function MatchLiveSignal({ className = '' }: Props) {
  return (
    <span className={`match-live-signal ${className}`.trim()} aria-label="Live match">
      <span className="match-live-signal-core" aria-hidden="true" />
      <strong>LIVE</strong>
    </span>
  );
}
