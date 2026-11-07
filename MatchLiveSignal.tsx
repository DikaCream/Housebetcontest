import React from 'react';

type Props = { className?: string };

/** A restrained broadcast-style cue reserved for a match currently in play. */
export default function MatchLiveSignal({ className = '' }: Props) {
  return (
    <span className={`match-live-signal ${className}`.trim()} aria-label="Live match">
      <svg viewBox="0 0 18 16" aria-hidden="true" focusable="false">
        <circle className="match-live-signal-core" cx="9" cy="12.5" r="1.4" />
        <path className="match-live-signal-wave match-live-signal-wave--near" d="M5.8 10.1a4.5 4.5 0 0 1 6.4 0" />
        <path className="match-live-signal-wave match-live-signal-wave--mid" d="M3.3 7.8a8 8 0 0 1 11.4 0" />
        <path className="match-live-signal-wave match-live-signal-wave--far" d="M1 5.5a11.3 11.3 0 0 1 16 0" />
      </svg>
      <strong>LIVE</strong>
    </span>
  );
}
