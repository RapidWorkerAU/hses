"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { logoutPortalUser } from "@/lib/supabase/logout";
import styles from "./PublicSiteHeader.module.css";

type PublicSiteHeaderProps = {
  active?: "documents" | "systems" | "technology" | "pricing";
  ctaHref?: string;
  ctaLabel?: string;
};

const navLinks = [
  { href: "/document-development", label: "Documents", key: "documents" },
  { href: "/system-design", label: "Systems", key: "systems" },
  { href: "/technology-options", label: "Technology", key: "technology" },
  { href: "/#pricing", label: "Pricing", key: "pricing" },
] as const;

export default function PublicSiteHeader({
  active,
  ctaHref = "/contact",
  ctaLabel = "Contact",
}: PublicSiteHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.session));
    };

    syncSession();

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isMobileMenuOpen);

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.body.classList.remove("mobile-menu-open");
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const desktopActions = isLoggedIn ? (
    <>
      <Link className={`${styles.headerButton} ${styles.headerButtonPortal}`} href="/dashboard">
        Access Portal
        <span className={`${styles.headerButtonArrow} ${styles.headerButtonBackIcon}`} aria-hidden="true">
        </span>
      </Link>
      <button
        className={`${styles.headerButton} ${styles.headerButtonMuted}`}
        type="button"
        onClick={() => void logoutPortalUser()}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link className={`${styles.headerButton} ${styles.headerButtonLogin}`} href="/login">
        Sign in
        <span className={`${styles.headerButtonArrow} ${styles.headerButtonBackIcon}`} aria-hidden="true">
        </span>
      </Link>
      <Link className={`${styles.headerButton} ${styles.headerButtonMuted}`} href={ctaHref}>
        {ctaLabel}
      </Link>
    </>
  );

  const mobileActions = isLoggedIn ? (
    <>
      <Link
        className={`${styles.mobileNavButton} ${styles.mobileNavButtonPortal}`}
        href="/dashboard"
        onClick={closeMobileMenu}
      >
        Access Portal
        <span className={`${styles.mobileButtonArrow} ${styles.mobileButtonBackIcon}`} aria-hidden="true">
        </span>
      </Link>
      <button
        className={`${styles.mobileNavButtonSecondary} ${styles.mobileNavButtonMuted}`}
        type="button"
        onClick={() => {
          closeMobileMenu();
          void logoutPortalUser();
        }}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link
        className={`${styles.mobileNavButtonSecondary} ${styles.mobileNavButtonLogin}`}
        href="/login"
        onClick={closeMobileMenu}
      >
        Sign in
        <span className={`${styles.mobileButtonArrow} ${styles.mobileButtonBackIcon}`} aria-hidden="true">
        </span>
      </Link>
      <Link
        className={`${styles.mobileNavButtonSecondary} ${styles.mobileNavButtonMuted}`}
        href={ctaHref}
        onClick={closeMobileMenu}
      >
        {ctaLabel}
      </Link>
    </>
  );

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink} aria-label="HSES Industry Partners home">
            <img
              src="/images/logo-original-black.png"
              alt="HSES Industry Partners"
              className={styles.logo}
            />
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                className={link.key === active ? styles.navLinkActive : styles.navLink}
                href={link.href}
                aria-current={link.key === active ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>{desktopActions}</div>

          <button
            className={styles.menuToggle}
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className={styles.menuToggleInner}>
              <span className={styles.menuToggleLine}></span>
              <span className={styles.menuToggleLine}></span>
              <span className={styles.menuToggleLine}></span>
            </span>
          </button>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <button
          className={styles.mobileBackdrop}
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        ></button>
        <div className={styles.mobilePanel} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={styles.mobilePanelHeader}>
            <img
              src="/images/logo-white.png"
              alt="HSES Industry Partners"
              className={styles.mobileLogo}
            />
            <button
              className={styles.mobileClose}
              type="button"
              aria-label="Close menu"
              onClick={closeMobileMenu}
            >
              Close
            </button>
          </div>

          <nav className={styles.mobileNav} aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                className={styles.mobileNavLink}
                href={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className={styles.mobileNavActions}>{mobileActions}</div>
          </nav>
        </div>
      </div>
    </>
  );
}
