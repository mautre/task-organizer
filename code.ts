// Типы
interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

// Константы для метаданных
const METADATA = {
  FRAME_NAME: 'Frame-metadata',
  TASK_LIST_NAME: 'Task-list',
  TASK_LABEL_NAME: 'task: ',
  STATUS_NAME: 'Status',
  STATUS_LABEL_NAME: 'Status Label',
  STATUS_INDICATOR_NAME: 'Status Indicator',
  SPACING: 16,
  DEFAULT_HEIGHT: 125,
  PADDING: {
    VERTICAL: 12,
    HORIZONTAL: 20
  }
} as const;

// Уведомления
const NOTIFICATIONS = {
  SELECT_ONE_FRAME: 'Выберите один фрейм',
  SECTION_ERROR: 'Нельзя применить к секции',
  NESTING_ERROR: 'Фрейм должен быть вложен только в Section или находиться на верхнем уровне',
  NO_TASKS: '[Задач] в названии не найдено',
  TASK_LIST_EXISTS: 'Фрейм Task-list уже существует в Frame-metadata',
  ENTER_TASK_NUMBER: 'Введите номер задачи',
  STATUS_ERROR: 'Ошибка: не удалось найти элементы статуса'
} as const;

const TRY_ERRORS = {
  FONTS_LOAD: 'Ошибка загрузки шрифтов',
  METADATA_UPDATE: 'Ошибка при обновлении метаданных',
  STATUS_UPDATE: 'Ошибка при обновлении статуса',
  UNEXPECTED: 'Произошла непредвиденная ошибка'
} as const;

// URL шаблоны
const URL_TEMPLATES = {
  TASK: 'https://inside.notamedia.ru/company/personal/user/1/tasks/task/view'
} as const;

// Существующие константы с небольшими изменениями
interface StatusConfig {
  value: string;
  color: RGB;
  opacity: number;
  label: string;
}

const STATUSES: Record<string, StatusConfig> = {
  'in-progress': {
    value: 'in-progress',
    color: { r: 1, g: 0.56, b: 0 },
    opacity: 1,
    label: 'В процессе'
  },
  'check-it': {
    value: 'check-it',
    color: { r: 0.11, g: 0.45, b: 0.97 },
    opacity: 1,
    label: 'На проверку'
  },
  'not-relevant': {
    value: 'not-relevant',
    color: { r: 0.5, g: 0.5, b: 0.5 },
    opacity: 0.6,
    label: 'Не актуально'
  },
  'done': {
    value: 'done',
    color: { r: 0, g: 0.7, b: 0.16 },
    opacity: 1,
    label: 'Готово'
  }
} as const;

const TEXT_STYLES = {
  default: {
    fontSize: 24,
    fontFamily: "Inter",
    fontStyle: "Regular"
  },
  status: {
    cornerRadius: 24,
    indicatorSize: 48
  }
} as const;

const COLORS = {
  grey: { r: 0.4, g: 0.4, b: 0.4 },
  blue: { r: 0.1, g: 0.58, b: 0.75 },
  white: { r: 1, g: 1, b: 1 }
} as const;

// Утилитарные функции
function notify(message: string, error: boolean = false) {
  figma.notify(message, { timeout: 2000, error });
}

function createTaskLink(taskId: string): string {
  return `${URL_TEMPLATES.TASK}/${taskId}/`;
}

// ... остальной код ...

figma.showUI(__html__, {
  width: 360,
  height: 420,
  themeColors: true,
  title: "Изменить ста и номера задач"
});


async function loadFonts() {
  try {
    await figma.loadFontAsync({ 
      family: TEXT_STYLES.default.fontFamily, 
      style: TEXT_STYLES.default.fontStyle 
    });
  } catch (error) {
    notify(TRY_ERRORS.FONTS_LOAD, true);
    console.error(TRY_ERRORS.FONTS_LOAD, error);
  }
}

