// hlm.js

(() => {
  const SCROLL_BOTTOM_THRESHOLD = 8;
  const SCROLL_IDLE_DELAY = 420;

  const prototypeShell = document.querySelector(".prototype-shell");
  const sidebarCollapseButton = document.querySelector(".sidebar-collapse-btn");

  const chatWorkspace = document.querySelector(".chat-workspace");
  const chatThread = document.querySelector(".chat-thread");
  const composerArea = document.querySelector(".composer-area");
  const chatComposer = document.querySelector(".chat-composer");
  const composerModelSettings = document.querySelector(".composer-model-settings");
  const chatInput = document.querySelector("#chatInput");
  const chatUpload = document.querySelector("#chatUpload");
  const uploadButton = document.querySelector(".composer-upload-btn");
  const expandButton = document.querySelector(".composer-expand-btn");

  const modelModeToggle = document.querySelector(".model-mode-toggle");
  const modelModeOptions = Array.from(document.querySelectorAll(".model-mode-option"));

  const modelSelect = document.querySelector(".model-select");
  const modelSelectTrigger = document.querySelector(".model-select-trigger");
  const currentModelName = document.querySelector(".current-model-name");
  const modelMenuItems = Array.from(document.querySelectorAll(".model-menu-item"));

  let chatScrollTimer;
  const activeComposerHoverZones = new Set();

  const isThreadAtBottom = () => {
    if (!chatThread) {
      return true;
    }

    const distanceFromBottom =
      chatThread.scrollHeight - chatThread.scrollTop - chatThread.clientHeight;

    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
  };

  const updateComposerHeight = () => {
    if (!chatWorkspace || !composerArea) {
      return;
    }

    chatWorkspace.style.setProperty("--composer-height", `${composerArea.offsetHeight}px`);
  };

  const updateComposerActivityState = () => {
    if (!composerArea || !chatInput) {
      return;
    }

    const hasText = chatInput.value.trim().length > 0;

    composerArea.classList.toggle("has-text", hasText);
    composerArea.classList.toggle("is-at-bottom", isThreadAtBottom());
  };

  const syncComposerState = () => {
    updateComposerHeight();
    updateComposerActivityState();
  };

  const updateComposerHoverState = () => {
    composerArea?.classList.toggle("is-control-hovered", activeComposerHoverZones.size > 0);
  };

  const registerComposerHoverZone = (zone) => {
    if (!zone) {
      return;
    }

    zone.addEventListener("pointerenter", () => {
      activeComposerHoverZones.add(zone);
      updateComposerHoverState();
    });

    zone.addEventListener("pointerleave", () => {
      activeComposerHoverZones.delete(zone);
      updateComposerHoverState();
    });
  };

  const resizeChatInput = () => {
    if (!chatInput) {
      return;
    }

    chatInput.style.height = "auto";

    const inputStyles = window.getComputedStyle(chatInput);
    const minHeight = Number.parseFloat(inputStyles.minHeight) || 60;
    const maxHeight = Number.parseFloat(inputStyles.maxHeight) || 156;
    const nextHeight = Math.min(Math.max(chatInput.scrollHeight, minHeight), maxHeight);

    chatInput.style.height = `${nextHeight}px`;
    chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? "auto" : "hidden";

    syncComposerState();
  };

  const setPromptExpanded = (shouldExpand) => {
    if (!composerArea || !expandButton) {
      return;
    }

    composerArea.classList.toggle("is-expanded", shouldExpand);
    expandButton.setAttribute("aria-expanded", String(shouldExpand));
    expandButton.setAttribute("aria-label", shouldExpand ? "Collapse prompt" : "Expand prompt");

    requestAnimationFrame(() => {
      resizeChatInput();
      chatInput?.focus();
    });
  };

  const submitComposer = () => {
    const message = chatInput?.value.trim();

    if (!message) {
      return;
    }

    chatInput.value = "";
    resizeChatInput();
    chatInput.focus();
  };

  const closeModelMenu = () => {
    modelSelect?.classList.remove("is-open");
    composerArea?.classList.remove("is-model-menu-open");
    modelSelectTrigger?.setAttribute("aria-expanded", "false");
  };

  const openModelMenu = () => {
    modelSelect?.classList.add("is-open");
    composerArea?.classList.add("is-model-menu-open");
    modelSelectTrigger?.setAttribute("aria-expanded", "true");
  };

  const toggleModelMenu = () => {
    const isOpen = modelSelect?.classList.toggle("is-open") ?? false;

    composerArea?.classList.toggle("is-model-menu-open", isOpen);
    modelSelectTrigger?.setAttribute("aria-expanded", String(isOpen));
  };

  const focusMenuItem = (direction = "first") => {
    if (!modelMenuItems.length) {
      return;
    }

    const currentIndex = modelMenuItems.indexOf(document.activeElement);
    let nextIndex = 0;

    if (direction === "last") {
      nextIndex = modelMenuItems.length - 1;
    }

    if (direction === "next") {
      nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modelMenuItems.length : 0;
    }

    if (direction === "previous") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : modelMenuItems.length - 1;
    }

    modelMenuItems[nextIndex]?.focus();
  };

  const handleSidebarToggle = () => {
    const isCollapsed = prototypeShell?.classList.toggle("is-sidebar-collapsed") ?? false;

    sidebarCollapseButton?.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarCollapseButton?.setAttribute(
      "aria-label",
      isCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );
  };

  const handleThreadScroll = () => {
    composerArea?.classList.add("is-thread-scrolling");
    updateComposerActivityState();

    window.clearTimeout(chatScrollTimer);

    chatScrollTimer = window.setTimeout(() => {
      composerArea?.classList.remove("is-thread-scrolling");
      updateComposerActivityState();
    }, SCROLL_IDLE_DELAY);
  };

  const handleModeSelection = (selectedOption) => {
    const activeMode = selectedOption.dataset.mode;

    if (!activeMode) {
      return;
    }

    modelModeToggle?.setAttribute("data-active", activeMode);

    modelModeOptions.forEach((option) => {
      option.setAttribute("aria-checked", String(option === selectedOption));
    });
  };

  const handleModelSelection = (selectedItem) => {
    const selectedModel = selectedItem.dataset.model;

    if (currentModelName && selectedModel) {
      currentModelName.textContent = selectedModel;
    }

    modelMenuItems.forEach((item) => {
      const isSelected = item === selectedItem;

      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-checked", String(isSelected));
    });

    closeModelMenu();
    modelSelectTrigger?.focus();
  };

  sidebarCollapseButton?.addEventListener("click", handleSidebarToggle);

  registerComposerHoverZone(chatComposer);
  registerComposerHoverZone(composerModelSettings);

  composerArea?.addEventListener("focusin", () => {
    composerArea.classList.add("is-control-focused");
  });

  composerArea?.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      composerArea.classList.toggle("is-control-focused", composerArea.contains(document.activeElement));
    });
  });

  chatThread?.addEventListener("scroll", handleThreadScroll);

  chatComposer?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitComposer();
  });

  chatInput?.addEventListener("input", resizeChatInput);

  chatInput?.addEventListener("focus", () => {
    composerArea?.classList.add("is-input-active");
    updateComposerActivityState();
  });

  chatInput?.addEventListener("blur", () => {
    composerArea?.classList.remove("is-input-active");
    updateComposerActivityState();
  });

  chatInput?.addEventListener("keydown", (event) => {
    const shouldSubmit = event.key === "Enter" && (event.ctrlKey || event.metaKey);

    if (!shouldSubmit) {
      return;
    }

    event.preventDefault();
    submitComposer();
  });

  uploadButton?.addEventListener("click", () => {
    chatUpload?.click();
  });

  expandButton?.addEventListener("click", () => {
    const shouldExpand = !composerArea?.classList.contains("is-expanded");

    setPromptExpanded(shouldExpand);
  });

  modelModeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      handleModeSelection(option);
    });
  });

  modelSelectTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleModelMenu();
  });

  modelSelectTrigger?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openModelMenu();
      focusMenuItem("first");
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openModelMenu();
      focusMenuItem("last");
    }
  });

  modelMenuItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      handleModelSelection(item);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusMenuItem("next");
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusMenuItem("previous");
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeModelMenu();
        modelSelectTrigger?.focus();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }

    if (!modelSelect?.contains(event.target)) {
      closeModelMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModelMenu();
    }
  });

  if (composerArea && "ResizeObserver" in window) {
    const composerResizeObserver = new ResizeObserver(syncComposerState);

    composerResizeObserver.observe(composerArea);
  }

  window.addEventListener("resize", () => {
    resizeChatInput();
    syncComposerState();
  });

  requestAnimationFrame(() => {
    resizeChatInput();
    syncComposerState();
  });
})();