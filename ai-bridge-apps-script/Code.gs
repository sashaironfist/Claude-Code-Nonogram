/**
 * AI Bridge — Google Apps Script
 * Автоматически собирает комментарии из Google Doc и форматирует сводки
 * для передачи между Claude и ChatGPT.
 *
 * Установка:
 * 1. Открой Google Doc
 * 2. Расширения → Apps Script
 * 3. Скопируй этот код
 * 4. Запусти setupTrigger() один раз
 */

// ===== НАСТРОЙКИ =====
var CONFIG = {
  MARKER_PREFIX: "[AI-BRIDGE]",
  SUMMARY_HEADING: "📋 AI Bridge — Сводка комментариев",
  CHECK_INTERVAL_MINUTES: 5
};

/**
 * Устанавливает автоматический триггер проверки комментариев.
 * Запусти эту функцию один раз вручную.
 */
function setupTrigger() {
  // Удалить старые триггеры
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkAndSummarize") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("checkAndSummarize")
    .timeDriven()
    .everyMinutes(CONFIG.CHECK_INTERVAL_MINUTES)
    .create();

  SpreadsheetApp.getUi
    ? SpreadsheetApp.getUi().alert("Триггер установлен! Проверка каждые " + CONFIG.CHECK_INTERVAL_MINUTES + " минут.")
    : Logger.log("Триггер установлен!");
}

/**
 * Основная функция — проверяет комментарии и создаёт сводку.
 */
function checkAndSummarize() {
  var doc = DocumentApp.getActiveDocument();
  if (!doc) {
    Logger.log("Документ не найден");
    return;
  }

  var docId = doc.getId();
  var comments = getDocComments(docId);

  if (!comments || comments.length === 0) {
    Logger.log("Комментариев нет");
    return;
  }

  var processed = getProcessedComments();
  var newComments = filterNewComments(comments, processed);

  if (newComments.length === 0) {
    Logger.log("Новых комментариев нет");
    return;
  }

  var summary = buildSummary(newComments);
  appendSummaryToDoc(doc, summary);
  markCommentsProcessed(newComments, processed);

  Logger.log("Обработано " + newComments.length + " новых комментариев");
}

/**
 * Получает комментарии документа через Drive API.
 */
function getDocComments(docId) {
  try {
    var comments = Drive.Comments.list(docId, {
      fields: "items(commentId,content,author,createdDate,status,replies)",
      maxResults: 100
    });
    return comments.items || [];
  } catch (e) {
    Logger.log("Ошибка получения комментариев: " + e.message);
    // Fallback: парсинг из текста документа
    return getCommentsFromText();
  }
}

/**
 * Альтернативный способ — ищет комментарии-маркеры в тексте документа.
 * Формат: [CLAUDE] текст или [CHATGPT] текст
 */
function getCommentsFromText() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var text = body.getText();
  var comments = [];

  var patterns = [
    { regex: /\[CLAUDE\]\s*(.+?)(?=\[CLAUDE\]|\[CHATGPT\]|\[AI-BRIDGE\]|$)/gs, source: "Claude" },
    { regex: /\[CHATGPT\]\s*(.+?)(?=\[CLAUDE\]|\[CHATGPT\]|\[AI-BRIDGE\]|$)/gs, source: "ChatGPT" }
  ];

  for (var p = 0; p < patterns.length; p++) {
    var match;
    while ((match = patterns[p].regex.exec(text)) !== null) {
      comments.push({
        commentId: "text-" + p + "-" + match.index,
        content: match[1].trim(),
        source: patterns[p].source,
        createdDate: new Date().toISOString()
      });
    }
  }

  return comments;
}

/**
 * Фильтрует только новые (необработанные) комментарии.
 */
function filterNewComments(comments, processed) {
  return comments.filter(function (c) {
    return processed.indexOf(c.commentId) === -1;
  });
}

/**
 * Собирает красиво отформатированную сводку.
 */
