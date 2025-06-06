import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  duration?: number;
  pieces?: number;
  colors?: string[];
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({
  duration = 3000,
  pieces = 100,
  colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ],
  onComplete,
}) => {
  const [confetti, setConfetti] = useState<React.ReactNode[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Generate confetti pieces
    const pieces_array = [];
    for (let i = 0; i < pieces; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;
      const x = Math.random() * 100;
      const y = -20;
      const delay = Math.random() * 500;

      pieces_array.push(
        <motion.div
          key={i}
          initial={{
            x: `${x}vw`,
            y: `${y}vh`,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          animate={{
            x: `${x + (Math.random() * 20 - 10)}vw`,
            y: "100vh",
            scale: 1,
            rotate: Math.random() * 360 + 360,
          }}
          transition={{
            duration: (duration / 1000) * (0.8 + Math.random() * 0.4),
            delay: delay / 1000,
            ease: [0.1, 0.4, 0.6, 1],
          }}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: Math.random() > 0.2 ? "50%" : "0%",
            backgroundColor: color,
            top: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />,
      );
    }

    setConfetti(pieces_array);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setActive(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, pieces, colors, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confetti}
    </div>
  );
};

export { Confetti };
