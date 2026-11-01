import { useRef } from 'react';

interface MobileCarouselProps {
  children: React.ReactNode;
  itemCount: number;
  itemLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MobileCarousel({
  children,
  itemCount,
  className = '',
  style
}: MobileCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mobile-carousel-wrapper">
      {/* Track containing the cards */}
      <div
        ref={trackRef}
        className={`mobile-carousel-track ${itemCount <= 1 ? 'single-item' : ''} ${className}`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
