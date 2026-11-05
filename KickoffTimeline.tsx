import React, { useId, useState } from 'react';

type KickoffFixture = {
  id: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  time: string;
  date?: string;
};

export default function KickoffTimeline({ fixture }: { fixture: KickoffFixture }) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const timelineId = useId();
  const isOpen = openFor === fixture.id;
  const currentStep = fixture.status === 'LIVE' ? 1 : fixture.status === 'FINISHED' ? 2 : 0;
  const start = fixture.status === 'UPCOMING'
    ? `${fixture.date ?? 'Today'} · ${fixture.time}`
    : 'Sample start';
  const now = fixture.status === 'LIVE' ? fixture.time : fixture.status === 'FINISHED' ? 'Final sample' : 'Not started';
  const stages = [
    { label: 'Kick-off', value: start },
    { label: 'Simulated now', value: now },
    { label: 'Full time', value: fixture.status === 'FINISHED' ? 'Final sample' : '90 min · sample' },
  ];

  return (
    <div className="kickoff-card-wrap">
      <button
        type="button"
        className="kickoff-card"
        aria-expanded={isOpen}
        aria-controls={timelineId}
        aria-label={`Kick-off ${start}. ${isOpen ? 'Hide' : 'Show'} simulated timeline`}
        onClick={() => setOpenFor(isOpen ? null : fixture.id)}
      >
        <span className="kickoff-card-copy">
          <strong>{fixture.status === 'FINISHED' ? 'Final sample' : start}</strong>
          <small>{fixture.status === 'LIVE' ? `${fixture.time} · simulated clock` : fixture.status === 'UPCOMING' ? 'Simulated kick-off' : 'Sample result · full time'}</small>
        </span>
        <span className="kickoff-card-action" aria-hidden="true">{isOpen ? 'Hide timeline −' : 'Timeline +'}</span>
      </button>
      <div id={timelineId} className={`kickoff-timeline ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
        <div className="kickoff-timeline-clip">
          <div className="kickoff-timeline-content">
            <div className="kickoff-timeline-steps" role="list" aria-label="Simulated match timeline">
              {stages.map((stage, index) => {
                const state = index < currentStep ? 'is-done' : index === currentStep ? 'is-current' : '';
                return (
                  <div className={`kickoff-step ${state}`} role="listitem" aria-current={index === currentStep ? 'step' : undefined} key={stage.label}>
                    <span className="kickoff-step-marker" aria-hidden="true" />
                    <span className="kickoff-step-label">{stage.label}</span>
                    <strong className="kickoff-step-value">{stage.value}</strong>
                  </div>
                );
              })}
            </div>
            <p className="kickoff-timeline-note">Simulated schedule and clock · no live feed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
