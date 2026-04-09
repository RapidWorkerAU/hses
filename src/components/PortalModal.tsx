"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PortalModal.module.css";

type PortalModalProps = {
  open: boolean;
  ariaLabel: string;
  title: string;
  eyebrow?: string;
  description?: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

export default function PortalModal({
  open,
  ariaLabel,
  title,
  eyebrow,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: PortalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open) return null;
  if (!mounted) return null;

  const sizeClass =
    size === "xl" ? styles.dialogXl : size === "lg" ? styles.dialogLg : styles.dialogMd;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close modal"
        className={styles.backdrop}
        onClick={onClose}
      />
      <div className={styles.wrap}>
        <div className={`${styles.dialog} ${sizeClass}`} role="dialog" aria-modal="true" aria-label={ariaLabel}>
          <div className={styles.header}>
            <span className={styles.brand} aria-hidden="true">
              <Image src="/images/favicon.png" alt="" width={26} height={26} />
            </span>
            <div className={styles.headerCopy}>
              {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
              <h3 className={styles.title}>{title}</h3>
              {description ? <p className={styles.description}>{description}</p> : null}
            </div>
          </div>
          <div className={styles.body}>{children}</div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </div>
    </>,
    document.body
  );
}
