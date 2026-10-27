(function () {
  "use strict";

  const SITE = location.hostname.includes("claude.ai") ? "claude" : "chatgpt";
  const OTHER = SITE === "claude" ? "ChatGPT" : "Claude";

  function getLastAssistantMessage() {
    if (SITE === "claude") {
      const blocks = document.querySelectorAll("[data-is-streaming='false']");
      if (blocks.length === 0) {
        const allMessages = document.querySelectorAll(
          ".font-claude-message, [class*='prose'], [data-testid='chat-message-text']"
        );
        const last = allMessages[allMessages.length - 1];
        return last ? last.innerText.trim() : null;
      }
      const last = blocks[blocks.length - 1];
      return last ? last.innerText.trim() : null;
    }

    const messages = document.querySelectorAll(
      "[data-message-author-role='assistant']"
    );
    const last = messages[messages.length - 1];
    if (!last) return null;
    const content =
      last.querySelector(".markdown") ||
      last.querySelector("[class*='prose']") ||
      last;
    return content.innerText.trim();
  }

  function getConversationContext() {
    const messages = [];
    if (SITE === "claude") {
      document
        .querySelectorAll("[data-testid='chat-message-text'], .font-claude-message, [class*='prose']")
        .forEach((el) => {
          const text = el.innerText.trim();
          if (text) messages.push(text);
        });
    } else {
      document
        .querySelectorAll("[data-message-author-role]")
        .forEach((el) => {
          const role = el.getAttribute("data-message-author-role");
          const content =
            el.querySelector(".markdown") ||
            el.querySelector("[class*='prose']") ||
            el;
          const text = content.innerText.trim();
          if (text) messages.push(`[${role}]: ${text}`);
        });
    }
    return messages.slice(-4).join("\n\n---\n\n");
  }

  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      }
    );
  }

  function showToast(msg, type) {
    const existing = document.getElementById("ai-bridge-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "ai-bridge-toast";
    toast.className = `ai-bridge-toast ai-bridge-toast--${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("ai-bridge-toast--visible"));
    setTimeout(() => {
      toast.classList.remove("ai-bridge-toast--visible");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function createPanel() {
    if (document.getElementById("ai-bridge-panel")) return;

    const panel = document.createElement("div");
    panel.id = "ai-bridge-panel";
    panel.innerHTML = `
      <div class="ai-bridge-header">
        <span class="ai-bridge-logo">⚡</span>
        <span class="ai-bridge-title">AI Bridge</span>
        <button class="ai-bridge-minimize" title="Свернуть">−</button>
      </div>
      <div class="ai-bridge-body">
        <div class="ai-bridge-status">
          Сейчас: <strong>${SITE === "claude" ? "Claude" : "ChatGPT"}</strong>
        </div>
        <button class="ai-bridge-btn ai-bridge-btn--copy" id="ai-bridge-copy-last">
          📋 Копировать последний ответ
        </button>
        <button class="ai-bridge-btn ai-bridge-btn--copy-ctx" id="ai-bridge-copy-context">
          📄 Копировать с контекстом
        </button>
        <button class="ai-bridge-btn ai-bridge-btn--paste" id="ai-bridge-paste">
          📥 Вставить от ${OTHER}
        </button>
        <div class="ai-bridge-buffer-status" id="ai-bridge-buffer-info">
          Буфер: пусто
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const minimizeBtn = panel.querySelector(".ai-bridge-minimize");
    const body = panel.querySelector(".ai-bridge-body");
    let minimized = false;

    minimizeBtn.addEventListener("click", () => {
      minimized = !minimized;
      body.style.display = minimized ? "none" : "flex";
      minimizeBtn.textContent = minimized ? "+" : "−";
      panel.classList.toggle("ai-bridge-panel--minimized", minimized);
    });

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const header = panel.querySelector(".ai-bridge-header");

    header.addEventListener("mousedown", (e) => {
      if (e.target === minimizeBtn) return;
      isDragging = true;
      dragOffsetX = e.clientX - panel.offsetLeft;
      dragOffsetY = e.clientY - panel.offsetTop;
      panel.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      panel.style.left = e.clientX - dragOffsetX + "px";
      panel.style.top = e.clientY - dragOffsetY + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      panel.style.transition = "";
    });

    document
      .getElementById("ai-bridge-copy-last")
      .addEventListener("click", handleCopyLast);
    document
      .getElementById("ai-bridge-copy-context")
      .addEventListener("click", handleCopyContext);
    document
      .getElementById("ai-bridge-paste")
      .addEventListener("click", handlePaste);

    updateBufferStatus();
  }

  function updateBufferStatus() {
    chrome.storage.local.get(["aiBridgeBuffer", "aiBridgeSource"], (data) => {
      const info = document.getElementById("ai-bridge-buffer-info");
      if (!info) return;
      if (data.aiBridgeBuffer) {
        const preview = data.aiBridgeBuffer.substring(0, 60);
        info.textContent = `Буфер (от ${data.aiBridgeSource || "?"}): ${preview}...`;
        info.classList.add("ai-bridge-buffer-status--has-data");
      } else {
        info.textContent = "Буфер: пусто";
        info.classList.remove("ai-bridge-buffer-status--has-data");
      }
    });
  }

  function handleCopyLast() {
    const text = getLastAssistantMessage();
    if (!text) {
      showToast("Не нашла ответ AI на странице", "error");
      return;
    }

    const formatted =
      `--- Ответ от ${SITE === "claude" ? "Claude" : "ChatGPT"} ---\n\n` +
      text +
      `\n\n--- Конец ответа ---\n\n` +
      `Пожалуйста, проанализируй этот ответ. Если есть ошибки или можно улучшить — укажи. Дай своё мнение.`;

    chrome.storage.local.set(
      { aiBridgeBuffer: formatted, aiBridgeSource: SITE === "claude" ? "Claude" : "ChatGPT" },
      () => {
        copyToClipboard(formatted);
        showToast(`✅ Скопировано! Вставь в ${OTHER}`, "success");
        updateBufferStatus();
      }
    );
  }

  function handleCopyContext() {
    const context = getConversationContext();
    if (!context) {
      showToast("Не нашла сообщений на странице", "error");
      return;
    }

    const formatted =
      `--- Контекст обсуждения из ${SITE === "claude" ? "Claude" : "ChatGPT"} ---\n\n` +
      context +
      `\n\n--- Конец контекста ---\n\n` +
      `Пожалуйста, ознакомься с этим обсуждением и дай своё мнение. Что можно улучшить? Есть ли ошибки?`;

    chrome.storage.local.set(
      { aiBridgeBuffer: formatted, aiBridgeSource: SITE === "claude" ? "Claude" : "ChatGPT" },
      () => {
        copyToClipboard(formatted);
        showToast(`✅ Контекст скопирован! Вставь в ${OTHER}`, "success");
        updateBufferStatus();
      }
    );
  }

  function handlePaste() {
    chrome.storage.local.get(["aiBridgeBuffer", "aiBridgeSource"], (data) => {
      if (!data.aiBridgeBuffer) {
        showToast("Буфер пуст — сначала скопируй ответ из другого AI", "error");
        return;
      }

      let inputField = null;
      if (SITE === "claude") {
        inputField = document.querySelector(
          "[contenteditable='true'].ProseMirror, div[contenteditable='true'][data-placeholder]"
        );
      } else {
        inputField = document.querySelector(
          "#prompt-textarea, textarea[data-id='root'], div[contenteditable='true'][id='prompt-textarea']"
        );
      }

      if (!inputField) {
        copyToClipboard(data.aiBridgeBuffer);
        showToast("Поле ввода не найдено — текст в буфере обмена, вставь Ctrl+V", "warning");
        return;
      }

      if (inputField.tagName === "TEXTAREA" || inputField.tagName === "INPUT") {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeSetter.call(inputField, data.aiBridgeBuffer);
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        inputField.focus();
        inputField.textContent = data.aiBridgeBuffer;
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
      }

      showToast(`✅ Вставлено от ${data.aiBridgeSource}!`, "success");

      chrome.storage.local.remove(["aiBridgeBuffer", "aiBridgeSource"], () => {
        updateBufferStatus();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(createPanel, 1500)
    );
  } else {
    setTimeout(createPanel, 1500);
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "B") {
      e.preventDefault();
      const panel = document.getElementById("ai-bridge-panel");
      if (panel) {
        panel.style.display =
          panel.style.display === "none" ? "flex" : "none";
      }
    }
  });
})();
