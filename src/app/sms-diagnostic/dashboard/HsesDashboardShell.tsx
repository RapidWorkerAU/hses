"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import styles from "./DashboardShell.module.css";
import { ADMIN_EMAIL, DASHBOARD_PORTALS } from "./dashboardPortals";
import { logoutPortalUser } from "@/lib/supabase/logout";

type HsesDashboardShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  hidePageHeader?: boolean;
  backHref?: string;
  backLabel?: string;
};

type SidebarLink = {
  key: string;
  href: string;
  label: string;
  icon: string;
  locked?: boolean;
  children?: Array<{
    key: string;
    label: string;
    href: string;
  }>;
};

const isPathActive = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function HsesDashboardShell({
  eyebrow,
  title,
  subtitle,
  children,
  hidePageHeader = false,
  backHref,
  backLabel = "Back",
}: HsesDashboardShellProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [logoutConfirmArmed, setLogoutConfirmArmed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    setEmail(localStorage.getItem("hses_user_email") ?? "");
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem("hses_dashboard_sidebar_collapsed");
    setDesktopSidebarCollapsed(storedValue === "true");
    setSidebarPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    const body = document.body;
    const header = document.querySelector("body > header");
    const main = document.querySelector("body > main");

    body.classList.add(styles.bodyChrome);
    header?.classList.add(styles.headerChrome);
    main?.classList.add(styles.mainChrome);

    return () => {
      body.classList.remove(styles.bodyChrome);
      header?.classList.remove(styles.headerChrome);
      main?.classList.remove(styles.mainChrome);
    };
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return;
    localStorage.setItem("hses_dashboard_sidebar_collapsed", String(desktopSidebarCollapsed));
  }, [desktopSidebarCollapsed, sidebarPreferenceLoaded]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!logoutConfirmArmed) return;
    const timeoutId = window.setTimeout(() => setLogoutConfirmArmed(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [logoutConfirmArmed]);

  const handleLogout = async () => {
    if (!logoutConfirmArmed) {
      setLogoutConfirmArmed(true);
      return;
    }

    await logoutPortalUser();
  };

  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const accessLevel = useMemo(() => {
    if (isAdmin) {
      return { label: "Administrator Access", toneClass: styles.accessPillAdmin };
    }

    const nonAdminPortals = DASHBOARD_PORTALS.filter((portal) => !portal.requiresAdmin);
    const hasRestrictedModules = nonAdminPortals.some((portal) => portal.lockedForStandardUsers);

    if (hasRestrictedModules) {
      return { label: "Restricted Access", toneClass: styles.accessPillRestricted };
    }

    return { label: "Full Access", toneClass: styles.accessPillFull };
  }, [isAdmin]);

  const sidebarLinks = useMemo<SidebarLink[]>(() => {
    const base: SidebarLink[] = [
      { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "/icons/house.svg" },
    ];

    const portalLinks = DASHBOARD_PORTALS.filter((portal) => !(portal.requiresAdmin && !isAdmin)).map((portal) => ({
      key: portal.key,
      href: portal.href,
      label: portal.title,
      icon: portal.icon,
      locked: !!portal.lockedForStandardUsers && !isAdmin,
      children: portal.children?.map((child) => ({
        key: child.key,
        label: child.title,
        href: child.href,
      })),
    }));

    return [...base, ...portalLinks];
  }, [isAdmin]);

  const isLinkActive = (href: string) => isPathActive(pathname, href);
  const isSectionActive = (link: SidebarLink) =>
    isLinkActive(link.href) || link.children?.some((child) => isLinkActive(child.href)) || false;

  useEffect(() => {
    const activeKeys = sidebarLinks.filter((link) => link.children?.some((child) => isLinkActive(child.href))).map((link) => link.key);
    if (activeKeys.length === 0) return;
    setOpenSections([activeKeys[0]]);
  }, [pathname, sidebarLinks]);

  const toggleSection = (key: string) => {
    setOpenSections((current) => (current.includes(key) ? [] : [key]));
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.deviceShell}>
        <div className={styles.deviceBezel}>
          <header className={styles.mobileHeader}>
            <Link href="/" className={styles.mobileHeaderBrand} aria-label="HSES Industry Partners home">
              <Image
                src="/images/favicon.png"
                alt="HSES Industry Partners"
                width={52}
                height={52}
                className={styles.mobileHeaderBrandImage}
              />
              <span className={styles.mobileHeaderBrandText}>HSES Industry Tools</span>
            </Link>

            <button
              type="button"
              className={styles.mobileHeaderMenuButton}
              title="Open menu"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <span aria-hidden="true" className={styles.mobileHeaderMenuIcon}>
                <span />
              </span>
            </button>
          </header>

          <aside className={`${styles.sidebar} ${desktopSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
            <div className={styles.sidebarTop}>
              <Link href="/" className={styles.brand} aria-label="HSES Industry Partners home">
                <span className={styles.brandMark}>
                  <Image
                    src="/images/favicon.png"
                    alt="HSES Industry Partners"
                    width={24}
                    height={24}
                    className={styles.brandImage}
                  />
                </span>
                <span className={styles.brandText}>HSES Industry Tools</span>
              </Link>

              <button
                type="button"
                className={styles.sidebarCollapseButton}
                aria-label={desktopSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                aria-pressed={desktopSidebarCollapsed}
                onClick={() => setDesktopSidebarCollapsed((current) => !current)}
              >
                <span className={styles.sidebarCollapseIcon} aria-hidden="true" />
              </button>
            </div>

            <nav className={styles.sidebarNav} aria-label="Dashboard shortcuts">
              {sidebarLinks.map((link) => (
                <div
                  key={link.key}
                  className={`${styles.sidebarItem} ${link.children?.length ? styles.sidebarGroup : ""} ${
                    openSections.includes(link.key) ? styles.sidebarGroupOpen : ""
                  }`}
                >
                  {link.children?.length && !desktopSidebarCollapsed ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.sidebarGroupTrigger} ${isSectionActive(link) ? styles.sidebarLinkActive : ""}`}
                        aria-label={openSections.includes(link.key) ? `Collapse ${link.label}` : `Expand ${link.label}`}
                        aria-expanded={openSections.includes(link.key)}
                        onClick={() => toggleSection(link.key)}
                      >
                        <span className={styles.sidebarTriggerMain}>
                          <Image src={link.icon} alt="" width={24} height={24} className={styles.sidebarIcon} />
                          <span className={styles.sidebarLinkLabel}>{link.label}</span>
                        </span>
                        <span className={styles.sidebarToggleChevron} aria-hidden="true" />
                      </button>

                      <div
                        className={`${styles.sidebarSubnav} ${openSections.includes(link.key) ? styles.sidebarSubnavOpen : ""}`}
                        aria-hidden={!openSections.includes(link.key)}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.key}
                            href={child.href}
                            className={`${styles.sidebarSublink} ${isLinkActive(child.href) ? styles.sidebarSublinkActive : ""}`}
                          >
                            <span className={styles.sidebarSublinkLabel}>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    link.locked ? (
                      <div
                        className={`${styles.sidebarLink} ${styles.sidebarLinkLocked}`}
                        title="This module has not been enabled for your account"
                        aria-label={`${link.label}. This module has not been enabled for your account`}
                        aria-disabled="true"
                      >
                        <Image src={link.icon} alt="" width={24} height={24} className={styles.sidebarIcon} />
                        <span className={styles.sidebarLinkLabel}>{link.label}</span>
                        <Image src="/icons/lock.svg" alt="" width={16} height={16} className={styles.sidebarLockIcon} />
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className={`${styles.sidebarLink} ${isSectionActive(link) ? styles.sidebarLinkActive : ""}`}
                        title={link.label}
                        aria-label={link.label}
                      >
                        <Image src={link.icon} alt="" width={24} height={24} className={styles.sidebarIcon} />
                        <span className={styles.sidebarLinkLabel}>{link.label}</span>
                      </Link>
                    )
                  )}
                </div>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <button
                type="button"
                className={`${styles.sidebarLink} ${logoutConfirmArmed ? styles.sidebarLinkConfirm : ""}`}
                title={logoutConfirmArmed ? "Click again to confirm logout" : "Logout"}
                aria-label={logoutConfirmArmed ? "Confirm logout" : "Logout"}
                onClick={() => void handleLogout()}
              >
                <Image src="/icons/logout.svg" alt="" width={24} height={24} className={styles.sidebarIcon} />
                <span className={styles.sidebarLinkLabel}>{logoutConfirmArmed ? "Confirm Logout" : "Logout"}</span>
              </button>
            </div>
          </aside>

          <section className={styles.canvas}>
            {!hidePageHeader ? (
              <header className={styles.topbar}>
                <div className={styles.topbarPrimary}>
                  {backHref ? (
                    <Link href={backHref} className={styles.topbarBackLink}>
                      <span className={styles.topbarBackIcon} aria-hidden="true" />
                      <span>{backLabel}</span>
                    </Link>
                  ) : null}

                  <div className={styles.greetingBlock}>
                    <div>
                      <p className={styles.eyebrow}>{eyebrow}</p>
                      <h1 className={styles.title}>{title}</h1>
                      <p className={styles.subtitle}>{subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.topbarActions}>
                  <div className={styles.accountSummary}>
                    <div className={styles.accountSummaryText}>
                    <div className={styles.accountSummaryPrimary}>
                      <span className={styles.accountSummaryLabel}>My account</span>
                      <span className={styles.accountSummaryValue}>{email || "Logged in"}</span>
                    </div>
                      <span className={`${styles.accessPill} ${accessLevel.toneClass}`}>{accessLevel.label}</span>
                    </div>
                  </div>
                </div>
              </header>
            ) : null}

            <div className={styles.body}>{children}</div>
          </section>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <div className={styles.mobileMenuHeader}>
            <Link
              href="/"
              className={styles.mobileMenuBrand}
              aria-label="HSES Industry Partners home"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/images/favicon.png"
                alt="HSES Industry Partners"
                width={36}
                height={36}
                className={styles.mobileMenuBrandImage}
              />
              <span>HSES Industry Tools</span>
            </Link>

            <button
              type="button"
              className={styles.mobileMenuClose}
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span aria-hidden="true" className={styles.mobileMenuCloseIcon} />
            </button>
          </div>

          <nav className={styles.mobileMenuNav} aria-label="Dashboard mobile navigation">
            {sidebarLinks.map((link) => (
              <div
                key={link.key}
                className={`${styles.mobileMenuItem} ${link.children?.length ? styles.mobileMenuGroup : ""} ${
                  openSections.includes(link.key) ? styles.mobileMenuGroupOpen : ""
                }`}
              >
                {link.children?.length ? (
                  <>
                    <button
                      type="button"
                      className={styles.mobileMenuGroupTrigger}
                      aria-expanded={openSections.includes(link.key)}
                      onClick={() => toggleSection(link.key)}
                    >
                      <span>{link.label}</span>
                      <span className={styles.mobileMenuGroupChevron} aria-hidden="true" />
                    </button>
                    <div
                      className={`${styles.mobileMenuSubnav} ${openSections.includes(link.key) ? styles.mobileMenuSubnavOpen : ""}`}
                      aria-hidden={!openSections.includes(link.key)}
                    >
                      {link.children.map((child) => (
                        <Link key={child.key} href={child.href} onClick={() => setMobileMenuOpen(false)} className={styles.mobileMenuSublink}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  link.locked ? (
                    <span
                      className={styles.mobileMenuLockedLink}
                      title="This module has not been enabled for your account"
                      aria-disabled="true"
                    >
                      <span>{link.label}</span>
                      <Image src="/icons/lock.svg" alt="" width={18} height={18} className={styles.mobileMenuLockIcon} />
                    </span>
                  ) : (
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            ))}
          </nav>

          <div className={styles.mobileMenuActions}>
            <button type="button" className={styles.mobileMenuLogout} onClick={() => void handleLogout()}>
              {logoutConfirmArmed ? "Confirm Logout" : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
