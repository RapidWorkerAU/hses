"use client";

import { useEffect } from "react";

export default function ProductLandingScripts() {
  useEffect(() => {
    const mobileMenu = document.querySelector<HTMLElement>("[data-mobile-menu]");
    const mobileMenuToggle = document.querySelector<HTMLElement>("[data-mobile-menu-toggle]");
    const mobileMenuClosers = mobileMenu?.querySelectorAll<HTMLElement>(".js-close-mobile-menu");

    if (!mobileMenu || !mobileMenuToggle) return;

    const openMobileMenu = () => {
      mobileMenu.classList.add("is-open");
      document.body.classList.add("mobile-menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", "true");
    };

    const closeMobileMenu = () => {
      mobileMenu.classList.remove("is-open");
      document.body.classList.remove("mobile-menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    mobileMenuToggle.addEventListener("click", openMobileMenu);
    mobileMenuClosers?.forEach((button) => button.addEventListener("click", closeMobileMenu));
    document.addEventListener("keyup", onKeyUp);

    return () => {
      mobileMenuToggle.removeEventListener("click", openMobileMenu);
      mobileMenuClosers?.forEach((button) =>
        button.removeEventListener("click", closeMobileMenu)
      );
      document.removeEventListener("keyup", onKeyUp);
      document.body.classList.remove("mobile-menu-open");
    };
  }, []);

  return null;
}
