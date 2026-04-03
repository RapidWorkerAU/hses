"use client";

import { useEffect, useState } from "react";
import styles from "./HomePage.module.css";

type HeroRotatingWordProps = {
  words?: readonly string[];
  className?: string;
};

const defaultWords = ["Documents", "Systems", "Technology", "Advice"] as const;

export default function HeroRotatingWord({
  words = defaultWords,
  className = "",
}: HeroRotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: number | undefined;

    const interval = window.setInterval(() => {
      setVisible(false);
      timeoutId = window.setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setVisible(true);
      }, 180);
    }, 3000);

    return () => {
      window.clearInterval(interval);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <span
      className={`${styles.heroRotatingWord} ${visible ? styles.heroRotatingWordVisible : ""} ${className}`.trim()}
    >
      {words[index]}
    </span>
  );
}
