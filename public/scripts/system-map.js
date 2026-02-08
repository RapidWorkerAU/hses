(() => {
  const svg = document.querySelector(".flow-map svg");
  if (!svg) return;

  const interactive = Array.from(
    svg.querySelectorAll(".data-point, .doc-item, .logic-point")
  );
  const allHighlightable = Array.from(
    svg.querySelectorAll(
      "[data-key], [data-keys], .data-arrow, .data-loop, .connector-create, .connector-use, .logic-link"
    )
  );

  let lockedKey = null;

  const getKeys = (el) => {
    const key = el.getAttribute("data-key");
    if (key) return [key];
    const keys = el.getAttribute("data-keys");
    if (!keys) return [];
    return keys
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const applyHighlight = (keys) => {
    const keySet = new Set(keys);
    allHighlightable.forEach((el) => {
      const elKeys = getKeys(el);
      if (elKeys.length === 0) {
        el.classList.remove("is-active", "is-muted");
        return;
      }
      const match = elKeys.some((k) => keySet.has(k));
      el.classList.toggle("is-active", match);
      el.classList.toggle("is-muted", !match);
    });
  };

  const clearHighlight = () => {
    allHighlightable.forEach((el) => {
      el.classList.remove("is-active", "is-muted");
    });
  };

  interactive.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (lockedKey) return;
      const keys = getKeys(el);
      if (keys.length) applyHighlight(keys);
    });
    el.addEventListener("mouseleave", () => {
      if (lockedKey) return;
      clearHighlight();
    });
    el.addEventListener("click", (event) => {
      if (!el.classList.contains("data-point")) {
        event.stopPropagation();
      }
    });
  });

  const dataPoints = Array.from(svg.querySelectorAll(".data-point"));
  dataPoints.forEach((point) => {
    point.addEventListener("click", (event) => {
      event.stopPropagation();
      const key = getKeys(point)[0];
      if (!key) return;
      if (lockedKey === key) {
        lockedKey = null;
        svg.classList.remove("is-locked");
        clearHighlight();
        return;
      }
      lockedKey = key;
      svg.classList.add("is-locked");
      applyHighlight([key]);
    });
  });

  svg.addEventListener("click", () => {
    if (!lockedKey) return;
    lockedKey = null;
    svg.classList.remove("is-locked");
    clearHighlight();
  });
})();