function updateMetadataFrame() {
  try {
    const selection = figma.currentPage.selection;
    if (!selection.length || selection.length > 1) {
      notify(NOTIFICATIONS.SELECT_ONE_FRAME, true);
      return;
    }
    
    if (selection[0].type === 'SECTION') {
      notify(NOTIFICATIONS.SECTION_ERROR, true);
      return;
    }
    
    const selectedFrame = selection[0] as FrameNode;

    if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
      notify(NOTIFICATIONS.NESTING_ERROR, true);
      return;
    }

    // Проверяем существующий Frame-metadata
    let metadataFrame = selectedFrame.findChild(node => node.name === METADATA.FRAME_NAME) as FrameNode;
    
    if (!metadataFrame) {
      metadataFrame = figma.createFrame();
      metadataFrame.name = METADATA.FRAME_NAME;
      metadataFrame.layoutMode = "VERTICAL";
      metadataFrame.locked = true;
      metadataFrame.layoutSizingVertical = 'FIXED';
      metadataFrame.layoutSizingHorizontal = 'HUG';
      metadataFrame.fills = [];
      metadataFrame.itemSpacing = METADATA.SPACING;
      metadataFrame.resize(metadataFrame.width, METADATA.DEFAULT_HEIGHT);
      metadataFrame.primaryAxisAlignItems = 'MAX';

      // Добавляем как последний элемент
      selectedFrame.appendChild(metadataFrame);
    } else {
      // Если Frame-metadata уже существует, но не является последним элементом
      const lastIndex = selectedFrame.children.length - 1;
      const currentIndex = selectedFrame.children.indexOf(metadataFrame);
      if (currentIndex !== lastIndex) {
        selectedFrame.appendChild(metadataFrame);
      }
    }

    selectedFrame.clipsContent = false;

    if (selectedFrame.layoutMode !== 'NONE') {
      metadataFrame.layoutPositioning = 'ABSOLUTE';
    }
    
    updateMetadataPosition(metadataFrame);

    return metadataFrame;
  } catch (error) {
    notify(TRY_ERRORS.METADATA_UPDATE, true);
    console.error(TRY_ERRORS.METADATA_UPDATE, error);
    return null;
  }
}

function updateMetadataPosition(metadataFrame: FrameNode) {
  if (metadataFrame && metadataFrame.parent) {
    metadataFrame.x = 0;
    metadataFrame.y = -metadataFrame.height - 16;
  }
}

function createStatusFrame(): FrameNode {
  const statusFrame = figma.createFrame();
  const statusIndicator = figma.createEllipse();
  const statusLabel = figma.createText();
  
  // Настройка statusFrame
  Object.assign(statusFrame, {
    name: METADATA.STATUS_NAME,
    cornerRadius: TEXT_STYLES.status.cornerRadius,
    bottomLeftRadius: 0,
    verticalPadding: METADATA.PADDING.VERTICAL,
    horizontalPadding: METADATA.PADDING.HORIZONTAL,
    layoutMode: 'HORIZONTAL',
    itemSpacing: METADATA.SPACING,
    counterAxisAlignItems: 'CENTER',
    layoutSizingVertical: 'HUG',
    layoutSizingHorizontal: 'HUG',
    fills: [{ type: 'SOLID', color: COLORS.white }]
  });

  // Настройка индикатора
  Object.assign(statusIndicator, {
    name: METADATA.STATUS_INDICATOR_NAME,
    resize: [48, 48]
  });

  // Настройка метки
  Object.assign(statusLabel, {
    name: METADATA.STATUS_LABEL_NAME,
    fontSize: 24
  });

  // Группируем операции добавления
  statusFrame.appendChild(statusIndicator);
  statusFrame.appendChild(statusLabel);

  return statusFrame;
}

