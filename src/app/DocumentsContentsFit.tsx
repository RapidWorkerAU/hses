"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "./HomePage.module.css";

type ContentsGroup = {
  index: string;
  heading: string;
  items: Array<{
    index: string;
    heading: string;
  }>;
};

const CONTENTS_GROUPS: ContentsGroup[] = [
  {
    index: "1",
    heading: "Core technical documents",
    items: [
      { index: "1.1", heading: "Procedures and work instructions" },
      { index: "1.2", heading: "Plans, standards and frameworks" },
      { index: "1.3", heading: "New documents or upgrades to existing documents" },
    ],
  },
  {
    index: "2",
    heading: "Built around the business",
    items: [
      { index: "2.1", heading: "Reflects how work is actually done" },
      { index: "2.2", heading: "Uses the language your people actually use" },
      { index: "2.3", heading: "Reviewed with the stakeholders responsible for the work" },
    ],
  },
  {
    index: "3",
    heading: "Technically credible",
    items: [
      { index: "3.1", heading: "Uses industry terms correctly" },
      { index: "3.2", heading: "Aligns with leading-practice controls" },
    ],
  },
];

export default function DocumentsContentsFit() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    let frame = 0;

    const fit = () => {
      const availableHeight = wrapper.clientHeight * 0.9;
      const availableWidth = wrapper.clientWidth;
      if (!availableHeight || !availableWidth) return;

      let low = 8;
      let high = 40;
      let best = low;

      while (high - low > 0.25) {
        const mid = (low + high) / 2;
        content.style.fontSize = `${mid}px`;

        const fitsHeight = content.scrollHeight <= availableHeight;
        const fitsWidth = content.scrollWidth <= availableWidth;

        if (fitsHeight && fitsWidth) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      content.style.fontSize = `${best}px`;
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(wrapper);

    scheduleFit();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.documentsTextColumn}>
      <div ref={contentRef} className={styles.documentsContents}>
        <p className={styles.documentsContentsTitle}>Contents</p>

        {CONTENTS_GROUPS.map((group) => (
          <div key={group.index} className={styles.documentsContentsGroup}>
            <div className={styles.documentsContentsRow}>
              <span className={styles.documentsContentsIndex}>{group.index}</span>
              <span className={styles.documentsContentsHeading}>{group.heading}</span>
            </div>

            {group.items.map((item) => (
              <div key={item.index} className={styles.documentsContentsSubrow}>
                <span className={styles.documentsContentsSubindex}>{item.index}</span>
                <span className={styles.documentsContentsSubheading}>{item.heading}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
