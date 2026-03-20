import styles from "./HsesLoaders.module.css";

export function LoadingRow({ label }: { label: string }) {
  return (
    <div className={styles.loadingRow}>
      <span className={styles.inlineSpinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = "5% 20% 15% 10% 15% 12.5% 12.5% 10%",
  showToolbar = true,
}: {
  rows?: number;
  columns?: string;
  showToolbar?: boolean;
}) {
  return (
    <div className={styles.shell}>
      {showToolbar ? (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.chip} />
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.button} />
            <div className={styles.button} />
          </div>
        </div>
      ) : null}

      <div className={styles.tableWrap} style={{ ["--loader-columns" as string]: columns }}>
        <div className={styles.tableHeader}>
          {Array.from({ length: columns.split(" ").length }).map((_, index) => (
            <div key={index} className={styles.tableHeaderCell} />
          ))}
        </div>
        <div className={styles.tableRows}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className={styles.tableRow}>
              {Array.from({ length: columns.split(" ").length }).map((__, cellIndex) => (
                <div key={cellIndex} className={cellIndex === columns.split(" ").length - 1 ? styles.tableCellTall : styles.tableCell} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className={styles.cards}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardLine} style={{ width: "34%" }} />
            <div className={styles.cardLine} style={{ width: "68%", height: 18 }} />
            <div className={styles.cardLine} style={{ width: "54%" }} />
            <div className={styles.cardLine} style={{ width: "100%" }} />
            <div className={styles.cardLine} style={{ width: "92%" }} />
            <div className={styles.cardLine} style={{ width: "80%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className={styles.detailGrid}>
      <div className={styles.headerBlock} />
      <div className={styles.detailCard} />
      <div className={styles.detailCard} style={{ minHeight: 260 }} />
    </div>
  );
}
