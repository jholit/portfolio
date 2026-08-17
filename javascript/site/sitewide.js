(() => {
  const compactExperienceQuery = window.matchMedia(
    "(max-width: 74.999rem), (hover: none) and (pointer: coarse)",
  );
  const siteHeader = document.querySelector(".site-header");
  const siteNavigation = document.querySelector("[data-site-navigation]");
  const siteMenuToggle = document.querySelector("[data-site-menu-toggle]");
  const contactMenuToggle = document.querySelector("[data-contact-menu-toggle]");
  const contactMenu = document.querySelector("[data-contact-menu]");
  let touchFeedbackTimer;

  const setContactMenu = (isOpen) => {
    if (!contactMenuToggle || !contactMenu) {
      return;
    }

    contactMenuToggle.setAttribute("aria-expanded", String(isOpen));
    contactMenu.hidden = !isOpen;
  };

  const closeSiteMenu = ({ returnFocus = false } = {}) => {
    if (!siteMenuToggle || !siteNavigation) {
      return;
    }

    document.body.classList.remove("has-open-menu");
    siteMenuToggle.setAttribute("aria-expanded", "false");
    siteMenuToggle.setAttribute("aria-label", "Open navigation menu");
    setContactMenu(false);

    if (returnFocus) {
      siteMenuToggle.focus();
    }
  };

  const openSiteMenu = () => {
    if (!siteMenuToggle || !siteNavigation || !compactExperienceQuery.matches) {
      return;
    }

    document.body.classList.add("has-open-menu");
    siteMenuToggle.setAttribute("aria-expanded", "true");
    siteMenuToggle.setAttribute("aria-label", "Close navigation menu");

    window.requestAnimationFrame(() => {
      siteNavigation.querySelector("a, button")?.focus();
    });
  };

  siteMenuToggle?.addEventListener("click", () => {
    const isOpen = siteMenuToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeSiteMenu({ returnFocus: true });
    } else {
      openSiteMenu();
    }
  });

  contactMenuToggle?.addEventListener("click", () => {
    const isOpen = contactMenuToggle.getAttribute("aria-expanded") === "true";
    setContactMenu(!isOpen);
  });

  siteNavigation?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeSiteMenu();
    }
  });

  // Keep compact navigation closed across full-page navigation and
  // back/forward cache restores. This prevents an open overlay from being
  // resurrected when the browser restores a previously visited page.
  window.addEventListener("pagehide", () => {
    closeSiteMenu();
  });

  window.addEventListener("pageshow", () => {
    closeSiteMenu();
  });

  compactExperienceQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      closeSiteMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("has-open-menu")) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSiteMenu({ returnFocus: true });
      return;
    }

    if (event.key !== "Tab" || !siteHeader) {
      return;
    }

    const focusableElements = Array.from(
      siteHeader.querySelectorAll("a[href], button:not([disabled])"),
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  const clearTouchFeedback = () => {
    window.clearTimeout(touchFeedbackTimer);
    document.querySelector(".is-touch-active")?.classList.remove("is-touch-active");
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!compactExperienceQuery.matches) {
        return;
      }

      const interactiveElement = event.target.closest(
        "a, button, [role='button'], summary",
      );

      if (!interactiveElement || interactiveElement.matches(":disabled")) {
        return;
      }

      clearTouchFeedback();
      interactiveElement.classList.add("is-touch-active");
    },
    true,
  );

  const scheduleTouchFeedbackClear = () => {
    window.clearTimeout(touchFeedbackTimer);
    touchFeedbackTimer = window.setTimeout(clearTouchFeedback, 180);
  };

  document.addEventListener("pointerup", scheduleTouchFeedbackClear, true);
  document.addEventListener("pointercancel", clearTouchFeedback, true);
  window.addEventListener("blur", clearTouchFeedback);

  const navigationLinks = document.querySelectorAll(
    ".site-navigation__item a[data-nav-active]",
  );

  const normalisePath = (path) => {
    const withoutIndex = path.replace(/\/index\.html$/i, "/");
    return withoutIndex.endsWith("/") ? withoutIndex : `${withoutIndex}/`;
  };

  if (navigationLinks.length) {
    const currentPath = normalisePath(window.location.pathname);

    navigationLinks.forEach((link) => {
      const linkUrl = new URL(link.href, window.location.href);
      const isCurrentPage = normalisePath(linkUrl.pathname) === currentPath;

      if (isCurrentPage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  const emailModal = document.querySelector("#email-modal");
  const emailModalOpenButtons = document.querySelectorAll(
    "[data-email-modal-open]",
  );

  if (!emailModal || !emailModalOpenButtons.length) {
    return;
  }

  const emailModalCloseButton = emailModal.querySelector(
    "[data-email-modal-close]",
  );
  const emailCopyButton = emailModal.querySelector("[data-email-copy]");
  const emailCopyIcon = emailModal.querySelector("[data-email-copy-icon]");
  const emailCopyStatus = emailModal.querySelector("[data-email-copy-status]");
  const modalMotionQuery = window.matchMedia(
    "(min-width: 75rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  const modalDurationValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--site-modal-transition-duration")
    .trim();
  const modalTransitionDuration = modalDurationValue.endsWith("ms")
    ? Number.parseFloat(modalDurationValue) || 0
    : (Number.parseFloat(modalDurationValue) || 0) * 1000;
  let emailCopyResetTimer;
  let emailModalCloseTimer;
  let emailModalReturnFocus;

  const resetEmailCopyFeedback = () => {
    window.clearTimeout(emailCopyResetTimer);
    emailCopyButton?.classList.remove("is-copied");
    emailCopyIcon?.classList.remove("is-wiggling");
  };

  const finishEmailModalClose = () => {
    window.clearTimeout(emailModalCloseTimer);
    emailModal.classList.remove("is-closing");

    if (emailModal.open) {
      emailModal.close();
    }
  };

  const closeEmailModal = () => {
    if (!emailModal.open || emailModal.classList.contains("is-closing")) {
      return;
    }

    if (!modalMotionQuery.matches) {
      finishEmailModalClose();
      return;
    }

    emailModal.classList.add("is-closing");
    emailModal.classList.remove("is-visible");

    emailModalCloseTimer = window.setTimeout(
      finishEmailModalClose,
      modalTransitionDuration,
    );
  };

  const copyEmailAddress = async () => {
    if (!emailCopyButton || !emailCopyStatus) {
      return;
    }

    const address = emailCopyButton.dataset.emailCopyAddress?.trim() || "";

    if (!address) {
      emailCopyStatus.textContent = "Unable to copy the email address automatically.";
      return;
    }

    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(address);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = address;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();

      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }

      textarea.remove();
    }

    emailCopyStatus.textContent = copied
      ? "Email copied!"
      : "Unable to copy the email address automatically.";

    if (!copied) {
      return;
    }

    window.clearTimeout(emailCopyResetTimer);
    emailCopyButton.classList.add("is-copied");

    if (emailCopyIcon) {
      emailCopyIcon.classList.remove("is-wiggling");
      void emailCopyIcon.offsetWidth;
      emailCopyIcon.classList.add("is-wiggling");
    }

    emailCopyResetTimer = window.setTimeout(() => {
      resetEmailCopyFeedback();
    }, 1400);
  };

  emailModalOpenButtons.forEach((emailModalOpenButton) => {
    emailModalOpenButton.addEventListener("click", () => {
      if (emailModal.open) {
        return;
      }

      emailModalReturnFocus = siteNavigation?.contains(emailModalOpenButton)
        ? siteMenuToggle
        : emailModalOpenButton;
      closeSiteMenu();
      window.clearTimeout(emailModalCloseTimer);
      emailModal.classList.remove("is-closing", "is-visible");
      emailModal.showModal();
      document.body.classList.add("has-open-modal");

      if (modalMotionQuery.matches) {
        void emailModal.offsetWidth;
      }

      emailModal.classList.add("is-visible");

      emailModalCloseButton?.focus();
    });
  });

  emailModalCloseButton?.addEventListener("click", closeEmailModal);
  emailCopyButton?.addEventListener("click", copyEmailAddress);

  emailModal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEmailModal();
  });

  emailModal.addEventListener("click", (event) => {
    if (event.target !== emailModal) {
      return;
    }

    const bounds = emailModal.getBoundingClientRect();
    const clickedInside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!clickedInside) {
      closeEmailModal();
    }
  });

  emailModal.addEventListener("close", () => {
    const returnFocusTarget = emailModalReturnFocus;
    emailModalReturnFocus = null;

    window.clearTimeout(emailModalCloseTimer);
    emailModal.classList.remove("is-visible", "is-closing");
    document.body.classList.remove("has-open-modal");
    resetEmailCopyFeedback();

    if (emailCopyStatus) {
      emailCopyStatus.textContent = "";
    }

    returnFocusTarget?.focus();
  });
})();
