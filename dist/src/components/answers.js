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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHelp = getHelp;
exports.handleStartMenu = handleStartMenu;
exports.handleCancelArticle = handleCancelArticle;
exports.sendImageWithText = sendImageWithText;
const path_1 = require("path");
const users_1 = require("../../database/models/users");
const buttons_1 = require("./buttons");
const user_articles_1 = require("../../database/models/user_articles");
function getHelp(bot, id) {
    return bot.sendMessage(id, `/menu - Открыть меню бота`);
}
function handleStartMenu(bot, msg, command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userExists = yield users_1.users_db.select({ chat_id: msg.chatId });
            const user = userExists.rows[0];
            const text = command === '/menu' ? ' ' : 'Привет!';
            const img = command === '/menu' ? 'menu.jpg' : 'hello.jpg';
            if (userExists.rows.length > 0) { // if user already exists
                return sendImageWithText(bot, msg.chatId, img, text, (0, buttons_1.mainOptions)(user.type));
            }
            else {
                yield users_1.users_db.insert({ chat_id: msg.chatId, username: msg.username, notification_time: 19, });
                console.log('insert new user into db: ' + msg.chatId + " " + msg.username);
                return sendImageWithText(bot, msg.chatId, img, text, (0, buttons_1.mainOptions)());
            }
        }
        catch (error) {
            console.error('error while processing the /start command', error);
            return bot.sendMessage(msg.chatId, 'Произошла ошибка. Попробуйте позже.');
        }
    });
}
function handleCancelArticle(bot, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield users_1.users_db.cancelFollowingArticle(msg.chatId);
            yield user_articles_1.user_articles_db.deleteArticle(msg.chatId);
            return sendImageWithText(bot, msg.chatId, 'success.png', 'Вы успешно отписались от отчетов по артикулу.', (0, buttons_1.mainOptions)('new'));
        }
        catch (e) {
            console.error('error while canceling following article ' + e);
            return bot.sendMessage(msg.chatId, 'Произошла ошибка. Попробуйте позже.');
        }
    });
}
function sendImageWithText(bot, chatId, imageName, caption, options) {
    const imagePath = (0, path_1.resolve)(__dirname, `../../public/messageImages/${imageName}`);
    return bot.sendPhoto(chatId, imagePath, Object.assign({ caption }, options));
}
