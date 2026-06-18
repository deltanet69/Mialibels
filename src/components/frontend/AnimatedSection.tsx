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

      switch (direction) {
        case 'up':
          y = 50;
          break;
        case 'down':
          y = -50;
          break;
        case 'left':
          x = 50;
          break;
        case 'right':
          x = -50;
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
    <div ref={containerRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
