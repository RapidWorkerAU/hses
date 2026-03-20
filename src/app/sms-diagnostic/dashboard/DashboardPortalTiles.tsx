"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./DashboardShell.module.css";
import { ADMIN_EMAIL, DASHBOARD_PORTALS } from "./dashboardPortals";

export default function DashboardPortalTiles() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserEmail(localStorage.getItem("hses_user_email")?.toLowerCase() ?? "");
  }, []);

  const isAdmin = userEmail === ADMIN_EMAIL;
  const visibleTiles = DASHBOARD_PORTALS.filter((tile) => !(tile.requiresAdmin && !isAdmin));
  const sortedTiles = visibleTiles
    .map((tile, index) => ({
      tile,
      index,
      locked: !!tile.lockedForStandardUsers && !isAdmin,
    }))
    .sort((a, b) => {
      if (a.locked !== b.locked) {
        return a.locked ? 1 : -1;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.tile);

  return (
    <div className={styles.portalTiles}>
      {sortedTiles.map((tile) => {
        const isDisabled = !!tile.lockedForStandardUsers && !isAdmin;
        const tileClassName = isDisabled ? `${styles.portalTile} ${styles.portalTileDisabled}` : styles.portalTile;
        const tileTitle = isDisabled ? "This module has not been enabled for your account" : tile.title;

        return isDisabled ? (
          <div key={tile.key} className={tileClassName} aria-disabled="true" title={tileTitle}>
            <div className={styles.portalTileTop}>
              <div className={styles.portalTileIcon}>
                <Image src={tile.icon} alt="" width={24} height={24} />
              </div>
              <span className={styles.portalTileStatus}>Locked</span>
            </div>
            <h3>{tile.title}</h3>
            <span className={styles.portalTileMeta}>Portal</span>
            <p>{tile.description}</p>
            <span className={styles.portalTileCta}>
              <span>Portal Locked</span>
              <Image src="/icons/lock.svg" alt="" width={16} height={16} className={styles.portalTileCtaLock} />
            </span>
          </div>
        ) : (
          <a key={tile.key} className={tileClassName} href={tile.href} title={tileTitle}>
            <div className={styles.portalTileTop}>
              <div className={styles.portalTileIcon}>
                <Image src={tile.icon} alt="" width={24} height={24} />
              </div>
              <span className={styles.portalTileStatus}>Available</span>
            </div>
            <h3>{tile.title}</h3>
            <span className={styles.portalTileMeta}>Portal</span>
            <p>{tile.description}</p>
            <span className={styles.portalTileCta}>Open portal</span>
          </a>
        );
      })}
    </div>
  );
}
