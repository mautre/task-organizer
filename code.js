"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STATUSES = {
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
    width: 360,
    height: 420,
    themeColors: true,
    title: "Изменить статус и номера задач"
});
function loadFonts() {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
    });
}
function updateMetadataFrame() {
    const selection = figma.currentPage.selection;
    if (!selection.length || selection.length > 1) {
        figma.notify('Выберите один фрейм', { error: true });
        return;
    }
    // Добавляем проверку на SECTION
    if (selection[0].type === 'SECTION') {
        figma.notify('Нельзя применить к секции', { error: true });
        return;
    }
    const selectedFrame = selection[0];
    // console.log(selectedFrame);
    // Проверяем родительский элемент
    if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
        figma.notify('Фрейм должен быть вложен только в Section или находиться на верхнем уровне', { error: true });
        return;
    }
    // Находим фрейм metadata внутри выбранного фрейма  
    let metadataFrame = selectedFrame.findOne(node => node.name === 'Frame-metadata');
    if (!metadataFrame) {
        metadataFrame = figma.createFrame();
        metadataFrame.name = "Frame-metadata";
        metadataFrame.layoutMode = "VERTICAL";
        metadataFrame.locked = true;
        metadataFrame.layoutSizingVertical = 'HUG';
        metadataFrame.layoutSizingHorizontal = 'HUG';
        metadataFrame.fills = [];
        metadataFrame.itemSpacing = 16;
        selectedFrame.insertChild(0, metadataFrame);
        // Отключаем Clip content у выбранного фрейма
        selectedFrame.clipsContent = false;
        // Проверяем autolayout и устанавливаем ignore для фрейма статуса
        if (selectedFrame.layoutMode !== 'NONE') {
            metadataFrame.layoutPositioning = 'ABSOLUTE';
        }
        // Позиционируем фрейм статуса
        metadataFrame.x = 0;
        metadataFrame.y = -metadataFrame.height - 16;
    }
    return metadataFrame;
}
function updateStatus(status, metadataFrame) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const statusConfig = STATUSES[status];
        let statusFrame = metadataFrame.findOne(node => node.name === 'og-Status');
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
            statusFrame.layoutSizingVertical = 'HUG';
            statusFrame.layoutSizingHorizontal = 'HUG';
            // Создаем круг
            const statusIndicator = figma.createEllipse();
            statusIndicator.name = 'Status Indicator';
            statusIndicator.resize(48, 48);
            // Создаем текст
            const statusLabel = figma.createText();
            statusLabel.name = statusConfig.value; // Изменить на фиксированное имя
            statusLabel.fontSize = 24;
            statusFrame.appendChild(statusIndicator);
            statusFrame.appendChild(statusLabel);
            metadataFrame.insertChild(0, statusFrame);
            // Если статус 'done' и фрейм существует - скрываем его
            if (status === 'done' && statusFrame) {
                statusFrame.visible = false;
                if (metadataFrame.parent && 'opacity' in metadataFrame.parent) {
                    metadataFrame.parent.opacity = statusConfig.opacity;
                }
                return;
            }
        }
        // Обновляем свойства
        const statusIndicator = statusFrame.findOne(node => node.name === 'Status Indicator');
        let statusLabel = statusFrame.findOne(node => node.name === statusConfig.value);
        // Если не нашли текстовый слой по новому статусу, ищем любой текстовый слой и обновляем его имя
        if (!statusLabel) {
            statusLabel = statusFrame.findChild(node => node.type === 'TEXT');
            if (statusLabel) {
                statusLabel.name = statusConfig.value;
            }
        }
        if (!statusIndicator || !statusLabel) {
            figma.notify('Ошибка: не удалось найти элементы статуса');
            return;
        }
        statusIndicator.fills = [{ type: 'SOLID', color: statusConfig.color }];
        statusLabel.characters = statusConfig.label;
        if (metadataFrame.parent && 'opacity' in metadataFrame.parent) {
            metadataFrame.parent.opacity = statusConfig.opacity;
        }
    });
}
// Добавление функционала Task-linker
function createTasksFrame(metadataFrame) {
    const tasksFrame = figma.createFrame();
    tasksFrame.name = "Task-list";
    tasksFrame.layoutMode = "HORIZONTAL";
    tasksFrame.layoutSizingVertical = 'HUG';
    tasksFrame.layoutSizingHorizontal = 'HUG';
    tasksFrame.fills = [];
    tasksFrame.itemSpacing = 4;
    metadataFrame.appendChild(tasksFrame);
    return tasksFrame;
}
function validateMetadataFrame(metadataFrame) {
    if (!metadataFrame || metadataFrame.type !== "FRAME") {
        figma.notify("Frame-metadata не найден или некорректен");
        return null;
    }
    return metadataFrame;
}
function updateMetadataPosition(metadataFrame) {
    if (metadataFrame && metadataFrame.parent) {
        metadataFrame.x = 0;
        metadataFrame.y = -metadataFrame.height - 8;
    }
}
// Обновляем обработчик сообщений
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'update-status') {
        const metadataFrame = updateMetadataFrame();
        if (metadataFrame) {
            yield updateStatus(msg.status, metadataFrame);
            updateMetadataPosition(metadataFrame);
        }
    }
    if (msg.type === 'rewrite-tasks') {
        const metadataFrame = updateMetadataFrame();
        const validFrame = validateMetadataFrame(metadataFrame);
        if (!validFrame)
            return;
        const selection = figma.currentPage.selection;
        const selectedFrame = selection[0];
        const frameName = selectedFrame.name;
        const matches = frameName.match(/\[(.*?)\]/);
        if (matches && matches[1]) {
            const existingTasksFrame = validFrame.findChild(node => node.name === "Task-list");
            if (existingTasksFrame) {
                figma.notify("Фрейм Task-list уже существует в Frame-metadata", { error: true });
                return;
            }
            const tasksText = matches[1];
            const taskIds = tasksText.split(',').map(id => id.trim());
            const tasksFrame = createTasksFrame(validFrame);
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            const labelNode = figma.createText();
            labelNode.fontSize = 24;
            labelNode.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
            labelNode.characters = "Связанные задачи: ";
            tasksFrame.appendChild(labelNode);
            for (let i = 0; i < taskIds.length; i++) {
                const taskId = taskIds[i];
                if (/^\d+$/.test(taskId)) {
                    const taskUrl = `https://inside.notamedia.ru/company/personal/user/1/tasks/task/view/${taskId}/`;
                    const textNode = figma.createText();
                    textNode.fontSize = 24;
                    textNode.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.58, b: 0.75 } }];
                    textNode.characters = taskId;
                    textNode.hyperlink = { type: "URL", value: taskUrl };
                    textNode.textDecoration = "UNDERLINE";
                    tasksFrame.appendChild(textNode);
                    if (i < taskIds.filter(id => /^\d+$/.test(id)).length - 1) {
                        const comma = figma.createText();
                        comma.characters = ", ";
                        tasksFrame.appendChild(comma);
                    }
                }
            }
            tasksFrame.resize(tasksFrame.width, tasksFrame.height);
            // Удаляем номера задач из названия фрейма
            selectedFrame.name = frameName.replace(/\[.*?\]/, '').trim();
            // Добавляем обновление позиции в конце
            updateMetadataPosition(validFrame);
        }
    }
    if (msg.type === 'add-task' && msg.taskId) {
        const metadataFrame = updateMetadataFrame();
        const validFrame = validateMetadataFrame(metadataFrame);
        if (!validFrame)
            return;
        let tasksFrame = validFrame.findChild(node => node.name === "Task-list");
        if (!tasksFrame) {
            tasksFrame = createTasksFrame(validFrame);
        }
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
        const children = tasksFrame.children;
        if (children.length === 0) {
            const labelNode = figma.createText();
            labelNode.fontSize = 24;
            labelNode.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
            labelNode.characters = "Связанные задачи: ";
            tasksFrame.appendChild(labelNode);
        }
        const taskUrl = `https://inside.notamedia.ru/company/personal/user/1/tasks/task/view/${msg.taskId}/`;
        if (children.length > 1) {
            const comma = figma.createText();
            comma.fontSize = 24;
            comma.characters = ", ";
            tasksFrame.appendChild(comma);
        }
        const textNode = figma.createText();
        textNode.fontSize = 24;
        textNode.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.58, b: 0.75 } }];
        textNode.characters = msg.taskId;
        textNode.hyperlink = { type: "URL", value: taskUrl };
        textNode.textDecoration = "UNDERLINE";
        tasksFrame.appendChild(textNode);
        tasksFrame.resize(tasksFrame.width, tasksFrame.height);
        // Добавляем обновление позиции в конце
        updateMetadataPosition(validFrame);
        figma.notify(`Задача с номером ${msg.taskId} добавлена`);
    }
    figma.closePlugin();
});
