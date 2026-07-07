// site.js

(() => {
  const MOBILE_NAV_QUERY = "(max-width: 960px)";
  const MENU_TRANSITION_DURATION = 180;

  const body = document.body;
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".site-header__menu-toggle");
  const primaryNavigation = document.querySelector("#primary-navigation");
  const submenuItems = Array.from(document.querySelectorAll(".site-header__nav-item--has-submenu"));
  const submenuTriggers = Array.from(document.querySelectorAll(".site-header__nav-link--submenu-trigger"));
  const submenuLinks = Array.from(document.querySelectorAll(".site-header__submenu-link"));
  const mobileMediaQuery = window.matchMedia(MOBILE_NAV_QUERY);

  let menuTransitionTimer;

  const isMobileNavigation = () => mobileMediaQuery.matches;

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

  const isClickInsideHeader = (event) => {
    return event.target instanceof Node && siteHeader?.contains(event.target);
  };

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
    if (event.key !== "Escape") {
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

  resetNavigationState();
})();
