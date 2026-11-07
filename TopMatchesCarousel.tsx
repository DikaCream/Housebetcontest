import React, { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import './top-matches-carousel.css';

type TopMatchesCarouselProps = {
  children: ReactNode;
};

const getScrollLimit = (track: HTMLDivElement) => Math.max(0, track.scrollWidth - track.clientWidth);

function TopMatchesCarousel({ children }: TopMatchesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const limit = getScrollLimit(track);
    const edgeTolerance = 1;
    setCanScrollPrevious(track.scrollLeft > edgeTolerance);
    setCanScrollNext(track.scrollLeft < limit - edgeTolerance);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleUpdate) : null;
    resizeObserver?.observe(track);

    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const amount = Math.max(track.clientWidth * 0.82, 1);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: direction * amount, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const handleTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    scrollByPage(event.key === 'ArrowLeft' ? -1 : 1);
  };

  return (
    <section className="top-matches-carousel" aria-labelledby="top-matches-carousel-title">
      <div className="top-matches-carousel__heading">
        <h2 id="top-matches-carousel-title">Top matches</h2>
        <div className="top-matches-carousel__controls" aria-label="Top matches navigation">
          <button
            className="top-matches-carousel__arrow"
            type="button"
            aria-label="Previous top matches"
            disabled={!canScrollPrevious}
            onClick={() => scrollByPage(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
              <path d="m12.5 4.5-5 5 5 5" />
            </svg>
          </button>
          <button
            className="top-matches-carousel__arrow"
            type="button"
            aria-label="Next top matches"
            disabled={!canScrollNext}
            onClick={() => scrollByPage(1)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
              <path d="m7.5 4.5 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="top-matches-carousel__track"
        tabIndex={0}
        role="region"
        aria-label="Top matches"
        onKeyDown={handleTrackKeyDown}
      >
        {children}
      </div>
    </section>
  );
}

export default TopMatchesCarousel;
