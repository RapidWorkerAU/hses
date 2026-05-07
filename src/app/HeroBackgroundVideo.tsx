"use client";

import { useEffect, useRef } from "react";
import styles from "./HomePage.module.css";

const LOOP_RESET_THRESHOLD_SECONDS = 0.12;
const LOOP_RESTART_TIME_SECONDS = 0.03;

export default function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const restartVideo = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      video.currentTime = LOOP_RESTART_TIME_SECONDS;
      void video.play().catch(() => {});
    };

    const handleTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      if (video.currentTime >= video.duration - LOOP_RESET_THRESHOLD_SECONDS) {
        restartVideo();
      }
    };

    const handleEnded = () => {
      restartVideo();
    };

    void video.play().catch(() => {});
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={styles.heroVideo}
      autoPlay
      muted
      playsInline
      preload="auto"
    >
      <source src="/videos/herovideo.mp4" type="video/mp4" />
    </video>
  );
}
