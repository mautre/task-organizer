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
        yield figma.loadAllPagesAsync(); // Добавляем загрузку всех страниц
        const statusConfig = STATUSES[status];
        // Проверяем существование компонента og-Status
        let statusComponent = figma.root.findOne(node => node.type === "COMPONENT" && node.name === "og-Status");
        // Создаем компонент, если он не существует
        if (!statusComponent) {
            statusComponent = figma.createComponent();
            statusComponent.name = 'og-Status';
            statusComponent.cornerRadius = 24;
            statusComponent.bottomLeftRadius = 0;
            statusComponent.verticalPadding = 12;
            statusComponent.horizontalPadding = 20;
            statusComponent.layoutMode = 'HORIZONTAL';
            statusComponent.itemSpacing = 16;
            statusComponent.counterAxisAlignItems = 'CENTER';
            statusComponent.layoutSizingVertical = 'HUG';
            statusComponent.layoutSizingHorizontal = 'HUG';
            statusComponent.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            // Создаем круг
            const statusIndicator = figma.createEllipse();
            statusIndicator.name = 'Status Indicator';
            statusIndicator.resize(48, 48);
            // Создаем текст
            const statusLabel = figma.createText();
            statusLabel.name = 'Status Label';
            statusLabel.fontSize = 24;
            statusComponent.appendChild(statusIndicator);
            statusComponent.appendChild(statusLabel);
            // Помещаем компонент на страницу компонентов или создаем её
            let componentsPage = figma.root.findOne(page => page.name === "Status comp.");
            if (!componentsPage) {
                componentsPage = figma.createPage();
                componentsPage.name = "Status comp.";
            }
            componentsPage.appendChild(statusComponent);
        }
        let statusFrame = metadataFrame.findOne(node => node.name === 'og-Status');
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
            // Создаем экземпляр компонента
            statusFrame = statusComponent.createInstance();
            statusFrame.name = 'og-Status';
            metadataFrame.insertChild(0, statusFrame);
        }
        // Обновляем свойства экземпляра
        const statusIndicator = statusFrame.findOne(node => node.name === 'Status Indicator');
        const statusLabel = statusFrame.findOne(node => node.name === 'Status Label');
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
function createTextNode(props) {
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
function createTaskLink(taskId) {
    return `https://inside.notamedia.ru/company/personal/user/1/tasks/task/view/${taskId}/`;
}
function addTaskToFrame(tasksFrame, taskId, addComma = true) {
    if (addComma && tasksFrame.children.length > 1) {
        const comma = createTextNode({ characters: ", " });
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
        if (!matches) {
            figma.notify("[Задач] в названии не найдено");
            return;
        }
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
            const labelNode = createTextNode({
                characters: "Связанные задачи: ",
                color: COLORS.grey
            });
            tasksFrame.appendChild(labelNode);
            for (let i = 0; i < taskIds.length; i++) {
                const taskId = taskIds[i];
                if (/^\d+$/.test(taskId)) {
                    addTaskToFrame(tasksFrame, taskId);
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
            const labelNode = createTextNode({
                characters: "Связанные задачи: ",
                color: COLORS.grey
            });
            tasksFrame.appendChild(labelNode);
        }
        addTaskToFrame(tasksFrame, msg.taskId);
        tasksFrame.resize(tasksFrame.width, tasksFrame.height);
        // Добавляем обновление позиции в конце
        updateMetadataPosition(validFrame);
        figma.notify(`Задача с номером ${msg.taskId} добавлена`);
    }
    figma.closePlugin();
});
