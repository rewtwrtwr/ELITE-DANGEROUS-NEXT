/**
 * Elite Dangerous Next - Fixed Date Handling Functions
 * Исправленные функции для работы с датами и группировкой событий
 */

// Безопасное преобразование временной метки в Date
function safeParseTimestamp(timestamp) {
  // Проверка на пустые значения
  if (!timestamp) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Пустая временная метка:", timestamp);
    }
    return null;
  }

  // Попытка создать объект Date
  const date = new Date(timestamp);

  // Проверка валидности даты
  if (isNaN(date.getTime())) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Некорректная временная метка:", timestamp);
    }
    return null;
  }

  return date;
}

// Получение ключа даты для группировки событий
function getEventDateKey(event) {
  const date = safeParseTimestamp(event.timestamp);

  // Для невалидных меток возвращаем резервное значение
  if (!date) {
    return "unknown";
  }

  // Возвращаем дату в формате YYYY-MM-DD
  return date.toISOString().split("T")[0];
}

// Асинхронная группировка событий по дате с обработкой больших объемов данных
async function groupEventsByDate(events, chunkSize = 1000) {
  const grouped = new Map();
  const chunks = [];

  // Разбиваем массив на чанки
  for (let i = 0; i < events.length; i += chunkSize) {
    chunks.push(events.slice(i, i + chunkSize));
  }

  // Обрабатываем каждый чанк асинхронно
  for (const chunk of chunks) {
    await new Promise((resolve) => {
      setTimeout(() => {
        chunk.forEach((event) => {
          const dateKey = getEventDateKey(event);

          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
          }

          grouped.get(dateKey).push(event);
        });
        resolve();
      }, 0);
    });
  }

  // Преобразуем Map в объект для совместимости
  return Object.fromEntries(grouped);
}

// Форматирование заголовка даты для отображения
function formatDateHeader(dateString) {
  // Для неизвестных дат
  if (dateString === "unknown") {
    return "Без даты";
  }

  // Преобразуем строку даты в объект Date
  const date = new Date(dateString);

  // Проверка валидности даты
  if (isNaN(date.getTime())) {
    return "Некорректная дата";
  }

  // Форматируем дату для отображения
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };

  return date.toLocaleDateString("ru-RU", options);
}

// Отображение списка событий с обработкой асинхронной группировки
async function renderEventList(events) {
  // Показываем индикатор загрузки
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "block";
  }

  try {
    // Группируем события асинхронно
    const groupedEvents = await groupEventsByDate(events);

    // Скрываем индикатор загрузки
    if (loader) {
      loader.style.display = "none";
    }

    // Рендерим сгруппированные события
    return renderGroupedEvents(groupedEvents);
  } catch (error) {
    // Скрываем индикатор загрузки в случае ошибки
    if (loader) {
      loader.style.display = "none";
    }

    console.error("Ошибка при рендеринге списка событий:", error);
    return '<div class="error">Произошла ошибка при загрузке событий</div>';
  }
}

// Рендеринг сгруппированных событий
function renderGroupedEvents(grouped) {
  // Создаем контейнер для событий
  let html =
    '<div class="events-list-wrapper" id="eventsListWrapper" style="flex: 1; overflow-y: auto; padding-right: 8px;">';

  // Получаем ключи дат и сортируем их (новые даты первыми)
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    // Специальная обработка для 'unknown' - помещаем в конец
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;

    // Сортировка по дате (новые первыми)
    return new Date(b) - new Date(a);
  });

  // Рендерим события для каждой даты
  dateKeys.forEach((dateKey) => {
    const events = grouped[dateKey];

    // Добавляем разделитель даты
    html += `
      <div class="date-separator" id="date-${dateKey}">
        <span class="date-separator-line"></span>
        <span class="date-separator-text">${formatDateHeader(dateKey)}</span>
        <span class="date-separator-line"></span>
        <span class="date-separator-count">${events.length} событий</span>
      </div>
    `;

    // Добавляем события
    events.forEach((event, idx) => {
      html += renderEventItem(event, idx);
    });
  });

  // Закрываем контейнер
  html += "</div>";

  // Добавляем счетчик общего количества событий
  const totalCount = Object.values(grouped).reduce(
    (sum, events) => sum + events.length,
    0,
  );
  html += `
    <div class="events-count" style="padding: 8px; text-align: center; color: var(--ed-text-muted); font-size: 12px; border-top: 1px solid var(--ed-border);">
      ${totalCount.toLocaleString()} событий всего
    </div>
  `;

  return html;
}

// Рендеринг отдельного события (упрощенная версия)
function renderEventItem(event, idx) {
  // Получаем тип события
  const eventType = event.event || "Unknown";

  // Получаем временную метку
  const timestamp = event.timestamp || new Date().toISOString();
  const time = new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Создаем элемент события
  return `
    <div class="event-item" data-event-index="${idx}">
      <div class="event-time">${time}</div>
      <div class="event-type">${eventType}</div>
      <div class="event-content">
        <!-- Здесь будет содержимое события -->
      </div>
    </div>
  `;
}

// Валидация событий перед обработкой
function validateEvents(events) {
  const invalidEvents = events.filter(
    (event) => !safeParseTimestamp(event.timestamp),
  );

  if (invalidEvents.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      "Найдено событий с невалидным временем:",
      invalidEvents.length,
    );
  }

  return invalidEvents.length;
}

// Экспортируем функции для использования в других модулях
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    safeParseTimestamp,
    getEventDateKey,
    groupEventsByDate,
    formatDateHeader,
    renderEventList,
    renderGroupedEvents,
    renderEventItem,
    validateEvents,
  };
}
