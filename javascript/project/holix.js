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
  const hubModal = document.querySelector("#hub-modal");
  const hubModalCloseButtons = [
    ...document.querySelectorAll("[data-hub-modal-close]"),
  ];
  const hubModalDialog = hubModal?.querySelector(".hub-modal__dialog");
  const hubModalTrigger = document.querySelector("#hub-modal-trigger");
  const hubFilter = document.querySelector(".hub-filter");
  const hubFilterTrigger = document.querySelector("#hub-filter-trigger");
  const hubFilterMenu = document.querySelector("#hub-filter-menu");
  const hubFilterItems = [...document.querySelectorAll(".hub-filter__item")];
  const composerArea = document.querySelector(".composer-area");
  const composerDock = document.querySelector(".composer-dock");
  const chatComposer = document.querySelector(".chat-composer");
  const chatThread = document.querySelector(".chat-thread");
  const chatWorkspace = document.querySelector(".chat-workspace");
  const chatInput = document.querySelector("#chatInput");
  const modelSettings = document.querySelector(".composer-model-settings");
  const modelModeToggle = document.querySelector(".model-mode-toggle");
  const modelModeSlider = document.querySelector(".model-mode-slider");
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
  const chatPanelAnchor = document.querySelector(".chat-panel-anchor");
  const chatPanelTrigger = document.querySelector(".chat-panel-trigger");
  const chatListPanel = document.querySelector("#chatListPanel");
  const chatList = document.querySelector("#chatList");
  const chatPanelNewChat = document.querySelector("#chatPanelNewChat");
  const chatPanelStatus = document.querySelector(".chat-list-panel__status");
  const newChatButton = document.querySelector(".new-chat-btn");
  const sidebarPopupAnchors = [
    ...document.querySelectorAll(".sidebar-popup-anchor"),
  ];
  const composerControls = [
    ...document.querySelectorAll(
      ".composer-icon-btn, .model-select-trigger, .model-mode-slider",
    ),
  ];
  const hoverMediaQuery = window.matchMedia("(hover: hover)");
  let shouldRestoreConceptModalTriggerFocus = false;
  let shouldRestoreHubModalTriggerFocus = false;
  let newChatCount = 0;

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

    if (shouldRestoreConceptModalTriggerFocus) {
      window.requestAnimationFrame(() => conceptModalTrigger?.focus());
    }

    shouldRestoreConceptModalTriggerFocus = false;
  };

  const openConceptModal = () => {
    if (!conceptModal) return;

    shouldRestoreConceptModalTriggerFocus = true;
    closeModelMenu();
    closeSearch();
    closeChatPanel();
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

  const isHubModalOpen = () =>
    hubModal?.classList.contains("is-open") ?? false;

  const getHubModalFocusableElements = () => {
    if (!hubModal) return [];

    return [
      ...hubModal.querySelectorAll(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.closest("[inert]"));
  };

  const setHubFilterState = (isOpen) => {
    if (!hubFilter || !hubFilterTrigger || !hubFilterMenu) return;

    hubFilter.classList.toggle("is-open", isOpen);
    hubFilterTrigger.setAttribute("aria-expanded", String(isOpen));
    hubFilterMenu.setAttribute("aria-hidden", String(!isOpen));
    hubFilterMenu.toggleAttribute("inert", !isOpen);
  };

  const closeHubFilter = () => setHubFilterState(false);

  const closeHubModal = () => {
    if (!hubModal) return;

    closeHubFilter();
    hubModal.classList.remove("is-open");
    hubModal.setAttribute("aria-hidden", "true");
    hubModal.toggleAttribute("inert", true);
    hubModalTrigger?.setAttribute("aria-expanded", "false");
    prototypeShell?.toggleAttribute("inert", false);

    if (shouldRestoreHubModalTriggerFocus) {
      window.requestAnimationFrame(() => hubModalTrigger?.focus());
    }

    shouldRestoreHubModalTriggerFocus = false;
  };

  const openHubModal = () => {
    if (!hubModal) return;

    shouldRestoreHubModalTriggerFocus = true;
    closeModelMenu();
    closeSearch();
    closeChatPanel();
    closeSidebarPopups();
    hubModal.classList.add("is-open");
    hubModal.setAttribute("aria-hidden", "false");
    hubModal.toggleAttribute("inert", false);
    hubModalTrigger?.setAttribute("aria-expanded", "true");
    prototypeShell?.toggleAttribute("inert", true);

    window.requestAnimationFrame(() => hubModalDialog?.focus());
  };

  const handleHubModalKeydown = (event) => {
    if (!isHubModalOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      if (hubFilter?.classList.contains("is-open")) {
        closeHubFilter();
        hubFilterTrigger?.focus();
        return;
      }

      closeHubModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getHubModalFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
      return;
    }

    if (document.activeElement === hubModalDialog) {
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

  const setChatPanelState = (isOpen, shouldReturnFocus = false) => {
    if (!chatPanelAnchor || !chatPanelTrigger || !chatListPanel) return;

    chatPanelAnchor.classList.toggle("is-open", isOpen);
    chatPanelTrigger.setAttribute("aria-expanded", String(isOpen));
    chatListPanel.setAttribute("aria-hidden", String(!isOpen));
    chatListPanel.toggleAttribute("inert", !isOpen);

    if (isOpen) {
      closeSearch();
      closeModelMenu();
      closeSidebarPopups();
      if (chatList) chatList.scrollTop = 0;
      return;
    }

    if (shouldReturnFocus) chatPanelTrigger.focus();
  };

  const closeChatPanel = (shouldReturnFocus = false) =>
    setChatPanelState(false, shouldReturnFocus);

  const setChatPanelStatus = (message) => {
    if (chatPanelStatus) chatPanelStatus.textContent = message;
  };

  const updateChatListOverflow = () => {
    if (!chatList) return;

    const shouldScroll = chatList.children.length > 5;
    chatList.classList.toggle("is-scrollable", shouldScroll);

    if (!shouldScroll) chatList.scrollTop = 0;
  };

  const startChatRename = (nameButton, shouldClear = false, removeIfEmpty = false) => {
    if (!(nameButton instanceof HTMLButtonElement)) return;

    const item = nameButton.closest(".chat-list-panel__item");
    const label = nameButton.querySelector("span");
    if (!item || !label || item.querySelector(".chat-list-panel__rename")) {
      return;
    }

    const originalName = label.textContent.trim() || "New chat";
    const input = document.createElement("input");
    input.className = "chat-list-panel__rename";
    input.type = "text";
    input.value = shouldClear ? "" : originalName;
    input.maxLength = 80;
    input.setAttribute("aria-label", `Rename chat: ${originalName}`);

    nameButton.replaceWith(input);

    let isFinished = false;

    const finishRename = (shouldSave, shouldRestoreFocus = true) => {
      if (isFinished) return;
      isFinished = true;

      const nextName = shouldSave ? input.value.trim() : "";

      if (removeIfEmpty && (!shouldSave || !nextName)) {
        item.remove();
        updateChatListOverflow();
        setChatPanelStatus("New chat cancelled.");
        return;
      }

      const finalName = nextName || originalName;

      label.textContent = finalName;
      nameButton.setAttribute("aria-label", `Rename chat: ${finalName}`);
      item
        .querySelector(".chat-list-panel__remove")
        ?.setAttribute("aria-label", `Remove chat: ${finalName}`);
      input.replaceWith(nameButton);

      if (shouldSave && finalName !== originalName) {
        setChatPanelStatus(`Chat renamed to ${finalName}.`);
      }

      if (shouldRestoreFocus) nameButton.focus();
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finishRename(true);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finishRename(false);
      }
    });

    input.addEventListener("blur", () => finishRename(true, false), { once: true });

    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  };

  const removeChat = (removeButton) => {
    if (!(removeButton instanceof HTMLButtonElement)) return;

    const item = removeButton.closest(".chat-list-panel__item");
    if (!item || item.classList.contains("chat-list-panel__item--fixed")) return;

    const chatName =
      item.querySelector(".chat-list-panel__name span")?.textContent.trim() ||
      "Chat";

    item.remove();
    updateChatListOverflow();
    setChatPanelStatus(`${chatName} removed.`);
  };

  const createNewChat = () => {
    if (!chatList) return;

    newChatCount += 1;
    const item = document.createElement("li");
    item.className = "chat-list-panel__item";

    const nameButton = document.createElement("button");
    nameButton.className = "chat-list-panel__name";
    nameButton.type = "button";
    nameButton.setAttribute("aria-label", "Rename chat: New chat");

    const label = document.createElement("span");
    label.textContent = "New chat";
    nameButton.append(label);

    const removeButton = document.createElement("button");
    removeButton.className = "chat-list-panel__remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", "Remove chat: New chat");
    removeButton.textContent = "−";

    item.append(nameButton, removeButton);
    chatList.append(item);
    updateChatListOverflow();
    setChatPanelState(true);

    if (chatInput) {
      chatInput.value = "";
      updateComposerTextState();
    }

    setChatPanelStatus(`New chat ${newChatCount} created.`);

    window.requestAnimationFrame(() => {
      chatList.scrollTop = chatList.scrollHeight;
      startChatRename(nameButton, true, true);
    });
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
      closeChatPanel();
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

  hubModalCloseButtons.forEach((closeButton) => {
    closeButton.addEventListener("click", closeHubModal);
  });

  hubModalTrigger?.addEventListener("click", openHubModal);

  hubFilterTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    setHubFilterState(!hubFilter?.classList.contains("is-open"));
  });

  hubFilterItems.forEach((item) => {
    item.addEventListener("click", () => {
      hubFilterItems.forEach((filterItem) => {
        const isSelected = filterItem === item;
        filterItem.classList.toggle("is-selected", isSelected);
        filterItem.setAttribute("aria-checked", String(isSelected));
      });

      closeHubFilter();
      hubFilterTrigger?.focus();
    });
  });

  document.addEventListener("keydown", handleConceptModalKeydown);
  document.addEventListener("keydown", handleHubModalKeydown);

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

  chatPanelTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = chatPanelAnchor?.classList.contains("is-open") ?? false;
    setChatPanelState(!isOpen);
  });

  const handleNewChatClick = (event) => {
    event.stopPropagation();
    createNewChat();
  };

  chatPanelNewChat?.addEventListener("click", handleNewChatClick);
  newChatButton?.addEventListener("click", handleNewChatClick);

  chatList?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const removeButton = event.target.closest(".chat-list-panel__remove");
    if (removeButton) {
      event.stopPropagation();
      removeChat(removeButton);
      return;
    }

    const nameButton = event.target.closest("button.chat-list-panel__name");
    if (nameButton) startChatRename(nameButton);
  });

  sidebarPopupAnchors.forEach((anchor) => {
    const trigger = anchor.querySelector(".sidebar-popup-trigger");

    anchor.addEventListener("pointerenter", () => {
      if (!hoverMediaQuery.matches) return;

      closeSearch();
      closeChatPanel();
      closeSidebarPopups(anchor);
      setSidebarPopupState(anchor, true);
    });

    anchor.addEventListener("pointerleave", () => {
      if (!hoverMediaQuery.matches) return;

      setSidebarPopupState(anchor, false);
    });

    trigger?.addEventListener("focus", () => {
      if (!trigger.matches(":focus-visible")) return;

      closeSearch();
      closeChatPanel();
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

  const modelModes = [
    { value: "talkative", label: "Talkative" },
    { value: "contemplative", label: "Contemplative" },
    { value: "thinking", label: "Thinking" },
  ];

  const updateModelMode = () => {
    if (!modelModeSlider || !modelModeToggle) return;

    const modeIndex = Number.parseInt(modelModeSlider.value, 10);
    const selectedMode = modelModes[modeIndex] ?? modelModes[0];

    modelModeToggle.dataset.active = selectedMode.value;
    modelModeSlider.setAttribute("aria-valuetext", selectedMode.label);
  };

  modelModeSlider?.addEventListener("input", updateModelMode);

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Node)) return;

      if (!composerArea?.contains(event.target)) {
        setComposerSelectionState(false);
      }
    },
    true,
  );

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) return;

    if (!modelSelect?.contains(event.target)) closeModelMenu();
    if (!searchAnchor?.contains(event.target)) closeSearch();
    if (!chatPanelAnchor?.contains(event.target)) closeChatPanel();
    if (!hubFilter?.contains(event.target)) closeHubFilter();
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

    if (chatPanelAnchor?.classList.contains("is-open")) {
      closeChatPanel(true);
      return;
    }

    const openPopupAnchor = sidebarPopupAnchors.find((anchor) =>
      anchor.classList.contains("is-open"),
    );

    if (!openPopupAnchor) return;

    setSidebarPopupState(openPopupAnchor, false);
  });

  updateComposerTextState();
  updateModelMode();
  setComposerSelectionState(false);
  updateSearchResults();
  updateChatListOverflow();
  if (isConceptModalOpen()) {
    window.requestAnimationFrame(() => {
      conceptModalTrigger?.setAttribute("aria-expanded", "true");
      conceptModalDialog?.focus();
    });
  }
  window.requestAnimationFrame(scrollChatToPresent);
})();
