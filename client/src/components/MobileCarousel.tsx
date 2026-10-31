import { useRef, useState } from 'react';

interface MobileCarouselProps {
  children: React.ReactNode;
  itemCount: number;
  itemLabel: string; // e.g. "Suspect", "Clue", "Location", "Case File"
  className?: string;
  style?: React.CSSProperties;
}

export default function MobileCarousel({
  children,
  itemCount,
  itemLabel,
  className = '',
  style
}: MobileCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    const cardWidth = card.offsetWidth + 16;
    const idx = Math.min(itemCount, Math.max(1, Math.round(track.scrollLeft / cardWidth) + 1));
    setActiveIndex(idx);
  };

  const scrollPrev = () => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const cardWidth = (card?.offsetWidth || 280) + 16;
    track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const scrollNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const cardWidth = (card?.offsetWidth || 280) + 16;
    track.scrollBy({ left: cardWidth, behavior: 'smooth' });
  };

  return (
    <div className="mobile-carousel-wrapper">
      {/* Mobile Top Controls Bar (Hidden on desktop via CSS) */}
      {itemCount > 1 && (
        <div className="mobile-carousel-controls">
          <button
            type="button"
            onClick={scrollPrev}
            className="mobile-carousel-arrow-btn"
            aria-label={`Previous ${itemLabel}`}
            title="Previous"
          >
            ◀
          </button>

          <div className="mobile-carousel-indicator">
            {itemLabel} {activeIndex} of {itemCount} · Swipe ↔
          </div>

          <button
            type="button"
            onClick={scrollNext}
            className="mobile-carousel-arrow-btn"
            aria-label={`Next ${itemLabel}`}
            title="Next"
          >
            ▶
          </button>
        </div>
      )}

      {/* Track containing the cards */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className={`mobile-carousel-track ${itemCount <= 1 ? 'single-item' : ''} ${className}`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
