'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      let x = 0;
      let y = 0;

      // Use gentle translation on small viewports to guarantee no layout overflow
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const xOffset = isMobile ? 20 : 50;
      const yOffset = isMobile ? 30 : 50;

      switch (direction) {
        case 'up':
          y = yOffset;
          break;
        case 'down':
          y = -yOffset;
          break;
        case 'left':
          x = xOffset;
          break;
        case 'right':
          x = -xOffset;
          break;
        default:
          break;
      }

      gsap.from(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        x: x,
        y: y,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: delay,
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={`will-change-transform w-full max-w-[100vw] overflow-x-clip ${className}`}>
      {children}
    </div>
  );
}
