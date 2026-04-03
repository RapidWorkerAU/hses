"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { logoutPortalUser } from "@/lib/supabase/logout";
import styles from "./HomePage.module.css";

type HomePageHeaderActionsProps = {
  variant?: "desktop" | "mobile";
};

export default function HomePageHeaderActions({
  variant = "desktop",
}: HomePageHeaderActionsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isMobile = variant === "mobile";

  const defaultPrimaryClass =
    isMobile
      ? styles.mobileNavButton
      : `${styles.headerButton} ${styles.headerButtonPrimary}`;
  const loggedInPrimaryClass =
    isMobile
      ? styles.mobileNavButtonLoggedIn
      : `${styles.headerButton} ${styles.headerButtonLoggedIn}`;
  const secondaryClass =
    isMobile
      ? styles.mobileNavLink
      : `${styles.headerButton} ${styles.headerButtonSecondary}`;
  const mobileSecondaryButtonClass = isMobile
    ? styles.mobileNavButtonSecondary
    : secondaryClass;

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

  if (isLoggedIn) {
    const content = (
      <>
        <a className={mobileSecondaryButtonClass} href="/dashboard">
          Access Portal
        </a>
        <button
          className={loggedInPrimaryClass}
          type="button"
          onClick={() => void logoutPortalUser()}
        >
          Log Out
        </button>
      </>
    );

    return isMobile ? <div className={styles.mobileNavActions}>{content}</div> : content;
  }

  const content = (
    <>
      <button className={`${secondaryClass} js-open-modal`} type="button">
        Let&apos;s Talk
      </button>
      <a className={secondaryClass} href="/login">
        Portal Login
      </a>
    </>
  );

  return isMobile ? <div className={styles.mobileNavActions}>{content}</div> : content;
}