async function updateStatus(status: string, metadataFrame: FrameNode, taskId?: string) {
  try {
    await loadFonts();
    const statusConfig = STATUSES[status];
    
    let statusFrame = metadataFrame.findChild(node => node.name === METADATA.STATUS_NAME) as FrameNode;
    
    // Создаем все элементы за одну операцию если их нет
    if (!statusFrame) {
      statusFrame = createStatusFrame();
      metadataFrame.insertChild(0, statusFrame);
    }

    statusFrame.layoutSizingHorizontal = 'HUG';
    
    // Группируем обновление состояния
    const isDone = status === 'done';
    if (isDone && metadataFrame.parent && 'opacity' in metadataFrame.parent) {
      statusFrame.visible = false;
      metadataFrame.parent.opacity = statusConfig.opacity;
      return;
    }
    else {
      statusFrame.visible = true;
    }
    

    // Получаем все необходимые элементы за один проход
    const [statusIndicator, statusLabel] = [
      statusFrame.findChild(node => node.name === METADATA.STATUS_INDICATOR_NAME) as EllipseNode,
      statusFrame.findChild(node => node.name === METADATA.STATUS_LABEL_NAME) as TextNode
    ];

    if (!statusIndicator || !statusLabel) {
      notify(NOTIFICATIONS.STATUS_ERROR, true);
      return;
    }

    // Группируем обновление свойств
    const updates = {
      indicator: {
        fills: [{ type: 'SOLID', color: statusConfig.color }]
      },
      label: {
        characters: statusConfig.label,
        hyperlink: null as any,
        textDecoration: "NONE" as TextDecoration
      }
    };

    if (status === 'check-it' && taskId) {
      updates.label.characters = `${statusConfig.label} [${taskId}]`;
      updates.label.hyperlink = { type: "URL", value: createTaskLink(taskId) };
      updates.label.textDecoration = "UNDERLINE";
    }

    // Применяем все обновления за один раз
    Object.assign(statusIndicator, updates.indicator);
    Object.assign(statusLabel, updates.label);

    if (metadataFrame.parent && 'opacity' in metadataFrame.parent) {
      metadataFrame.parent.opacity = statusConfig.opacity;
    }

  } catch (error) {
    notify(TRY_ERRORS.STATUS_UPDATE, true);
    console.error(TRY_ERRORS.STATUS_UPDATE, error);
  }
}

// Добавление функционала Task-linker
function createTasksFrame(metadataFrame: FrameNode): FrameNode {
  const tasksFrame = figma.createFrame();
  tasksFrame.name = METADATA.TASK_LIST_NAME;
  tasksFrame.layoutMode = "HORIZONTAL";
  tasksFrame.layoutSizingVertical = 'HUG';
  tasksFrame.layoutSizingHorizontal = 'HUG';
  tasksFrame.fills = [];
  tasksFrame.itemSpacing = 4;
  tasksFrame.paddingBottom = 8;
  metadataFrame.appendChild(tasksFrame);
  return tasksFrame;
}

function validateMetadataFrame(metadataFrame: FrameNode): FrameNode | null {
  if (!metadataFrame || metadataFrame.type !== "FRAME") {
    // figma.notify("Frame-metadata не найден или некорректен");
    return null;
  }
  return metadataFrame;
}


function createTextNode(props: {
  characters: string,
  color?: RGB,
  hyperlink?: { type: "URL", value: string },
  decoration?: "UNDERLINE" | "NONE"
}) {
  const textNode = figma.createText();
  textNode.fontSize = TEXT_STYLES.default.fontSize;
  textNode.characters = props.characters;
  if (props.color) {
    textNode.fills = [{ type: 'SOLID', color: props.color }];
  }
  if (props.hyperlink) {
    textNode.hyperlink = props.hyperlink;
  }
  if (props.decoration) {
    textNode.textDecoration = props.decoration;
  }
  return textNode;
}


function addTaskToFrame(tasksFrame: FrameNode, taskId: string, addSeparator: boolean = true) {
  if (addSeparator && tasksFrame.children.length > 1) {
    const separator = createTextNode({ characters: " " });
    tasksFrame.appendChild(separator);
  }
  
  const taskNode = createTextNode({
    characters: taskId,
    color: COLORS.blue,
    hyperlink: { type: "URL", value: createTaskLink(taskId) },
    decoration: "UNDERLINE"
  });
  
  tasksFrame.appendChild(taskNode);
}

