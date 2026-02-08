"use client";

import { useEffect } from "react";

export default function HomePageScripts() {
  useEffect(() => {
    // If Supabase sends a recovery hash to the root URL, forward it to the
    // set-password route so the reset flow can complete.
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const type = params.get("type");
      if (type === "recovery") {
        window.location.replace("/auth/set-password" + window.location.hash);
        return;
      }
    }

    const modal = document.querySelector<HTMLElement>("[data-modal]");
    if (!modal) return;
    const dialog = modal.querySelector<HTMLElement>(".modal-dialog");
    const openers = document.querySelectorAll<HTMLElement>(".js-open-modal");
    const closers = modal.querySelectorAll<HTMLElement>(".js-close-modal");
    const trustTrack = document.querySelector<HTMLElement>(".trust-logos");
    const trustPrev = document.querySelector<HTMLElement>(".trust-nav--prev");
    const trustNext = document.querySelector<HTMLElement>(".trust-nav--next");
    let trustIndex = 0;

    const open = () => {
      modal.classList.add("is-visible");
      dialog?.focus();
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      modal.classList.remove("is-visible");
      document.body.style.overflow = "";
    };

    openers.forEach((btn) => btn.addEventListener("click", open));
    closers.forEach((btn) => btn.addEventListener("click", close));
    const onModalClick = (e: MouseEvent) => {
      if (e.target === modal) close();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    modal.addEventListener("click", onModalClick);
    document.addEventListener("keyup", onKeyUp);

    const updateTrustSlide = () => {
      if (!trustTrack) return;
      const totalSlides = Math.ceil(trustTrack.querySelectorAll("img").length / 2);
      if (trustIndex >= totalSlides) trustIndex = 0;
      if (trustIndex < 0) trustIndex = totalSlides - 1;
      trustTrack.style.transform = `translateX(-${trustIndex * 100}%)`;
    };

    if (trustPrev && trustNext && trustTrack) {
      trustPrev.addEventListener("click", () => {
        trustIndex -= 1;
        updateTrustSlide();
      });
      trustNext.addEventListener("click", () => {
        trustIndex += 1;
        updateTrustSlide();
      });
    }

    const footerMenuToggle = document.querySelector<HTMLElement>(".footer-menu-toggle");
    const footerMenu = document.querySelector<HTMLElement>(".footer-menu");
    if (footerMenuToggle && footerMenu) {
      footerMenuToggle.addEventListener("click", () => {
        footerMenu.classList.toggle("is-open");
      });
    }

    return () => {
      openers.forEach((btn) => btn.removeEventListener("click", open));
      closers.forEach((btn) => btn.removeEventListener("click", close));
      modal.removeEventListener("click", onModalClick);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return null;
}
