(() => {
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
  const emailModalOpenButton = document.querySelector("[data-email-modal-open]");

  if (!emailModal || !emailModalOpenButton) {
    return;
  }

  const emailModalCloseButton = emailModal.querySelector(
    "[data-email-modal-close]",
  );
  const emailCopyButton = emailModal.querySelector("[data-email-copy]");
  const emailCopyIcon = emailModal.querySelector("[data-email-copy-icon]");
  const emailCopyStatus = emailModal.querySelector("[data-email-copy-status]");
  const modalMotionQuery = window.matchMedia(
    "(min-width: 75rem) and (prefers-reduced-motion: no-preference)",
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

  emailModalOpenButton.addEventListener("click", () => {
    if (emailModal.open) {
      return;
    }

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
    window.clearTimeout(emailModalCloseTimer);
    emailModal.classList.remove("is-visible", "is-closing");
    document.body.classList.remove("has-open-modal");
    resetEmailCopyFeedback();

    if (emailCopyStatus) {
      emailCopyStatus.textContent = "";
    }

    emailModalOpenButton.focus();
  });
})();
