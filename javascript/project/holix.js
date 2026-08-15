// holix.js

(() => {
  const conceptModal = document.querySelector("#concept-modal");
  const conceptModalCloseButtons = [
    ...document.querySelectorAll("[data-concept-modal-close]"),
  ];
  const conceptModalDialog = conceptModal?.querySelector(
    ".concept-modal__dialog",
  );
  const conceptModalTrigger = document.querySelector("#concept-modal-trigger");
  const composerArea = document.querySelector(".composer-area");
  const composerDock = document.querySelector(".composer-dock");
  const chatComposer = document.querySelector(".chat-composer");
  const chatThread = document.querySelector(".chat-thread");
  const chatWorkspace = document.querySelector(".chat-workspace");
  const chatInput = document.querySelector("#chatInput");
  const modelSettings = document.querySelector(".composer-model-settings");
  const modelModeToggle = document.querySelector(".model-mode-toggle");
  const modelModeOptions = [...document.querySelectorAll(".model-mode-input")];
  const modelSelect = document.querySelector(".model-select");
  const modelSelectTrigger = document.querySelector(".model-select-trigger");
  const modelMenu = document.querySelector(".model-menu");
  const currentModelName = document.querySelector(".current-model-name");
  const modelMenuItems = [...document.querySelectorAll(".model-menu-item")];
  const prototypeShell = document.querySelector(".prototype-shell");
  const searchAnchor = document.querySelector(".search-popout-anchor");
  const searchTrigger = document.querySelector(".collapsed-search-btn");
  const searchPanel = document.querySelector("#workspaceSearchPanel");
  const searchInput = document.querySelector("#workspaceSearchInput");
  const searchFilterButton = document.querySelector(".search-filter-btn");
  const searchResults = document.querySelector("#workspaceSearchResults");
  const searchResultItems = [
    ...document.querySelectorAll(".search-result-item"),
  ];
  const searchStatus = document.querySelector(".search-status");
  const sidebarPopupAnchors = [
    ...document.querySelectorAll(".sidebar-popup-anchor"),
  ];
  const composerControls = [
    ...document.querySelectorAll(
      ".composer-icon-btn, .model-select-trigger, .model-mode-option, .model-mode-input",
    ),
  ];
  const hoverMediaQuery = window.matchMedia("(hover: hover)");

  const isConceptModalOpen = () =>
    conceptModal?.classList.contains("is-open") ?? false;

  const getConceptModalFocusableElements = () => {
    if (!conceptModal) return [];

    return [
      ...conceptModal.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
  };

  const closeConceptModal = () => {
    if (!conceptModal) return;

    conceptModal.classList.remove("is-open");
    conceptModal.setAttribute("aria-hidden", "true");
    conceptModal.toggleAttribute("inert", true);
    conceptModalTrigger?.setAttribute("aria-expanded", "false");
    prototypeShell?.toggleAttribute("inert", false);

    const focusTarget = conceptModalTrigger ?? searchTrigger;
    window.requestAnimationFrame(() => focusTarget?.focus());
  };

  const openConceptModal = () => {
    if (!conceptModal) return;

    closeModelMenu();
    closeSearch();
    closeSidebarPopups();
    conceptModal.classList.add("is-open");
    conceptModal.setAttribute("aria-hidden", "false");
    conceptModal.toggleAttribute("inert", false);
    conceptModalTrigger?.setAttribute("aria-expanded", "true");
    prototypeShell?.toggleAttribute("inert", true);

    window.requestAnimationFrame(() => conceptModalDialog?.focus());
  };

  const handleConceptModalKeydown = (event) => {
    if (!isConceptModalOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeConceptModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getConceptModalFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
      return;
    }

    if (document.activeElement === conceptModalDialog) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement).focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const isChatAtPresent = () => {
    if (!chatThread) return true;

    const remainingScroll =
      chatThread.scrollHeight - chatThread.clientHeight - chatThread.scrollTop;

    return remainingScroll <= 2;
  };

  const updateComposerScrollState = () => {
    if (!chatWorkspace) return;

    const isAtPresent = isChatAtPresent();
    chatWorkspace.classList.toggle("is-composer-hidden", !isAtPresent);

    if (isAtPresent) {
      chatWorkspace.classList.remove("is-composer-revealed");
    }
  };

  const scrollChatToPresent = () => {
    if (!chatThread) return;

    chatThread.scrollTop = chatThread.scrollHeight;
    updateComposerScrollState();
  };

  const updateComposerTextState = () => {
    const hasText = Boolean(chatInput?.value);

    composerArea?.classList.toggle("has-text", hasText);
  };

  const setComposerSelectionState = (isSelected) => {
    composerArea?.classList.toggle("is-selected", isSelected);
    modelSettings?.setAttribute("aria-hidden", String(!isSelected));
    modelSettings?.toggleAttribute("inert", !isSelected);

    if (!isSelected) closeModelMenu();
  };

  const setModelMenuState = (isOpen) => {
    if (!modelSelect || !modelSelectTrigger || !modelMenu || !composerArea) {
      return;
    }

    modelSelect.classList.toggle("is-open", isOpen);
    composerArea.classList.toggle("is-model-menu-open", isOpen);
    modelSelectTrigger.setAttribute("aria-expanded", String(isOpen));
    modelMenu.setAttribute("aria-hidden", String(!isOpen));
    modelMenu.toggleAttribute("inert", !isOpen);
  };

  const closeModelMenu = () => setModelMenuState(false);

  const focusModelMenuItem = (index) => {
    modelMenuItems.forEach((item, itemIndex) => {
      item.tabIndex = itemIndex === index ? 0 : -1;
    });

    modelMenuItems[index]?.focus();
  };

  const setSidebarPopupState = (anchor, isOpen) => {
    if (!anchor) return;

    const trigger = anchor.querySelector(".sidebar-popup-trigger");
    const popup = anchor.querySelector(".sidebar-popup");

    anchor.classList.toggle("is-open", isOpen);
    trigger?.setAttribute("aria-expanded", String(isOpen));
    popup?.setAttribute("aria-hidden", String(!isOpen));
  };

  const closeSidebarPopups = (exception = null) => {
    sidebarPopupAnchors.forEach((anchor) => {
      if (anchor !== exception) setSidebarPopupState(anchor, false);
    });
  };

  const updateSearchResults = () => {
    if (!searchPanel || !searchInput || !searchResults) return;

    const hasQuery = Boolean(searchInput.value.trim());
    searchPanel.classList.toggle("has-query", hasQuery);
    searchResults.setAttribute("aria-hidden", String(!hasQuery));
    searchResults.toggleAttribute("inert", !hasQuery);

    if (searchStatus) {
      searchStatus.textContent = hasQuery
        ? searchFilterButton?.getAttribute("aria-pressed") === "true"
          ? "Showing one chat result with the chat filter applied."
          : "Showing one related result."
        : "";
    }
  };

  const resetSearch = () => {
    if (searchInput) searchInput.value = "";
    searchFilterButton?.setAttribute("aria-pressed", "false");
    updateSearchResults();
  };

  const setSearchState = (isOpen, shouldReturnFocus = false) => {
    if (!searchAnchor || !searchTrigger || !searchPanel) return;

    searchAnchor.classList.toggle("is-open", isOpen);
    searchTrigger.setAttribute("aria-expanded", String(isOpen));
    searchPanel.setAttribute("aria-hidden", String(!isOpen));
    searchPanel.toggleAttribute("inert", !isOpen);
    prototypeShell?.classList.toggle("is-searching", isOpen);

    if (isOpen) {
      closeSidebarPopups();
      closeModelMenu();
      window.requestAnimationFrame(() => searchInput?.focus());
      return;
    }

    resetSearch();
    if (shouldReturnFocus) searchTrigger.focus();
  };

  const closeSearch = (shouldReturnFocus = false) =>
    setSearchState(false, shouldReturnFocus);

  const submitComposer = () => {
    if (!chatInput) return;

    chatInput.value = "";
    updateComposerTextState();
    chatInput.focus();
  };

  chatInput?.addEventListener("input", updateComposerTextState);

  conceptModalCloseButtons.forEach((closeButton) => {
    closeButton.addEventListener("click", closeConceptModal);
  });

  conceptModalTrigger?.addEventListener("click", openConceptModal);

  document.addEventListener("keydown", handleConceptModalKeydown);

  chatInput?.addEventListener("focus", () => {
    composerArea?.classList.add("is-input-active");
  });

  chatInput?.addEventListener("blur", () => {
    composerArea?.classList.remove("is-input-active");
  });

  composerArea?.addEventListener("focusin", () => {
    setComposerSelectionState(true);
  });

  composerArea?.addEventListener("pointerdown", () => {
    setComposerSelectionState(true);
  });

  composerArea?.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !composerArea.contains(nextTarget)) {
      setComposerSelectionState(false);
    }
  });

  chatInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;

    event.preventDefault();
    submitComposer();
  });

  chatComposer?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitComposer();
  });

  chatThread?.addEventListener("scroll", updateComposerScrollState, {
    passive: true,
  });

  composerDock?.addEventListener("focusin", () => {
    if (!isChatAtPresent()) {
      chatWorkspace?.classList.add("is-composer-revealed");
    }
  });

  composerDock?.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (
        !isChatAtPresent() &&
        !composerDock.contains(document.activeElement)
      ) {
        chatWorkspace?.classList.remove("is-composer-revealed");
      }
    });
  });

  searchTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    setSearchState(!searchAnchor?.classList.contains("is-open"));
  });

  searchInput?.addEventListener("input", updateSearchResults);

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" || !searchInput.value.trim()) return;

    event.preventDefault();
    searchResultItems[0]?.focus();
  });

  searchFilterButton?.addEventListener("click", () => {
    const isPressed =
      searchFilterButton.getAttribute("aria-pressed") === "true";

    searchFilterButton.setAttribute("aria-pressed", String(!isPressed));
    updateSearchResults();
  });

  searchResultItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.dataset.searchTarget;
      const target = targetId ? document.querySelector(`#${targetId}`) : null;

      closeSearch();
      target?.focus();
    });

    item.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp") return;

      event.preventDefault();
      searchInput?.focus();
    });
  });

  composerControls.forEach((control) => {
    control.addEventListener("pointerenter", () => {
      composerArea?.classList.add("is-control-hovered");
    });

    control.addEventListener("pointerleave", () => {
      composerArea?.classList.remove("is-control-hovered");
    });

    control.addEventListener("focus", () => {
      composerArea?.classList.add("is-control-focused");
    });

    control.addEventListener("blur", () => {
      window.requestAnimationFrame(() => {
        if (!composerArea?.contains(document.activeElement)) {
          composerArea?.classList.remove("is-control-focused");
        }
      });
    });
  });

  modelSelectTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeSearch();
    setModelMenuState(!modelSelect?.classList.contains("is-open"));
  });

  modelSelectTrigger?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    setModelMenuState(true);

    const targetItem =
      event.key === "ArrowDown"
        ? modelMenuItems[0]
        : modelMenuItems[modelMenuItems.length - 1];

    const targetIndex = modelMenuItems.indexOf(targetItem);
    if (targetIndex >= 0) focusModelMenuItem(targetIndex);
  });

  sidebarPopupAnchors.forEach((anchor) => {
    const trigger = anchor.querySelector(".sidebar-popup-trigger");

    anchor.addEventListener("pointerenter", () => {
      if (!hoverMediaQuery.matches) return;

      closeSearch();
      closeSidebarPopups(anchor);
      setSidebarPopupState(anchor, true);
    });

    anchor.addEventListener("pointerleave", () => {
      if (!hoverMediaQuery.matches) return;

      setSidebarPopupState(anchor, false);
    });

    trigger?.addEventListener("focus", () => {
      closeSearch();
      closeSidebarPopups(anchor);
      setSidebarPopupState(anchor, true);
    });

    trigger?.addEventListener("blur", () => {
      setSidebarPopupState(anchor, false);
    });

    trigger?.addEventListener("click", (event) => {
      if (hoverMediaQuery.matches) return;

      event.stopPropagation();
      closeSearch();
      const isOpen = anchor.classList.contains("is-open");
      closeSidebarPopups(anchor);
      setSidebarPopupState(anchor, !isOpen);
    });
  });

  modelMenuItems.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();

      const selectedModel = item.dataset.model;
      if (selectedModel && currentModelName) {
        currentModelName.textContent = selectedModel;
      }

      modelMenuItems.forEach((menuItem) => {
        const isSelected = menuItem === item;
        menuItem.classList.toggle("is-selected", isSelected);
        menuItem.setAttribute("aria-checked", String(isSelected));
        menuItem.tabIndex = isSelected ? 0 : -1;
      });

      closeModelMenu();
      modelSelectTrigger?.focus();
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModelMenu();
        modelSelectTrigger?.focus();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusModelMenuItem(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusModelMenuItem(modelMenuItems.length - 1);
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        (index + direction + modelMenuItems.length) % modelMenuItems.length;

      focusModelMenuItem(nextIndex);
    });
  });

  modelModeOptions.forEach((option) => {
    option.addEventListener("change", () => {
      const selectedMode = option.value;
      if (!selectedMode || !modelModeToggle) return;

      modelModeToggle.dataset.active = selectedMode;
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) return;

    if (!composerArea?.contains(event.target)) {
      setComposerSelectionState(false);
    }

    if (!modelSelect?.contains(event.target)) closeModelMenu();
    if (!searchAnchor?.contains(event.target)) closeSearch();
    if (!sidebarPopupAnchors.some((anchor) => anchor.contains(event.target))) {
      closeSidebarPopups();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeModelMenu();

    if (searchAnchor?.classList.contains("is-open")) {
      closeSearch(true);
      return;
    }

    const openPopupAnchor = sidebarPopupAnchors.find((anchor) =>
      anchor.classList.contains("is-open"),
    );

    if (!openPopupAnchor) return;

    setSidebarPopupState(openPopupAnchor, false);
    openPopupAnchor.querySelector(".sidebar-popup-trigger")?.focus();
  });

  updateComposerTextState();
  setComposerSelectionState(false);
  updateSearchResults();
  if (isConceptModalOpen()) {
    window.requestAnimationFrame(() => {
      conceptModalTrigger?.setAttribute("aria-expanded", "true");
      conceptModalDialog?.focus();
    });
  }
  window.requestAnimationFrame(scrollChatToPresent);
})();
