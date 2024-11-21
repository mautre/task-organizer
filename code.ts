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
};

const TEXT_STYLES = {
  default: {
    fontSize: 24,
    fontFamily: "Inter",
    fontStyle: "Regular"
  }
};

const COLORS = {
  grey: { r: 0.4, g: 0.4, b: 0.4 },
  blue: { r: 0.1, g: 0.58, b: 0.75 }
};

figma.showUI(__html__, {
  width: 360,
  height: 420,
  themeColors: true,
  title: "Изменить статус и номера задач"
});


async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
}

function updateMetadataFrame() {
  const selection = figma.currentPage.selection;
  if (!selection.length || selection.length > 1) {
    figma.notify('Выберите один фрейм', { timeout: 2000, error: true });
    return;
  }
  
  if (selection[0].type === 'SECTION') {
    figma.notify('Нельзя применить к секции', { timeout: 2000, error: true });
    return;
  }
  
  const selectedFrame = selection[0] as FrameNode;

  if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
    figma.notify('Фрейм должен быть вложен только в Section или находиться на верхнем уровне', { error: true });
    return;
  }

  // Проверяем существующий Frame-metadata
  let metadataFrame = selectedFrame.findOne(node => node.name === 'Frame-metadata') as FrameNode;
  
  if (!metadataFrame) {
    metadataFrame = figma.createFrame();
    metadataFrame.name = "Frame-metadata";
    metadataFrame.layoutMode = "VERTICAL";
    metadataFrame.locked = true;
    metadataFrame.layoutSizingVertical = 'HUG';
    metadataFrame.layoutSizingHorizontal = 'HUG';
    metadataFrame.fills = [];
    metadataFrame.itemSpacing = 16;
    
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
  
  metadataFrame.x = 0;
  metadataFrame.y = -metadataFrame.height - 16;

  return metadataFrame;
}


async function updateStatus(status: string, metadataFrame: FrameNode) {
  await loadFonts();
  // await figma.loadAllPagesAsync();
  const statusConfig = STATUSES[status];
  
  let statusFrame = metadataFrame.findOne(node => node.name === 'Status') as FrameNode;
  
  // Обработка статуса 'done'
  const isDone = status === 'done';
  if (statusFrame) {
    statusFrame.visible = !isDone;
    if (isDone && metadataFrame.parent && 'opacity' in metadataFrame.parent) {
      metadataFrame.parent.opacity = statusConfig.opacity;
      return;
    }
  }
  
  if (!statusFrame) {
    // Создаем обычный фрейм вместо компонента
    statusFrame = figma.createFrame();
    statusFrame.name = 'Status';
    statusFrame.cornerRadius = 24;
    statusFrame.bottomLeftRadius = 0;
    statusFrame.verticalPadding = 12;
    statusFrame.horizontalPadding = 20;
    statusFrame.layoutMode = 'HORIZONTAL';
    statusFrame.itemSpacing = 16;
    statusFrame.counterAxisAlignItems = 'CENTER';
    statusFrame.layoutSizingVertical = 'HUG';
    statusFrame.layoutSizingHorizontal = 'HUG';
    statusFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    // Создаем круг
    const statusIndicator = figma.createEllipse();
    statusIndicator.name = 'Status Indicator';
    statusIndicator.resize(48, 48);
    
    // Создаем текст
    const statusLabel = figma.createText();
    statusLabel.name = 'Status Label';
    statusLabel.fontSize = 24;

    statusFrame.appendChild(statusIndicator);
    statusFrame.appendChild(statusLabel);
    metadataFrame.insertChild(0, statusFrame);
  }

  // Обновляем свойства фрейма
  const statusIndicator = statusFrame.findOne(node => node.name === 'Status Indicator') as EllipseNode;
  const statusLabel = statusFrame.findOne(node => node.name === 'Status Label') as TextNode;

  if (!statusIndicator || !statusLabel) {
    figma.notify('Ошибка: не удалось найти элементы статуса');
    return;
  }
  
  statusIndicator.fills = [{ type: 'SOLID', color: statusConfig.color }];
  statusLabel.characters = statusConfig.label;
  if (metadataFrame.parent && 'opacity' in metadataFrame.parent) {
    metadataFrame.parent.opacity = statusConfig.opacity;
  }
}

// Добавление функционала Task-linker
function createTasksFrame(metadataFrame: FrameNode): FrameNode {
  const tasksFrame = figma.createFrame();
  tasksFrame.name = "Task-list";
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

function updateMetadataPosition(metadataFrame: FrameNode) {
  if (metadataFrame && metadataFrame.parent) {
    metadataFrame.x = 0;
    metadataFrame.y = -metadataFrame.height - 8;
  }
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

function createTaskLink(taskId: string) {
  return `https://inside.notamedia.ru/company/personal/user/1/tasks/task/view/${taskId}/`;
}

function addTaskToFrame(tasksFrame: FrameNode, taskId: string, addComma: boolean = true) {
  if (addComma && tasksFrame.children.length > 1) {
    const comma = createTextNode({ characters: " " });
    tasksFrame.appendChild(comma);
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
    figma.notify(msg.message!, { timeout: 2000, error: true });
    return;
  }
  
  if (msg.type === 'update-status') {
    const metadataFrame = updateMetadataFrame();
    if (metadataFrame) {
      await updateStatus(msg.status!, metadataFrame);
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
    const matches = frameName.match(/\[(.*?)\]/);
    
    if (!matches) {
      figma.notify("[Задач] в названии не найдено");
      return;
    }

    if (matches && matches[1]) {
      const existingTasksFrame = validFrame.findChild(node => node.name === "Task-list");
      
      if (existingTasksFrame) {
        figma.notify("Фрейм Task-list уже существует в Frame-metadata", { timeout: 2000, error: true });
        return;
      }
      
      const tasksText = matches[1];
      const taskIds = tasksText.split(',').map(id => id.trim());
      
      const tasksFrame = createTasksFrame(validFrame);
      
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      const labelNode = createTextNode({ 
        characters: "Задачи: ",
        color: COLORS.grey 
      });
      tasksFrame.appendChild(labelNode);
      
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        if (/^\d+$/.test(taskId)) {
          addTaskToFrame(tasksFrame, taskId);
        }
      }
      
      tasksFrame.resize(
        tasksFrame.width,
        tasksFrame.height
      );
      
      // Удаляем номера задач из названия фрейма
      selectedFrame.name = frameName.replace(/\[.*?\]/, '').trim();
      
      // Добавляем обновление позиции в конце
      updateMetadataPosition(validFrame);
    }
  }
  
  if (msg.type === 'add-task') {
    if (!msg.taskId || msg.taskId.trim() === '') {
      figma.notify('Введите номер задачи', { timeout: 2000, error: true });
      return;
    }
    
    const metadataFrame = updateMetadataFrame();
    const validFrame = validateMetadataFrame(metadataFrame!);
    if (!validFrame) return;

    let tasksFrame = validFrame.findChild(node => node.name === "Task-list") as FrameNode;
    
    if (!tasksFrame) {
      tasksFrame = createTasksFrame(validFrame);
    }
      
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
    const children = tasksFrame.children;
    if (children.length === 0) {
      const labelNode = createTextNode({ 
        characters: "Задачи: ",
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
  
  if (msg.type === 'update-status' || msg.type === 'rewrite-tasks' || msg.type === 'add-task') {
    figma.closePlugin();
  }
};