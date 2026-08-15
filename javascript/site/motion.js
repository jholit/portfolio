(() => {
  const motionQuery = window.matchMedia(
    "(min-width: 75rem) and (prefers-reduced-motion: no-preference)",
  );
  const rootStyles = window.getComputedStyle(document.documentElement);

  const getDuration = (customProperty) => {
    const value = rootStyles.getPropertyValue(customProperty).trim();

    if (value.endsWith("ms")) {
      return Number.parseFloat(value) || 0;
    }

    if (value.endsWith("s")) {
      return (Number.parseFloat(value) || 0) * 1000;
    }

    return 0;
  };

  const pageTransitionDuration = getDuration("--site-page-transition-duration");
  const projectLoaderHoldDuration = getDuration(
    "--site-project-loader-hold-duration",
  );
  const projectLoaderContentDuration = getDuration(
    "--site-project-loader-content-duration",
  );
  let isTransitioning = false;

  const normalisePath = (path) =>
    path.replace(/\/index\.html$/i, "/").replace(/\/+/g, "/");

  const isSameDocumentHashLink = (url) =>
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    Boolean(url.hash);

  const isHolixProjectUrl = (url) =>
    normalisePath(url.pathname).endsWith("/page/holix-ai/");

  const isEnteringHolixProject = (url) =>
    isHolixProjectUrl(url) &&
    !isHolixProjectUrl(new URL(window.location.href));

  const shouldTransitionLink = (link, event) => {
    if (
      !motionQuery.matches ||
      isTransitioning ||
      event.defaultPrevented ||
      event.button !== 0
    ) {
      return false;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    if (link.target && link.target.toLowerCase() !== "_self") {
      return false;
    }

    if (link.hasAttribute("download")) {
      return false;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return !isSameDocumentHashLink(url);
  };

  const createProjectTransition = () => {
    const transition = document.createElement("div");
    transition.className = "project-transition";
    transition.setAttribute("role", "status");
    transition.setAttribute("aria-live", "polite");
    transition.setAttribute("aria-label", "Opening HLX Ai: Product Concept Design");

    const content = document.createElement("div");
    content.className = "project-transition__content";

    const loader = document.createElement("span");
    loader.className = "project-transition__loader";
    loader.setAttribute("aria-hidden", "true");

    const copy = document.createElement("div");
    copy.className = "project-transition__copy";

    const title = document.createElement("p");
    title.className = "project-transition__title";
    title.textContent = "HLX Ai";

    const subtitle = document.createElement("p");
    subtitle.className = "project-transition__subtitle";
    subtitle.textContent = "Product Concept Design";

    copy.append(title, subtitle);
    content.append(loader, copy);
    transition.append(content);
    document.body.append(transition);

    return transition;
  };

  const enterHolixProject = (url) => {
    isTransitioning = true;
    const transition = createProjectTransition();

    window.requestAnimationFrame(() => {
      transition.classList.add("is-visible");
    });

    window.setTimeout(() => {
      transition.classList.add("is-loading");
    }, pageTransitionDuration);

    window.setTimeout(() => {
      transition.classList.add("is-departing");
    }, pageTransitionDuration + projectLoaderHoldDuration);

    window.setTimeout(
      () => {
        window.location.assign(url.href);
      },
      pageTransitionDuration +
        projectLoaderHoldDuration +
        projectLoaderContentDuration,
    );
  };

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!link || !shouldTransitionLink(link, event)) {
      return;
    }

    const url = new URL(link.href, window.location.href);
    event.preventDefault();

    if (isEnteringHolixProject(url)) {
      enterHolixProject(url);
      return;
    }

    isTransitioning = true;
    document.body.classList.add("is-page-leaving");

    window.setTimeout(() => {
      window.location.assign(url.href);
    }, pageTransitionDuration);
  });

  window.addEventListener("pageshow", () => {
    isTransitioning = false;
    document.body.classList.remove("is-page-leaving");
    document.querySelector(".project-transition")?.remove();
  });
})();
