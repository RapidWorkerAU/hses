"use client";

import Image from "next/image";
import styles from "./DashboardShell.module.css";

type LinkMapCodeControlProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  label?: string;
};

export default function LinkMapCodeControl({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  busy = false,
  label = "Link Map Code",
}: LinkMapCodeControlProps) {
  return (
    <div className={styles.linkControl}>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonSecondary}`}
        onClick={() => onOpenChange(!open)}
      >
        <Image src="/icons/relationship.svg" alt="" width={16} height={16} className={styles.buttonIcon} />
        {label}
      </button>
      {open ? (
        <form
          className={styles.linkPanel}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className={styles.linkLabel} htmlFor="dashboard-map-code">
            Map code
          </label>
          <div className={styles.linkInputRow}>
            <input
              id="dashboard-map-code"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              className={styles.linkInput}
              placeholder="Enter shared map code"
              autoComplete="off"
            />
            <button type="submit" className={`${styles.button} ${styles.buttonAccent}`} disabled={busy}>
              {busy ? "Linking..." : "Link"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