function buildSummary(comments) {
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

  var lines = [];
  lines.push("");
  lines.push("═══════════════════════════════════════");
  lines.push(CONFIG.SUMMARY_HEADING);
  lines.push("Время: " + now);
  lines.push("Новых комментариев: " + comments.length);
  lines.push("═══════════════════════════════════════");
  lines.push("");

  // Группируем по источнику
  var byClaude = [];
  var byChatGPT = [];
  var byOther = [];

  for (var i = 0; i < comments.length; i++) {
    var c = comments[i];
    var source = detectSource(c);
    if (source === "Claude") {
      byClaude.push(c);
    } else if (source === "ChatGPT") {
      byChatGPT.push(c);
    } else {
      byOther.push(c);
    }
  }

  if (byClaude.length > 0) {
    lines.push("🟣 От Claude (" + byClaude.length + "):");
    for (var i = 0; i < byClaude.length; i++) {
      lines.push("  • " + truncate(byClaude[i].content, 200));
    }
    lines.push("");
  }

  if (byChatGPT.length > 0) {
    lines.push("🟢 От ChatGPT (" + byChatGPT.length + "):");
    for (var i = 0; i < byChatGPT.length; i++) {
      lines.push("  • " + truncate(byChatGPT[i].content, 200));
    }
    lines.push("");
  }

  if (byOther.length > 0) {
    lines.push("⚪ Другие (" + byOther.length + "):");
    for (var i = 0; i < byOther.length; i++) {
      lines.push("  • " + truncate(byOther[i].content, 200));
    }
    lines.push("");
  }

  // Готовые промпты для копирования
  lines.push("───────────────────────────────────────");
  lines.push("📨 Готовый текст для Claude:");
  lines.push("");
  lines.push(buildPromptForAI("Claude", byChatGPT, byOther));
  lines.push("");
  lines.push("───────────────────────────────────────");
  lines.push("📨 Готовый текст для ChatGPT:");
  lines.push("");
  lines.push(buildPromptForAI("ChatGPT", byClaude, byOther));
  lines.push("");
  lines.push("═══════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Генерирует готовый промпт для AI.
 */
function buildPromptForAI(targetAI, otherComments, userComments) {
  if (otherComments.length === 0 && userComments.length === 0) {
    return "(Нет новых комментариев для " + targetAI + ")";
  }

  var otherName = targetAI === "Claude" ? "ChatGPT" : "Claude";
  var parts = [];

  parts.push("Привет! Вот новые комментарии к нашему документу:");

  if (otherComments.length > 0) {
    parts.push("");
    parts.push("Комментарии от " + otherName + ":");
    for (var i = 0; i < otherComments.length; i++) {
      parts.push("- " + otherComments[i].content);
    }
  }

  if (userComments.length > 0) {
    parts.push("");
    parts.push("Мои комментарии:");
    for (var i = 0; i < userComments.length; i++) {
      parts.push("- " + userComments[i].content);
    }
  }

  parts.push("");
  parts.push("Проанализируй эти замечания и предложи решения. Если с чем-то не согласен — аргументируй.");

  return parts.join("\n");
}

/**
 * Определяет источник комментария.
 */
function detectSource(comment) {
  var content = (comment.content || "").toLowerCase();
  var author = "";
  if (comment.author && comment.author.displayName) {
    author = comment.author.displayName.toLowerCase();
  }
  if (comment.source) return comment.source;
  if (content.indexOf("[claude]") >= 0 || author.indexOf("claude") >= 0) return "Claude";
  if (content.indexOf("[chatgpt]") >= 0 || content.indexOf("[gpt]") >= 0 || author.indexOf("openai") >= 0) return "ChatGPT";
  return "User";
}

/**
 * Добавляет сводку в конец документа.
 */
function appendSummaryToDoc(doc, summary) {
  var body = doc.getBody();
  body.appendParagraph("").setSpacingBefore(20);

  var lines = summary.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var para = body.appendParagraph(lines[i]);
    para.setFontSize(10);
    para.setForegroundColor("#555555");

    // Выделяем заголовки
    if (lines[i].indexOf("═") >= 0 || lines[i].indexOf("───") >= 0) {
      para.setForegroundColor("#999999");
    } else if (lines[i].indexOf(CONFIG.SUMMARY_HEADING) >= 0) {
      para.setFontSize(12);
      para.setBold(true);
      para.setForegroundColor("#333333");
    } else if (lines[i].indexOf("📨") >= 0) {
      para.setFontSize(11);
      para.setBold(true);
      para.setForegroundColor("#1a73e8");
    }
  }
}

/**
 * Получает список уже обработанных комментариев.
 */
function getProcessedComments() {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty("processedComments");
  return data ? JSON.parse(data) : [];
}

/**
 * Сохраняет ID обработанных комментариев.
 */
function markCommentsProcessed(comments, existing) {
  var ids = existing.slice();
  for (var i = 0; i < comments.length; i++) {
    ids.push(comments[i].commentId);
  }
  // Храним только последние 500
  if (ids.length > 500) ids = ids.slice(ids.length - 500);
  PropertiesService.getScriptProperties().setProperty("processedComments", JSON.stringify(ids));
}

/**
 * Обрезает текст до maxLen символов.
 */
function truncate(text, maxLen) {
  if (!text) return "";
  return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
}

/**
 * Ручной запуск — создаёт сводку прямо сейчас.
 */
function runNow() {
  checkAndSummarize();
}

/**
 * Сбрасывает список обработанных комментариев (для повторной обработки).
 */
function resetProcessed() {
  PropertiesService.getScriptProperties().deleteProperty("processedComments");
  Logger.log("Список обработанных комментариев очищен");
}

/**
 * Показывает меню в Google Docs.
 */
function onOpen() {
  var ui = DocumentApp.getUi();
  ui.createMenu("🤖 AI Bridge")
    .addItem("📋 Собрать сводку сейчас", "runNow")
    .addItem("⚙️ Установить авто-проверку", "setupTrigger")
    .addItem("🔄 Сбросить историю", "resetProcessed")
    .addToUi();
}
