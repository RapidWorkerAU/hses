"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight, IconLock } from "@tabler/icons-react";
import { ADMIN_EMAIL, DASHBOARD_PORTALS } from "./dashboardPortals";

export default function DashboardPortalTiles() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem("hses_user_email")?.toLowerCase() ?? "");
  }, []);

  if (userEmail === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 animate-pulse h-[160px]" />
        ))}
      </div>
    );
  }

  const isAdmin = userEmail === ADMIN_EMAIL;
  const visibleTiles = DASHBOARD_PORTALS.filter((tile) => !(tile.requiresAdmin && !isAdmin));
  const sortedTiles = visibleTiles
    .map((tile, index) => ({ tile, index, locked: !!tile.lockedForStandardUsers && !isAdmin }))
    .sort((a, b) => (a.locked !== b.locked ? (a.locked ? 1 : -1) : a.index - b.index))
    .map((entry) => entry.tile);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedTiles.map((tile) => {
        const isLocked = !!tile.lockedForStandardUsers && !isAdmin;

        if (isLocked) {
          return (
            <div
              key={tile.key}
              className="rounded-xl border border-neutral-200 bg-white p-5 opacity-60 flex flex-col gap-3"
              aria-disabled="true"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Image src={tile.icon} alt="" width={22} height={22} />
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-900 leading-tight">{tile.title}</h3>
              </div>
              <p className="text-[13px] text-neutral-500 leading-relaxed flex-1">{tile.description}</p>
              <div className="flex items-center gap-1.5 text-[13px] text-neutral-400">
                <IconLock size={13} />
                <span>Portal locked</span>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={tile.key}
            href={tile.href}
            className="group rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                <Image src={tile.icon} alt="" width={22} height={22} />
              </div>
              <h3 className="text-[15px] font-semibold text-neutral-900 leading-tight">{tile.title}</h3>
            </div>
            <p className="text-[13px] text-neutral-500 leading-relaxed flex-1">{tile.description}</p>
            <div className="flex items-center gap-1 text-[13px] font-medium text-[#2d9692] group-hover:gap-2 transition-all">
              <span>Open portal</span>
              <IconArrowRight size={13} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
