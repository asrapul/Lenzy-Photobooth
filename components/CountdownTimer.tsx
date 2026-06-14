"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  size?: number;
}

export default function CountdownTimer({
  seconds,
  onComplete,
  size = 200,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const radius = (size / 2) * 0.8;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const progress = (remaining / seconds) * circumference;

  // Color transitions: cream → amber → red
  const getColor = () => {
    if (remaining > seconds * 0.6) return "#e6e0d4";
    if (remaining > seconds * 0.3) return "#f5c27a";
    return "#e07a5f";
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Countdown: ${remaining} seconds`}
      role="timer"
    >
      {/* Background track */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>

      {/* Number */}
      <div className="relative z-10 flex flex-col items-center">
        <span
          className="font-serif text-offwhite"
          style={{
            fontSize: size * 0.38,
            lineHeight: 1,
            color: getColor(),
            transition: "color 0.5s ease",
            fontWeight: 500,
          }}
        >
          {remaining}
        </span>
        <span
          className="font-sans text-offwhite/60 tracking-widest uppercase"
          style={{ fontSize: size * 0.09 }}
        >
          detik
        </span>
      </div>
    </div>
  );
}
