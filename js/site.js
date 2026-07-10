// site.js

(() => {
  const MOBILE_NAV_QUERY = "(max-width: 960px)";
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  const MENU_TRANSITION_DURATION = 180;
  const PAGE_STYLESHEET_SELECTOR = "link[data-page-stylesheet]";
  const PAGE_SUPPORT_SELECTOR = "[data-page-support]";

  const body = document.body;
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".site-header__menu-toggle");
  const primaryNavigation = document.querySelector("#primary-navigation");
  const navigationLinks = Array.from(document.querySelectorAll(".site-header__nav-link[href]"));
  const submenuItems = Array.from(document.querySelectorAll(".site-header__nav-item--has-submenu"));
  const submenuTriggers = Array.from(document.querySelectorAll(".site-header__nav-link--submenu-trigger"));
  const submenuLinks = Array.from(document.querySelectorAll(".site-header__submenu-link"));
  const emailTriggers = Array.from(document.querySelectorAll(".site-footer__email-trigger"));
  const mobileMediaQuery = window.matchMedia(MOBILE_NAV_QUERY);
  const reducedMotionMediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

  const prefetchedUrls = new Set();
  const pageMarkupCache = new Map();

  let menuTransitionTimer;
  let scrollStateFrame;
  let isPageTransitioning = false;
  let activePageType = null;
  let navigationRequestId = 0;
  let emailModal = null;
  let pendingEmailAddress = null;
  let emailTriggerToRestoreFocus = null;
  let emailCopyResetTimer = null;

  const isMobileNavigation = () => mobileMediaQuery.matches;
  const prefersReducedMotion = () => reducedMotionMediaQuery.matches;

  const ensureTrailingSlash = (path) => {
    return path.endsWith("/") ? path : `${path}/`;
  };

  const getSiteRootPath = () => {
    const path = window.location.pathname;
    const pageIndex = path.indexOf("/page/");

    if (pageIndex !== -1) {
      return ensureTrailingSlash(path.slice(0, pageIndex));
    }

    return ensureTrailingSlash(path.replace(/index\.html$/i, ""));
  };

  const getNormalizedPath = (url) => {
    return url.pathname
      .replace(/\/index\.html$/i, "")
      .replace(/\/+$/i, "");
  };

  const getMainPageUrls = () => {
    const siteRootPath = getSiteRootPath();
    const origin = window.location.origin;

    return {
      home: new URL(siteRootPath, origin),
      about: new URL(`${siteRootPath}page/about/`, origin),
      career: new URL(`${siteRootPath}page/career/`, origin),
      "hlm-project": new URL(`${siteRootPath}page/hlm-project/`, origin),
    };
  };

  const getPortfolioPageType = (url) => {
    const normalizedPath = getNormalizedPath(url);
    const mainPageUrls = getMainPageUrls();

    return Object.entries(mainPageUrls).find(([, pageUrl]) => {
      return getNormalizedPath(pageUrl) === normalizedPath;
    })?.[0] ?? null;
  };

  const getPageContentCssUrl = (pageType) => {
    const siteRootPath = getSiteRootPath();
    const pageCssByType = {
      home: "css/page/home-content.css",
      about: "css/page/about-content.css",
      career: "css/page/career-content.css",
      "hlm-project": "css/page/project-content.css",
    };

    const cssPath = pageCssByType[pageType];

    if (!cssPath) {
      return null;
    }

    return new URL(`${siteRootPath}${cssPath}`, window.location.origin);
  };

  const getCssTimeValue = (customPropertyName, fallbackDuration = 200) => {
    const rawValue = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(customPropertyName)
      .trim();

    if (!rawValue) {
      return fallbackDuration;
    }

    if (rawValue.endsWith("ms")) {
      return Number.parseFloat(rawValue) || fallbackDuration;
    }

    if (rawValue.endsWith("s")) {
      return (Number.parseFloat(rawValue) || fallbackDuration / 1000) * 1000;
    }

    return Number.parseFloat(rawValue) || fallbackDuration;
  };

  const getPageTransitionDuration = () => {
    if (prefersReducedMotion()) {
      return 0;
    }

    return getCssTimeValue("--page-transition-duration", 200);
  };

  const getFocusableElements = (container) => {
    if (!(container instanceof HTMLElement)) {
      return [];
    }

    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => {
      return element instanceof HTMLElement && element.getClientRects().length > 0;
    });
  };

  const createEmailModal = () => {
    if (emailModal || emailTriggers.length === 0) {
      return emailModal;
    }

    emailModal = document.createElement("div");
    emailModal.className = "email-modal";
    emailModal.id = "email-confirmation-modal";
    emailModal.setAttribute("role", "dialog");
    emailModal.setAttribute("aria-modal", "true");
    emailModal.setAttribute("aria-hidden", "true");
    emailModal.setAttribute("aria-labelledby", "email-modal-title");
    emailModal.setAttribute(
      "aria-describedby",
      "email-modal-description email-modal-choice-label"
    );

    emailModal.innerHTML = `
      <div class="email-modal__overlay" data-email-modal-close></div>

      <div class="email-modal__dialog" role="document">
        <button
          class="email-modal__close"
          type="button"
          data-email-modal-close
          aria-label="Close email options"
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z"/>
          </svg>
        </button>

        <h2 class="email-modal__title" id="email-modal-title">
          Choose Your Email Service
        </h2>

        <p class="email-modal__text" id="email-modal-description">
          These options open a third-party email service outside the portfolio. The portfolio does not send or store any email information.
        </p>

        <p class="email-modal__choice-label" id="email-modal-choice-label">
          Choose the following below:
        </p>

        <div class="email-modal__services" aria-label="Email service options">
          <a
            class="email-modal__option"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            data-email-service="gmail"
            aria-label="Compose an email in Gmail"
          >
            <svg class="email-modal__option-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M20 18h-2V8.25L12 12 6 8.25V18H4V6h1.2l6.8 4.5L18.8 6H20v12Z"/>
            </svg>
            <span>Gmail</span>
          </a>

          <a
            class="email-modal__option"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            data-email-service="outlook"
            aria-label="Compose an email in Outlook"
          >
            <svg class="email-modal__option-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M3 3h10v4h8v12h-8v2H3V3Zm10 6v8h6V9h-6Zm-5 7c2 0 3.5-1.7 3.5-4S10 8 8 8s-3.5 1.7-3.5 4S6 16 8 16Zm0-2c-.8 0-1.5-.9-1.5-2S7.2 10 8 10s1.5.9 1.5 2S8.8 14 8 14Z"/>
            </svg>
            <span>Outlook</span>
          </a>

          <button
            class="email-modal__option"
            type="button"
            data-email-copy
            aria-label="Copy Jaqweal Holit's email address"
          >
            <svg class="email-modal__option-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M16.5 6.5V17a4.5 4.5 0 0 1-9 0V5.5a3 3 0 0 1 6 0V16a1.5 1.5 0 0 1-3 0V6.5H12V16a.5.5 0 0 0 1 0V5.5a2 2 0 0 0-4 0V17a3.5 3.5 0 0 0 7 0V6.5h1.5Z"/>
            </svg>
            <span data-email-copy-label>Copy Email</span>
          </button>
        </div>

        <p class="email-modal__status" data-email-copy-status aria-live="polite"></p>
      </div>
    `;

    body.append(emailModal);
    return emailModal;
  };

  const isEmailModalOpen = () => {
    return emailModal?.classList.contains("is-open") ?? false;
  };

  const resetEmailCopyFeedback = () => {
    if (!emailModal) {
      return;
    }

    window.clearTimeout(emailCopyResetTimer);
    emailCopyResetTimer = null;

    const copyLabel = emailModal.querySelector("[data-email-copy-label]");
    const copyStatus = emailModal.querySelector("[data-email-copy-status]");

    if (copyLabel) {
      copyLabel.textContent = "Copy Email";
    }

    if (copyStatus) {
      copyStatus.textContent = "";
    }
  };

  const setEmailServiceLinks = (emailAddress) => {
    if (!emailModal) {
      return;
    }

    const encodedEmailAddress = encodeURIComponent(emailAddress);
    const gmailLink = emailModal.querySelector('[data-email-service="gmail"]');
    const outlookLink = emailModal.querySelector('[data-email-service="outlook"]');

    gmailLink?.setAttribute(
      "href",
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmailAddress}`
    );
    outlookLink?.setAttribute(
      "href",
      `https://outlook.office.com/mail/deeplink/compose?to=${encodedEmailAddress}`
    );
  };

  const openEmailModal = (trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const emailAddress = trigger.dataset.emailAddress?.trim();
    const modal = createEmailModal();

    if (!emailAddress || !modal) {
      return;
    }

    pendingEmailAddress = emailAddress;
    emailTriggerToRestoreFocus = trigger;
    setEmailServiceLinks(emailAddress);
    resetEmailCopyFeedback();

    if (siteHeader?.classList.contains("is-menu-open")) {
      setMenuState(false);
    }

    closeAllSubmenus();
    body.classList.add("has-email-modal-open");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      modal.querySelector(".email-modal__option")?.focus();
    });
  };

  const closeEmailModal = ({ restoreFocus = true } = {}) => {
    if (!emailModal) {
      return;
    }

    emailModal.classList.remove("is-open");
    emailModal.setAttribute("aria-hidden", "true");
    body.classList.remove("has-email-modal-open");
    pendingEmailAddress = null;
    resetEmailCopyFeedback();

    if (restoreFocus && emailTriggerToRestoreFocus instanceof HTMLElement) {
      emailTriggerToRestoreFocus.focus();
    }

    emailTriggerToRestoreFocus = null;
  };

  const copyTextWithFallback = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    body.append(textArea);
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      textArea.remove();
    }

    return copied;
  };

  const copyEmailAddress = async () => {
    if (!emailModal || !pendingEmailAddress) {
      return;
    }

    const emailAddress = pendingEmailAddress;
    const copyLabel = emailModal.querySelector("[data-email-copy-label]");
    const copyStatus = emailModal.querySelector("[data-email-copy-status]");
    let copied = false;

    try {
      if (!navigator.clipboard?.writeText || !window.isSecureContext) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(emailAddress);
      copied = true;
    } catch {
      copied = copyTextWithFallback(emailAddress);
    }

    window.clearTimeout(emailCopyResetTimer);

    if (copyLabel) {
      copyLabel.textContent = copied ? "Email Copied" : "Copy Failed";
    }

    if (copyStatus) {
      copyStatus.textContent = copied
        ? `${emailAddress} copied to your clipboard.`
        : `Unable to copy automatically. Email: ${emailAddress}`;
    }

    emailCopyResetTimer = window.setTimeout(resetEmailCopyFeedback, 2800);
  };

  const handleEmailModalClick = (event) => {
    if (!isEmailModalOpen() || !(event.target instanceof Element)) {
      return;
    }

    if (event.target.closest("[data-email-service]")) {
      window.setTimeout(() => {
        closeEmailModal({ restoreFocus: false });
      }, 0);
      return;
    }

    if (event.target.closest("[data-email-copy]")) {
      event.preventDefault();
      void copyEmailAddress();
      return;
    }

    if (event.target.closest("[data-email-modal-close]")) {
      event.preventDefault();
      closeEmailModal();
    }
  };

  const handleEmailModalKeydown = (event) => {
    if (!isEmailModalOpen() || !emailModal) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeEmailModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(emailModal);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (!firstFocusableElement || !lastFocusableElement) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  const appendPrefetchLink = (url, assetType = "document") => {
    const href = url.href;

    if (prefetchedUrls.has(href)) {
      return;
    }

    const prefetchLink = document.createElement("link");
    prefetchLink.rel = "prefetch";
    prefetchLink.href = href;

    if (assetType) {
      prefetchLink.as = assetType;
    }

    document.head.append(prefetchLink);
    prefetchedUrls.add(href);
  };

  const prefetchPortfolioPage = (url) => {
    const pageType = getPortfolioPageType(url);

    if (!pageType || url.origin !== window.location.origin) {
      return;
    }

    void getPortfolioPageMarkup(url).catch(() => {});

    const cssUrl = getPageContentCssUrl(pageType);

    if (cssUrl) {
      appendPrefetchLink(cssUrl, "style");
    }
  };

  const prefetchPortfolioPages = () => {
    const currentPageType = getPortfolioPageType(new URL(window.location.href));
    const mainPageUrls = getMainPageUrls();

    Object.entries(mainPageUrls).forEach(([pageType, pageUrl]) => {
      if (pageType !== currentPageType) {
        prefetchPortfolioPage(pageUrl);
      }
    });
  };

  const schedulePortfolioPrefetch = () => {
    if (isMobileNavigation()) {
      return;
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetchPortfolioPages, { timeout: 1200 });
      return;
    }

    window.setTimeout(prefetchPortfolioPages, 350);
  };

  const isModifiedNavigationClick = (event) => {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  };

  const getPortfolioPageRequestUrl = (url) => {
    const requestUrl = new URL(url.href);

    requestUrl.hash = "";
    return requestUrl;
  };

  const getPortfolioPageMarkup = (url) => {
    const requestUrl = getPortfolioPageRequestUrl(url);
    const cacheKey = requestUrl.href;

    if (!pageMarkupCache.has(cacheKey)) {
      const request = window
        .fetch(requestUrl.href, {
          credentials: "same-origin",
          headers: {
            Accept: "text/html",
          },
        })
        .then((response) => {
          const contentType = response.headers.get("content-type") ?? "";

          if (!response.ok || !contentType.includes("text/html")) {
            throw new Error(`Unable to load portfolio page: ${response.status}`);
          }

          return response.text();
        })
        .catch((error) => {
          pageMarkupCache.delete(cacheKey);
          throw error;
        });

      pageMarkupCache.set(cacheKey, request);
    }

    return pageMarkupCache.get(cacheKey);
  };

  const getPortfolioPageDocument = async (url) => {
    const markup = await getPortfolioPageMarkup(url);
    const pageDocument = new DOMParser().parseFromString(markup, "text/html");

    if (!pageDocument.querySelector("main") || !pageDocument.querySelector(PAGE_STYLESHEET_SELECTOR)) {
      throw new Error("The requested portfolio page is missing required content.");
    }

    return pageDocument;
  };

  const waitFor = (duration) => {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  };

  const makeUrlAttributeAbsolute = (element, attributeName, baseUrl) => {
    const value = element.getAttribute(attributeName)?.trim();

    if (!value || value.startsWith("#")) {
      return;
    }

    try {
      element.setAttribute(attributeName, new URL(value, baseUrl).href);
    } catch {
      // Preserve browser-supported values that are not standard URLs.
    }
  };

  const makePageUrlsAbsolute = (container, baseUrl) => {
    if (!(container instanceof Element)) {
      return;
    }

    container.querySelectorAll("[href], [src], [action], [poster]").forEach((element) => {
      ["href", "src", "action", "poster"].forEach((attributeName) => {
        if (element.hasAttribute(attributeName)) {
          makeUrlAttributeAbsolute(element, attributeName, baseUrl);
        }
      });
    });
  };

  const makePersistentUrlsAbsolute = () => {
    const currentUrl = new URL(window.location.href);

    document.head.querySelectorAll("link[href]").forEach((link) => {
      makeUrlAttributeAbsolute(link, "href", currentUrl);
    });

    makePageUrlsAbsolute(siteHeader, currentUrl);
    makePageUrlsAbsolute(document.querySelector(".site-footer"), currentUrl);
  };

  const getHistoryState = () => {
    return history.state && typeof history.state === "object" ? history.state : {};
  };

  const saveCurrentScrollPosition = () => {
    history.replaceState(
      {
        ...getHistoryState(),
        portfolioNavigation: true,
        pageType: activePageType,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      "",
      window.location.href
    );
  };

  const scheduleScrollPositionSave = () => {
    if (scrollStateFrame) {
      return;
    }

    scrollStateFrame = window.requestAnimationFrame(() => {
      scrollStateFrame = null;

      if (!isPageTransitioning) {
        saveCurrentScrollPosition();
      }
    });
  };

  const initializeNavigationHistory = () => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    history.replaceState(
      {
        ...getHistoryState(),
        portfolioNavigation: true,
        pageType: activePageType,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      "",
      window.location.href
    );
  };

  const preparePageStylesheet = (pageDocument, destination) => {
    const stylesheetTemplate = pageDocument.querySelector(PAGE_STYLESHEET_SELECTOR);
    const currentStylesheet = document.querySelector(PAGE_STYLESHEET_SELECTOR);
    const stylesheetHref = new URL(stylesheetTemplate.getAttribute("href"), destination.href).href;

    if (currentStylesheet?.href === stylesheetHref) {
      return Promise.resolve({
        inserted: false,
        nextStylesheet: currentStylesheet,
        previousStylesheet: null,
      });
    }

    const nextStylesheet = document.createElement("link");

    Array.from(stylesheetTemplate.attributes).forEach((attribute) => {
      nextStylesheet.setAttribute(attribute.name, attribute.value);
    });

    nextStylesheet.href = stylesheetHref;

    return new Promise((resolve, reject) => {
      nextStylesheet.addEventListener(
        "load",
        () => {
          resolve({
            inserted: true,
            nextStylesheet,
            previousStylesheet: currentStylesheet,
          });
        },
        { once: true }
      );

      nextStylesheet.addEventListener(
        "error",
        () => {
          nextStylesheet.remove();
          reject(new Error("Unable to load the page stylesheet."));
        },
        { once: true }
      );

      document.head.append(nextStylesheet);
    });
  };

  const replacePageSupport = (pageDocument, destination) => {
    document.querySelectorAll(PAGE_SUPPORT_SELECTOR).forEach((element) => {
      element.remove();
    });

    const supportElements = Array.from(pageDocument.body.querySelectorAll(PAGE_SUPPORT_SELECTOR));

    supportElements.forEach((supportElement) => {
      const importedSupportElement = document.importNode(supportElement, true);

      makePageUrlsAbsolute(importedSupportElement, destination);
      siteHeader?.before(importedSupportElement);
    });
  };

  const updatePageMetadata = (pageDocument) => {
    const nextDescription = pageDocument.querySelector('meta[name="description"]');
    const currentDescription = document.querySelector('meta[name="description"]');

    document.title = pageDocument.title;

    if (nextDescription && currentDescription) {
      currentDescription.setAttribute("content", nextDescription.getAttribute("content") ?? "");
    }
  };

  const updateCurrentPageIndicator = (pageType) => {
    if (!siteHeader) {
      return;
    }

    siteHeader.querySelectorAll('[aria-current="page"]').forEach((element) => {
      element.removeAttribute("aria-current");
    });

    if (pageType === "home") {
      siteHeader.querySelector(".site-header__logo")?.setAttribute("aria-current", "page");
      return;
    }

    const currentPageLink = Array.from(siteHeader.querySelectorAll("a[href]")).find((link) => {
      return getPortfolioPageType(new URL(link.href, window.location.href)) === pageType;
    });

    currentPageLink?.setAttribute("aria-current", "page");
  };

  const replacePageContent = (pageDocument, destination, pageType) => {
    const currentMain = document.querySelector("main");
    const nextMainTemplate = pageDocument.querySelector("main");

    if (!currentMain || !nextMainTemplate) {
      throw new Error("The requested portfolio page cannot replace the current content.");
    }

    const nextMain = document.importNode(nextMainTemplate, true);

    makePageUrlsAbsolute(nextMain, destination);
    replacePageSupport(pageDocument, destination);
    updatePageMetadata(pageDocument);
    updateCurrentPageIndicator(pageType);
    currentMain.replaceWith(nextMain);

    return nextMain;
  };

  const restorePagePosition = (main, scrollPosition, shouldFocusMain) => {
    window.scrollTo(scrollPosition.x, scrollPosition.y);

    if (!shouldFocusMain) {
      return;
    }

    main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
  };

  const isSamePageHashLink = (destination) => {
    return (
      destination.origin === window.location.origin &&
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash
    );
  };

  const shouldHandlePageNavigation = (event, link) => {
    if (!(link instanceof HTMLAnchorElement) || isModifiedNavigationClick(event)) {
      return false;
    }

    if (link.target && link.target !== "_self") {
      return false;
    }

    if (link.hasAttribute("download")) {
      return false;
    }

    const destination = new URL(link.href, window.location.href);

    if (destination.origin !== window.location.origin || isSamePageHashLink(destination)) {
      return false;
    }

    const destinationPageType = getPortfolioPageType(destination);

    return Boolean(activePageType && destinationPageType && activePageType !== destinationPageType);
  };

  const navigateToPortfolioPage = async (
    destination,
    { historyMode = "push", scrollPosition = { x: 0, y: 0 } } = {}
  ) => {
    const destinationPageType = getPortfolioPageType(destination);

    if (!destinationPageType || destinationPageType === activePageType) {
      return;
    }

    const requestId = ++navigationRequestId;
    const shouldAnimate = !isMobileNavigation() && !prefersReducedMotion();

    isPageTransitioning = true;
    body.classList.add("is-page-transitioning");

    let stylesheetChange = null;

    try {
      const pageDocument = await getPortfolioPageDocument(destination);

      if (requestId !== navigationRequestId) {
        return;
      }

      stylesheetChange = await preparePageStylesheet(pageDocument, destination);

      if (requestId !== navigationRequestId) {
        stylesheetChange.inserted && stylesheetChange.nextStylesheet.remove();
        return;
      }

      if (shouldAnimate) {
        body.classList.add("page-motion-exit-fade");
        await waitFor(getPageTransitionDuration());
      }

      if (requestId !== navigationRequestId) {
        stylesheetChange.inserted && stylesheetChange.nextStylesheet.remove();
        return;
      }

      if (historyMode === "push") {
        saveCurrentScrollPosition();
        history.pushState(
          {
            portfolioNavigation: true,
            pageType: destinationPageType,
            scrollX: 0,
            scrollY: 0,
          },
          "",
          destination.href
        );
      }

      const nextMain = replacePageContent(pageDocument, destination, destinationPageType);

      stylesheetChange.previousStylesheet?.remove();
      activePageType = destinationPageType;
      body.classList.remove("page-motion-exit-fade", "is-page-transitioning");
      restorePagePosition(nextMain, scrollPosition, historyMode === "push");
    } catch {
      if (stylesheetChange?.inserted) {
        stylesheetChange.nextStylesheet.remove();
      }

      body.classList.remove("page-motion-exit-fade", "is-page-transitioning");
      isPageTransitioning = false;

      if (historyMode === "pop") {
        window.location.reload();
      } else {
        window.location.assign(destination.href);
      }

      return;
    } finally {
      if (requestId === navigationRequestId) {
        isPageTransitioning = false;
      }
    }
  };

  const handlePageNavigationClick = (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;

    if (!shouldHandlePageNavigation(event, link)) {
      return;
    }

    event.preventDefault();

    if (isPageTransitioning) {
      return;
    }

    const destination = new URL(link.href, window.location.href);

    prefetchPortfolioPage(destination);
    closeAllSubmenus();
    setMenuState(false);

    void navigateToPortfolioPage(destination);
  };

  const handlePageTransitionPrefetch = (event) => {
    if (isMobileNavigation()) {
      return;
    }

    const link = event.target instanceof Element ? event.target.closest("a") : null;

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const destination = new URL(link.href, window.location.href);

    if (getPortfolioPageType(destination)) {
      prefetchPortfolioPage(destination);
    }
  };

  const setMenuTransitionState = (isActive) => {
    if (!siteHeader) {
      return;
    }

    window.clearTimeout(menuTransitionTimer);
    siteHeader.classList.add("is-menu-active");

    if (!isActive) {
      menuTransitionTimer = window.setTimeout(() => {
        siteHeader.classList.remove("is-menu-active");
      }, MENU_TRANSITION_DURATION);
    }
  };

  const setMenuState = (shouldOpen) => {
    if (!siteHeader || !menuToggle || !primaryNavigation) {
      return;
    }

    setMenuTransitionState(shouldOpen);

    siteHeader.classList.toggle("is-menu-open", shouldOpen);
    body.classList.toggle("has-mobile-menu-open", shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    primaryNavigation.setAttribute("aria-hidden", String(isMobileNavigation() && !shouldOpen));

    if (!shouldOpen) {
      closeAllSubmenus();
    }
  };

  const setSubmenuState = (submenuItem, shouldOpen) => {
    if (!submenuItem) {
      return;
    }

    const submenuTrigger = submenuItem.querySelector(".site-header__nav-link--submenu-trigger");
    const submenu = submenuItem.querySelector(".site-header__submenu");

    submenuItem.classList.toggle("is-submenu-open", shouldOpen);
    submenuTrigger?.setAttribute("aria-expanded", String(shouldOpen));
    submenu?.setAttribute("aria-hidden", String(!shouldOpen));
  };

  const closeAllSubmenus = (exception = null) => {
    submenuItems.forEach((submenuItem) => {
      if (submenuItem !== exception) {
        setSubmenuState(submenuItem, false);
      }
    });
  };

  const toggleSubmenu = (submenuItem) => {
    const shouldOpen = !submenuItem.classList.contains("is-submenu-open");

    closeAllSubmenus(submenuItem);
    setSubmenuState(submenuItem, shouldOpen);
  };

  const resetNavigationState = () => {
    if (!siteHeader || !menuToggle || !primaryNavigation) {
      return;
    }

    window.clearTimeout(menuTransitionTimer);
    siteHeader.classList.remove("is-menu-open", "is-menu-active");
    body.classList.remove("has-mobile-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    primaryNavigation.setAttribute("aria-hidden", String(isMobileNavigation()));
    closeAllSubmenus();
  };

  const resetTransientPageState = () => {
    isPageTransitioning = false;
    activePageType = getPortfolioPageType(new URL(window.location.href));
    body.classList.remove("page-motion-exit-fade", "is-page-transitioning");
    updateCurrentPageIndicator(activePageType);
    resetNavigationState();
    closeEmailModal({ restoreFocus: false });
  };

  const handleHistoryNavigation = (event) => {
    const destination = new URL(window.location.href);
    const destinationPageType = getPortfolioPageType(destination);

    if (!destinationPageType || destinationPageType === activePageType) {
      return;
    }

    if (scrollStateFrame) {
      window.cancelAnimationFrame(scrollStateFrame);
      scrollStateFrame = null;
    }

    if (isPageTransitioning) {
      navigationRequestId += 1;
      isPageTransitioning = false;
      body.classList.remove("page-motion-exit-fade", "is-page-transitioning");
    }

    const state = event.state && typeof event.state === "object" ? event.state : {};
    const scrollPosition = {
      x: Number.isFinite(state.scrollX) ? state.scrollX : 0,
      y: Number.isFinite(state.scrollY) ? state.scrollY : 0,
    };

    void navigateToPortfolioPage(destination, {
      historyMode: "pop",
      scrollPosition,
    });
  };

  const isClickInsideHeader = (event) => {
    return event.target instanceof Node && siteHeader?.contains(event.target);
  };

  emailTriggers.forEach((emailTrigger) => {
    emailTrigger.addEventListener("click", () => {
      openEmailModal(emailTrigger);
    });
  });

  navigationLinks.forEach((navigationLink) => {
    navigationLink.addEventListener("click", () => {
      if (isMobileNavigation()) {
        setMenuState(false);
      }
    });
  });

  menuToggle?.addEventListener("click", () => {
    const shouldOpen = !siteHeader?.classList.contains("is-menu-open");

    setMenuState(shouldOpen);
  });

  submenuTriggers.forEach((submenuTrigger) => {
    const submenuItem = submenuTrigger.closest(".site-header__nav-item--has-submenu");

    submenuTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSubmenu(submenuItem);
    });

    submenuTrigger.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") {
        return;
      }

      event.preventDefault();
      closeAllSubmenus(submenuItem);
      setSubmenuState(submenuItem, true);
      submenuItem?.querySelector(".site-header__submenu-link")?.focus();
    });
  });

  submenuItems.forEach((submenuItem) => {
    submenuItem.addEventListener("mouseenter", () => {
      if (isMobileNavigation()) {
        return;
      }

      closeAllSubmenus(submenuItem);
      setSubmenuState(submenuItem, true);
    });

    submenuItem.addEventListener("mouseleave", () => {
      if (isMobileNavigation()) {
        return;
      }

      setSubmenuState(submenuItem, false);
    });

    submenuItem.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (isMobileNavigation() || submenuItem.contains(document.activeElement)) {
          return;
        }

        setSubmenuState(submenuItem, false);
      });
    });
  });

  submenuLinks.forEach((submenuLink) => {
    submenuLink.addEventListener("click", () => {
      if (isMobileNavigation()) {
        setMenuState(false);
      } else {
        closeAllSubmenus();
      }
    });
  });

  document.addEventListener("pointerenter", handlePageTransitionPrefetch, true);
  document.addEventListener("focusin", handlePageTransitionPrefetch);
  document.addEventListener("touchstart", handlePageTransitionPrefetch, { passive: true });
  document.addEventListener("click", handlePageNavigationClick);
  document.addEventListener("click", handleEmailModalClick);
  document.addEventListener("keydown", handleEmailModalKeydown);

  document.addEventListener("click", (event) => {
    if (isClickInsideHeader(event)) {
      return;
    }

    if (siteHeader?.classList.contains("is-menu-open")) {
      setMenuState(false);
      return;
    }

    closeAllSubmenus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.key !== "Escape") {
      return;
    }

    const wasMenuOpen = siteHeader?.classList.contains("is-menu-open") ?? false;

    setMenuState(false);
    closeAllSubmenus();

    if (wasMenuOpen) {
      menuToggle?.focus();
    }
  });

  if (typeof mobileMediaQuery.addEventListener === "function") {
    mobileMediaQuery.addEventListener("change", resetNavigationState);
  } else if (typeof mobileMediaQuery.addListener === "function") {
    mobileMediaQuery.addListener(resetNavigationState);
  }

  window.addEventListener("pagehide", () => {
    saveCurrentScrollPosition();
    resetNavigationState();
    closeEmailModal({ restoreFocus: false });
  });

  window.addEventListener("popstate", handleHistoryNavigation);
  window.addEventListener("pageshow", resetTransientPageState);
  window.addEventListener("scroll", scheduleScrollPositionSave, { passive: true });

  makePersistentUrlsAbsolute();
  activePageType = getPortfolioPageType(new URL(window.location.href));
  initializeNavigationHistory();
  createEmailModal();
  resetNavigationState();
  schedulePortfolioPrefetch();
})();
