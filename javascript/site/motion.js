(() => {
  const motionQuery = window.matchMedia(
    "(min-width: 75rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
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

  const projectTransitions = [
    {
      path: "/page/holix-ai/",
      title: "HOLIX Ai",
      subtitle: "Independent Product Design Project",
    },
    {
      path: "/page/gup/",
      title: "Gamers Ultra Plus",
      subtitle: "E-commerce Product Design Project",
    },
  ];

  const getProjectTransition = (url) =>
    projectTransitions.find(({ path }) =>
      normalisePath(url.pathname).endsWith(path),
    ) || null;

  const isEnteringProject = (url, project) =>
    Boolean(project) &&
    !normalisePath(window.location.pathname).endsWith(project.path);

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

  const createProjectTransition = (project) => {
    const transition = document.createElement("div");
    transition.className = "project-transition";
    transition.setAttribute("role", "status");
    transition.setAttribute("aria-live", "polite");
    transition.setAttribute(
      "aria-label",
      `Opening ${project.title}: ${project.subtitle}`,
    );

    const content = document.createElement("div");
    content.className = "project-transition__content";

    const loader = document.createElement("span");
    loader.className = "project-transition__loader";
    loader.setAttribute("aria-hidden", "true");

    const copy = document.createElement("div");
    copy.className = "project-transition__copy";

    const title = document.createElement("p");
    title.className = "project-transition__title";
    title.textContent = project.title;

    const subtitle = document.createElement("p");
    subtitle.className = "project-transition__subtitle";
    subtitle.textContent = project.subtitle;

    copy.append(title, subtitle);
    content.append(loader, copy);
    transition.append(content);
    document.body.append(transition);

    return transition;
  };

  const enterProject = (url, project) => {
    isTransitioning = true;
    const transition = createProjectTransition(project);

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

    const project = getProjectTransition(url);

    if (isEnteringProject(url, project)) {
      enterProject(url, project);
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
