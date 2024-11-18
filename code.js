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
    width: 232,
    height: 200,
    themeColors: true,
    title: "Изменить статус"
});
function updateStatus(status) {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
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
        const selectedFrame = selection[0];
        console.log(selectedFrame);
        // Проверяем родительский элемент
        if (selectedFrame.parent && (selectedFrame.parent.type === 'FRAME' || selectedFrame.parent.type === 'GROUP')) {
            figma.notify('Фрейм должен быть вложен только в Section или находиться на верхнем уровне');
            return;
        }
        const statusConfig = STATUSES[status];
        let statusFrame = selectedFrame.findOne(node => node.name === 'og-Status');
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
            statusFrame.y = -statusFrame.height + 16;
            // Создаем круг
            const statusIndicator = figma.createEllipse();
            statusIndicator.name = 'Status Indicator';
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
        const statusIndicator = statusFrame.findOne(node => node.name === 'Status Indicator');
        const statusLabel = statusFrame.findOne(node => node.name === statusConfig.value); // Изменено на statusConfig.value
        statusIndicator.fills = [{ type: 'SOLID', color: statusConfig.color }];
        statusLabel.characters = statusConfig.label;
        selectedFrame.opacity = statusConfig.opacity;
    });
}
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'update-status') {
        yield updateStatus(msg.status);
    }
    figma.closePlugin();
});
if (figma.command) {
    updateStatus(figma.command);
}
