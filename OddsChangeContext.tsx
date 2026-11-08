import React, { createContext, useContext } from 'react';

export type OddsDirection = 'up' | 'down';
export type OddsMovement = {
  key: string;
  direction: OddsDirection;
  token: number;
};

const OddsMovementContext = createContext<OddsMovement | null>(null);

export const oddsOverrideKey = (fixtureId: string, market: string, label: string) => `${fixtureId}::${market}::${label}`;

export function OddsMovementProvider({ value, children }: { value: OddsMovement | null; children: React.ReactNode }) {
  return <OddsMovementContext.Provider value={value}>{children}</OddsMovementContext.Provider>;
}

export function useRecentOddsMovement() {
  return useContext(OddsMovementContext);
}

export function matchesOddsMovement(movement: OddsMovement | null, fixtureId: string, market: string, label: string) {
  return movement?.key === oddsOverrideKey(fixtureId, market, label) ? movement : null;
}

export function OddsChangeCue({ movement }: { movement: OddsMovement | null }) {
  if (!movement) return null;
  return (
    <>
      <span key={`flash-${movement.token}`} className={`odds-change-flash odds-change-flash--${movement.direction}`} aria-hidden="true" />
      <span key={`cue-${movement.token}`} className={`odds-change-cue odds-change-cue--${movement.direction}`} aria-hidden="true">
        {movement.direction === 'up' ? '↑' : '↓'}
      </span>
    </>
  );
}
