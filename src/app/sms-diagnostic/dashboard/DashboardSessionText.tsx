"use client";

import { useEffect, useState } from "react";

type DashboardSessionTextProps = {
  showMenuButton?: boolean;
};

export default function DashboardSessionText({ showMenuButton = true }: DashboardSessionTextProps) {
  const [email, setEmail] = useState<string>("");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("hses_user_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (navOpen) {
      document.body.classList.add("dashboard-nav-open");
    } else {
      document.body.classList.remove("dashboard-nav-open");
    }
    return () => {
      document.body.classList.remove("dashboard-nav-open");
    };
  }, [navOpen]);

  return (
    <div className="dashboard-session-row">
      {showMenuButton ? (
        <button
          type="button"
          className="dashboard-mobile-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <span className="dashboard-mobile-bar"></span>
          <span className="dashboard-mobile-bar"></span>
          <span className="dashboard-mobile-bar"></span>
          <span className="dashboard-mobile-label">Menu</span>
        </button>
      ) : null}
      <span className="dashboard-session-text">
        {email ? `Logged in as ${email}` : "Logged in"}
      </span>
    </div>
  );
}
