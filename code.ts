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
    color: { r: 0, g: 0, b: 1 },
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

figma.showUI(__html__, {
  width: 232,
  height: 200,
  themeColors: true,
  title: "Изменить статус"
});


async function updateStatus(status: string) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  
  const selection = figma.currentPage.selection;
  if (!selection.length || selection.length > 1) {
    figma.notify('Выберите один фрейм');
    return;
  }
  // Добавляем проверку на SECTION
  if (selection[0].type === 'SECTION') {
    figma.notify('Нельзя применить статус к секции');
    return;
  }
  const selectedFrame = selection[0] as FrameNode;
  console.log(selectedFrame);

  // Проверяем родительский элемент
  if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
    figma.notify('Фрейм должен быть вложен только в Section или находиться на верхнем уровне');
    return;
  }

  const statusConfig = STATUSES[status];
  
  let statusFrame = selectedFrame.findOne(node => node.name === 'og-Status') as FrameNode;
  
  // Если статус 'done' и фрейм существует - скрываем его
  if (status === 'done' && statusFrame) {
    statusFrame.visible = false;
    selectedFrame.opacity = statusConfig.opacity;
    return;
  }
  
  // Если статус не 'done' и фрейм существует - показываем его
  if (statusFrame) {
    statusFrame.visible = true;
  }    
  
  if (!statusFrame) {
    // Создаем новый фрейм статуса
    statusFrame = figma.createFrame();
    statusFrame.name = 'og-Status';
    statusFrame.cornerRadius = 12;
    statusFrame.verticalPadding = 12;
    statusFrame.horizontalPadding = 20;
    statusFrame.layoutMode = 'HORIZONTAL';
    statusFrame.itemSpacing = 16;
    statusFrame.counterAxisAlignItems = 'CENTER';
    statusFrame.locked = true;
    statusFrame.layoutSizingVertical = 'HUG';
    statusFrame.layoutSizingHorizontal = 'HUG';
    
    // Позиционируем фрейм статуса
    statusFrame.x = 0;
    statusFrame.y = - statusFrame.height + 16;
    
    // Создаем круг
    const statusIndicator = figma.createEllipse();
    statusIndicator.name = 'Status Indicator'
    statusIndicator.resize(48, 48);
    
     // Создаем текст
    const statusLabel = figma.createText();
    statusLabel.name = statusConfig.value; // Изменить на фиксированное имя
    statusLabel.fontSize = 24;

    // Отключаем Clip content у выбранного фрейма
    selectedFrame.clipsContent = false;
   
    statusFrame.appendChild(statusIndicator);
    statusFrame.appendChild(statusLabel);
    selectedFrame.insertChild(0, statusFrame); 

    // Проверяем autolayout и устанавливаем ignore для фрейма статуса
    if (selectedFrame.layoutMode !== 'NONE') {
      statusFrame.layoutPositioning = 'ABSOLUTE';
    }
  }

   // Обновляем свойства
   const statusIndicator = statusFrame.findOne(node => node.name === 'Status Indicator') as EllipseNode;
   const statusLabel = statusFrame.findOne(node => node.name === statusConfig.value) as TextNode; // Изменено на statusConfig.value
  
  statusIndicator.fills = [{ type: 'SOLID', color: statusConfig.color }];
  statusLabel.characters = statusConfig.label;
  selectedFrame.opacity = statusConfig.opacity;
}

figma.ui.onmessage = async (msg: { type: string, status: string }) => {
  if (msg.type === 'update-status') {
    await updateStatus(msg.status);
  }
  figma.closePlugin();
};

if (figma.command) {
  updateStatus(figma.command);
}