// Обновляем обработчик сообщений
figma.ui.onmessage = async (msg: { type: string, status?: string, taskId?: string, message?: string }) => {
  if (msg.type === 'error') {
    notify(msg.message!, true);
    return;
  }
  
  if (msg.type === 'update-status') {
    const metadataFrame = updateMetadataFrame();
    if (metadataFrame) {
      await updateStatus(msg.status!, metadataFrame, msg.taskId);
      updateMetadataPosition(metadataFrame);
    }
  }

  if (msg.type === 'rewrite-tasks') {
    const metadataFrame = updateMetadataFrame();
    const validFrame = validateMetadataFrame(metadataFrame!);
    if (!validFrame) return;

    const selection = figma.currentPage.selection;
    const selectedFrame = selection[0];
    const frameName = selectedFrame.name;
    // Находим все совпадения [...] в имени фрейма
    const matches = frameName.match(/\[(.*?)\]/g);
    
    if (!matches) {
      figma.notify("[Задач] в названии не найдено");
      return;
    }

    const existingTasksFrame = validFrame.findChild(node => node.name === "Task-list");
    
    if (existingTasksFrame) {
      figma.notify("Фрейм Task-list уже существует в Frame-metadata", { timeout: 2000, error: true });
      return;
    }
    
    // Собираем все задачи из всех блоков [...]
    const taskIds = matches
      .map(match => match.slice(1, -1)) // Убираем квадратные скобки
      .join(',') // Объединяем все блоки через запятую
      .split(',') // Разбиваем на отдельные задачи
      .map(id => id.trim()) // Убираем пробелы
      .filter(id => /^\d+$/.test(id)); // Оставляем только числовые ID
    
    const tasksFrame = createTasksFrame(validFrame);
    
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    const labelNode = createTextNode({ 
      characters: "task: ",
      color: COLORS.grey 
    });
    tasksFrame.appendChild(labelNode);
    
    for (let i = 0; i < taskIds.length; i++) {
      addTaskToFrame(tasksFrame, taskIds[i]);
    }
    
    tasksFrame.resize(
      tasksFrame.width,
      tasksFrame.height
    );
    
    // Удаляем все блоки [...] из названия фрейма
    selectedFrame.name = frameName.replace(/\[.*?\]/g, '').trim();
    
    updateMetadataPosition(validFrame);
  }
  
  if (msg.type === 'add-task') {
    if (!msg.taskId || msg.taskId.trim() === '') {
      notify(NOTIFICATIONS.ENTER_TASK_NUMBER, true);
      return;
    }
    
    const metadataFrame = updateMetadataFrame();
    const validFrame = validateMetadataFrame(metadataFrame!);
    if (!validFrame) return;

    let tasksFrame = validFrame.findChild(node => node.name === "Task-list") as FrameNode;
    
    if (!tasksFrame) {
      tasksFrame = createTasksFrame(validFrame);
    }
      
    async function loadFonts() {
      await figma.loadFontAsync({ 
        family: TEXT_STYLES.default.fontFamily, 
        style: TEXT_STYLES.default.fontStyle 
      });
    }
      
    const children = tasksFrame.children;
    if (children.length === 0) {
      const labelNode = createTextNode({ 
        characters: METADATA.TASK_LABEL_NAME,
        color: COLORS.grey 
      });
      tasksFrame.appendChild(labelNode);
    }
    
    // Разбиваем строку с задачами по запятой и обрабатываем каждый номер
    const taskIds = msg.taskId.split(',').map(id => id.trim());
    
    for (const taskId of taskIds) {
      if (/^\d+$/.test(taskId)) { // Проверяем, что taskId содержит только цифры
        addTaskToFrame(tasksFrame, taskId);
      }
    }
    
    tasksFrame.resize(
      tasksFrame.width,
      tasksFrame.height
    );
    
    updateMetadataPosition(validFrame);
    
    const taskCount = taskIds.length;
    const taskWord = taskCount === 1 ? 'задача' : 'задач';
    figma.notify(`${taskCount} ${taskWord} добавлено`);
  }

};