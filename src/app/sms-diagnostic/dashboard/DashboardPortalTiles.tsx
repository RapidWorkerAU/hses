"use client";

import { useEffect, useState } from "react";

const ADMIN_EMAIL = "ashleigh.phillips@hses.com.au";

type PortalTile = {
  key: string;
  title: string;
  description: string;
  href: string;
  requiresAdmin: boolean;
};

const PORTAL_TILES: PortalTile[] = [
  {
    key: "business-admin",
    title: "Business Administration",
    description: "Access administration pages and business management features.",
    href: "/dashboard/business-admin",
    requiresAdmin: true,
  },
  {
    key: "diagnostics",
    title: "Diagnostics",
    description: "Open diagnostics, code register, and access landing resources.",
    href: "/dashboard/diagnostics",
    requiresAdmin: true,
  },
  {
    key: "system-maps",
    title: "System Map Designer",
    description: "Design, manage, and maintain system maps and relationships.",
    href: "/system-maps",
    requiresAdmin: false,
  },
];

export default function DashboardPortalTiles() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserEmail(localStorage.getItem("hses_user_email")?.toLowerCase() ?? "");
  }, []);

  const isAdmin = userEmail === ADMIN_EMAIL;
  const visibleTiles = PORTAL_TILES.filter((tile) => {
    if (tile.key === "business-admin" && !isAdmin) return false;
    return true;
  });
  const sortedTiles = [...visibleTiles].sort((a, b) => {
    const aDisabled = a.requiresAdmin && !isAdmin;
    const bDisabled = b.requiresAdmin && !isAdmin;
    if (aDisabled === bDisabled) return 0;
    return aDisabled ? 1 : -1;
  });

  return (
    <div className="dashboard-portal-tiles">
      {sortedTiles.map((tile) => {
        const isDisabled = tile.requiresAdmin && !isAdmin;
        const tileClassName = isDisabled
          ? "dashboard-portal-tile dashboard-portal-tile--disabled"
          : "dashboard-portal-tile";

        return isDisabled ? (
          <div key={tile.key} className={tileClassName} aria-disabled="true">
            <div className="dashboard-portal-tile-top">
              <span className="dashboard-portal-tile-eyebrow">{tile.title}</span>
              <span className="dashboard-portal-tile-status">AVAILABLE</span>
            </div>
            <h3>{tile.title}</h3>
            <p>{tile.description}</p>
            <span className="dashboard-portal-tile-cta">Open portal -&gt;</span>
          </div>
        ) : (
          <a key={tile.key} className={tileClassName} href={tile.href}>
            <div className="dashboard-portal-tile-top">
              <span className="dashboard-portal-tile-eyebrow">{tile.title}</span>
              <span className="dashboard-portal-tile-status">AVAILABLE</span>
            </div>
            <h3>{tile.title}</h3>
            <p>{tile.description}</p>
            <span className="dashboard-portal-tile-cta">Open portal -&gt;</span>
          </a>
        );
      })}
    </div>
  );
}
