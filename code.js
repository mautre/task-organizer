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
    },
    INDICATOR_SIZE: 48,
    STATUS_CORNER_RADIUS: 24
};
// Уведомления
const NOTIFICATIONS = {
    SELECT_ONE_FRAME: 'Выберите один фрейм',
    SECTION_ERROR: 'Нельзя применить к секции',
    NESTING_ERROR: 'Фрейм должен быть вложен только в Section или находиться на верхнем уровне',
    NO_TASKS: '[Задач] в названии не найдено',
    TASK_LIST_EXISTS: 'Фрейм Task-list уже существует в Frame-metadata',
    ENTER_TASK_NUMBER: 'Введите номер задачи',
    STATUS_ERROR: 'Ошибка: не удалось найти элементы статуса'
};
const TRY_ERRORS = {
    FONTS_LOAD: 'Ошибка загрузки шрифтов',
    METADATA_UPDATE: 'Ошибка при обновлении метаданных',
    STATUS_UPDATE: 'Ошибка при обновлении статуса',
    UNEXPECTED: 'Произошла непредвиденная ошибка',
    TASKS_FRAME_CREATE: 'Ошибка при создании фрейма задач'
};
// URL шаблоны
const URL_TEMPLATES = {
    TASK: 'https://inside.notamedia.ru/company/personal/user/1/tasks/task/view'
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
    blue: { r: 0.1, g: 0.58, b: 0.75 },
    white: { r: 1, g: 1, b: 1 }
};
// Утилитарные функции
function notify(message, error = false) {
    figma.notify(message, { timeout: 2000, error });
}
function createTaskLink(taskId) {
    return `${URL_TEMPLATES.TASK}/${taskId}/`;
}
// ... остальной код ...
figma.showUI(__html__, {
    width: 360,
    height: 420,
    themeColors: true,
    title: "Изменить статус и номера задач"
});
function loadFonts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield figma.loadFontAsync({
                family: TEXT_STYLES.default.fontFamily,
                style: TEXT_STYLES.default.fontStyle
            });
        }
        catch (error) {
            notify(TRY_ERRORS.FONTS_LOAD, true);
            console.error(TRY_ERRORS.FONTS_LOAD, error);
        }
    });
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
        const selectedFrame = selection[0];
        if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
            notify(NOTIFICATIONS.NESTING_ERROR, true);
            return;
        }
        // Проверяем существование Export фрейма
        let exportFrame = selectedFrame.findChild(node => node.name === 'Export');
        if (!exportFrame) {
            exportFrame = figma.createFrame();
            exportFrame.name = 'Export';
            // Копируем свойства из выбранного фрейма
            // Сначала устанавливаем базовые размеры и позицию
            exportFrame.resize(selectedFrame.width, selectedFrame.height);
            exportFrame.x = 0;
            exportFrame.y = 0;
            // Затем устанавливаем layoutMode и связанные свойства
            exportFrame.layoutMode = selectedFrame.layoutMode;
            // Только если Autolayout, то устанавливаем свойства
            if (exportFrame.layoutMode !== 'NONE') {
                exportFrame.primaryAxisAlignItems = selectedFrame.primaryAxisAlignItems;
                exportFrame.counterAxisAlignItems = selectedFrame.counterAxisAlignItems;
                exportFrame.itemSpacing = selectedFrame.itemSpacing;
                // После установки layoutMode можно задавать sizing modes
                exportFrame.layoutSizingVertical = 'HUG';
                exportFrame.layoutSizingHorizontal = 'FIXED';
            }
            // Остальные свойства
            exportFrame.clipsContent = true;
            exportFrame.paddingTop = selectedFrame.paddingTop;
            exportFrame.paddingBottom = selectedFrame.paddingBottom;
            exportFrame.paddingLeft = selectedFrame.paddingLeft;
            exportFrame.paddingRight = selectedFrame.paddingRight;
            exportFrame.fills = selectedFrame.fills;
            // Перемещаем всё содержимое кроме Frame-metadata в Export фрейм
            const metadataFrame = selectedFrame.findChild(node => node.name === METADATA.FRAME_NAME);
            for (const child of [...selectedFrame.children]) {
                if (child !== metadataFrame) {
                    exportFrame.appendChild(child);
                }
            }
            selectedFrame.appendChild(exportFrame);
        }
        // Настраиваем выбранный фрейм
        // selectedFrame.layoutMode = "VERTICAL";
        selectedFrame.paddingTop = 0;
        selectedFrame.paddingBottom = 0;
        selectedFrame.paddingLeft = 0;
        selectedFrame.paddingRight = 0;
        selectedFrame.itemSpacing = 0;
        selectedFrame.clipsContent = false;
        // Создаем или обновляем Frame-metadata
        let metadataFrame = selectedFrame.findChild(node => node.name === METADATA.FRAME_NAME);
        if (!metadataFrame) {
            metadataFrame = figma.createFrame();
            metadataFrame.name = METADATA.FRAME_NAME;
            metadataFrame.layoutMode = "VERTICAL";
            metadataFrame.layoutSizingVertical = 'FIXED';
            metadataFrame.layoutSizingHorizontal = 'HUG';
            metadataFrame.fills = [];
            metadataFrame.itemSpacing = METADATA.SPACING;
            metadataFrame.resize(metadataFrame.width, METADATA.DEFAULT_HEIGHT);
            metadataFrame.primaryAxisAlignItems = 'MAX';
            metadataFrame.clipsContent = false;
            metadataFrame.locked = true;
            // Добавляем как последний элемент
            selectedFrame.appendChild(metadataFrame);
            // Устанавливаем layoutPositioning только если родительский фрейм имеет layoutMode
            if (selectedFrame.layoutMode !== 'NONE') {
                metadataFrame.layoutPositioning = 'ABSOLUTE';
            }
        }
        else {
            if (selectedFrame.layoutMode !== 'NONE') {
                metadataFrame.layoutPositioning = 'ABSOLUTE';
            }
            else {
                metadataFrame.layoutPositioning = 'AUTO';
            }
            // Если Frame-metadata уже существует, но не является последним элементом
            const lastIndex = selectedFrame.children.length - 1;
            const currentIndex = selectedFrame.children.indexOf(metadataFrame);
            if (selectedFrame.layoutMode !== 'NONE' && currentIndex !== lastIndex) {
                selectedFrame.appendChild(metadataFrame);
            }
            else if (selectedFrame.layoutMode === 'NONE' && currentIndex !== 0) {
                selectedFrame.insertChild(0, metadataFrame);
            }
        }
        updateMetadataPosition(metadataFrame);
        return metadataFrame;
    }
    catch (error) {
        notify(TRY_ERRORS.METADATA_UPDATE, true);
        console.error(TRY_ERRORS.METADATA_UPDATE, error);
        return null;
    }
}
function updateMetadataPosition(metadataFrame) {
    if (metadataFrame && metadataFrame.parent) {
        metadataFrame.x = 0;
        metadataFrame.y = -metadataFrame.height - 16;
    }
    metadataFrame.clipsContent = false;
}
function createStatusFrame() {
    const statusFrame = figma.createFrame();
    const statusIndicator = figma.createEllipse();
    const statusLabel = figma.createText();
    // Настройка statusFrame
    statusFrame.name = METADATA.STATUS_NAME;
    statusFrame.cornerRadius = METADATA.STATUS_CORNER_RADIUS;
    statusFrame.bottomLeftRadius = 0;
    statusFrame.paddingTop = METADATA.PADDING.VERTICAL;
    statusFrame.paddingBottom = METADATA.PADDING.VERTICAL;
    statusFrame.paddingLeft = METADATA.PADDING.HORIZONTAL;
    statusFrame.paddingRight = METADATA.PADDING.HORIZONTAL;
    statusFrame.layoutMode = 'HORIZONTAL';
    statusFrame.itemSpacing = METADATA.SPACING;
    statusFrame.counterAxisAlignItems = 'CENTER';
    statusFrame.layoutSizingVertical = 'HUG';
    statusFrame.layoutSizingHorizontal = 'HUG';
    statusFrame.fills = [{ type: 'SOLID', color: COLORS.white }];
    // Настройка индикатора
    statusIndicator.name = METADATA.STATUS_INDICATOR_NAME;
    statusIndicator.resize(METADATA.INDICATOR_SIZE, METADATA.INDICATOR_SIZE);
    // Настройка метки
    statusLabel.name = METADATA.STATUS_LABEL_NAME;
    statusLabel.fontSize = TEXT_STYLES.default.fontSize;
    // Группируем операции добавления
    statusFrame.appendChild(statusIndicator);
    statusFrame.appendChild(statusLabel);
    return statusFrame;
}
function updateStatus(status, metadataFrame, taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield loadFonts();
            const statusConfig = STATUSES[status];
            let statusFrame = metadataFrame.findChild(node => node.name === METADATA.STATUS_NAME);
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
                statusFrame.findChild(node => node.name === METADATA.STATUS_INDICATOR_NAME),
                statusFrame.findChild(node => node.name === METADATA.STATUS_LABEL_NAME)
            ];
            if (!statusIndicator || !statusLabel) {
                notify(NOTIFICATIONS.STATUS_ERROR, true);
                return;
            }
            // Обновляем индикатор
            statusIndicator.fills = [{ type: 'SOLID', color: statusConfig.color }];
            // Обновляем метку
            statusLabel.characters = statusConfig.label;
            statusLabel.hyperlink = null;
            statusLabel.textDecoration = "NONE";
            if (status === 'check-it' && taskId) {
                statusLabel.characters = `${statusConfig.label} [${taskId}]`;
                statusLabel.hyperlink = { type: "URL", value: createTaskLink(taskId) };
                statusLabel.textDecoration = "UNDERLINE";
            }
            if (metadataFrame.parent && 'opacity' in metadataFrame.parent) {
                metadataFrame.parent.opacity = statusConfig.opacity;
            }
        }
        catch (error) {
            notify(TRY_ERRORS.STATUS_UPDATE, true);
            console.error(TRY_ERRORS.STATUS_UPDATE, error);
        }
    });
}
// Добавление функционала Task-linker
function createTasksFrame(metadataFrame) {
    try {
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
    catch (error) {
        notify(TRY_ERRORS.TASKS_FRAME_CREATE, true);
        console.error(TRY_ERRORS.TASKS_FRAME_CREATE, error);
        throw error;
    }
}
function validateMetadataFrame(metadataFrame) {
    if (!metadataFrame || metadataFrame.type !== "FRAME") {
        figma.notify("Frame-metadata не найден или некорректен");
        return null;
    }
    return metadataFrame;
}
function updateTaskLabel(metadataFrame) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        let taskList = metadataFrame.findChild(node => node.name === METADATA.TASK_LIST_NAME);
        let taskLabel = taskList.children[0];
        if (taskLabel) {
            taskLabel.characters = METADATA.TASK_LABEL_NAME;
        }
    });
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
function addTaskToFrame(tasksFrame, taskId, addSeparator = true) {
    if (addSeparator && tasksFrame.children.length > 1) {
        const separator = createTextNode({ characters: " " });
        separator.name = '...';
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
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'error') {
        notify(msg.message, true);
        return;
    }
    if (msg.type === 'update-status') {
        const metadataFrame = updateMetadataFrame();
        if (metadataFrame) {
            yield updateStatus(msg.status, metadataFrame, msg.taskId);
            yield updateTaskLabel(metadataFrame);
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
        // Находим все совпадения [...] в имени фрейма
        const matches = frameName.match(/\[(.*?)\]/g);
        if (!matches) {
            figma.notify(NOTIFICATIONS.NO_TASKS);
            return;
        }
        // Собираем все задачи из всех блоков [...]
        const taskIds = matches
            .map(match => match.slice(1, -1)) // Убираем квадратные скобки
            .join(',') // Объединяем все блоки через запятую
            .split(',') // Разбиваем на отдельные задачи
            .map(id => id.trim()) // Убираем пробелы
            .filter(id => /^\d+$/.test(id)); // Оставляем только числовые ID
        let tasksFrame = validFrame.findChild(node => node.name === METADATA.TASK_LIST_NAME);
        if (!tasksFrame) {
            tasksFrame = createTasksFrame(validFrame);
            yield loadFonts();
            const labelNode = createTextNode({
                characters: METADATA.TASK_LABEL_NAME,
                color: COLORS.grey
            });
            tasksFrame.appendChild(labelNode);
        }
        for (let i = 0; i < taskIds.length; i++) {
            addTaskToFrame(tasksFrame, taskIds[i]);
        }
        tasksFrame.resize(tasksFrame.width, tasksFrame.height);
        // Удаляем все блоки [...] из названия фрейма
        selectedFrame.name = frameName.replace(/\[.*?\]/g, '').trim();
        yield updateTaskLabel(validFrame);
        updateMetadataPosition(validFrame);
    }
    if (msg.type === 'add-task') {
        if (!msg.taskId || msg.taskId.trim() === '') {
            notify(NOTIFICATIONS.ENTER_TASK_NUMBER, true);
            return;
        }
        const metadataFrame = updateMetadataFrame();
        const validFrame = validateMetadataFrame(metadataFrame);
        if (!validFrame)
            return;
        let tasksFrame = validFrame.findChild(node => node.name === "Task-list");
        if (!tasksFrame) {
            tasksFrame = createTasksFrame(validFrame);
        }
        yield loadFonts();
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
        const addedTasks = [];
        for (const taskId of taskIds) {
            if (/^\d+$/.test(taskId)) {
                addTaskToFrame(tasksFrame, taskId);
                addedTasks.push(taskId);
            }
        }
        tasksFrame.resize(tasksFrame.width, tasksFrame.height);
        yield updateTaskLabel(validFrame);
        updateMetadataPosition(validFrame);
        figma.notify(`Добавлены задачи: ${addedTasks.join(', ')}`);
    }
});
