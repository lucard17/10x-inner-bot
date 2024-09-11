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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RediceService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = __importDefault(require("dotenv"));
const buttons_1 = require("./components/buttons");
const redis_1 = require("./redis");
const answers_1 = require("./components/answers");
const msgData_1 = require("./dto/msgData");
const messageService_1 = require("./services/messageService");
const callbackHandler_1 = require("./handlers/callbackHandler");
const awaitingHandler_1 = require("./handlers/awaitingHandler");
const adminHandler_1 = require("./handlers/adminHandler");
dotenv_1.default.config();
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error('Token not found');
}
;
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
exports.RediceService = new redis_1.redis();
const messageService = new messageService_1.MessageService(bot, exports.RediceService.getClient());
bot.on('callback_query', (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = query.message) === null || _a === void 0 ? void 0 : _a.chat.id))
        return;
    return (0, callbackHandler_1.callbackHandler)(query, bot, exports.RediceService, messageService);
}));
bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const userMsg = new msgData_1.UserMsg(msg);
    const msgs = [];
    const { chatId, text, user_id, username, messageId } = userMsg;
    msgs.push({ chatId, messageId, direction: 'incoming', content: text });
    let answer;
    // if (text === '/get_chart') {
    //   const labels = Array.from({ length: 30 }, (_, i) => `Артикул ${i + 1}`);
    //   const datasets = [
    //     {
    //       label: 'Заказы',
    //       data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 1),
    //       backgroundColor: 'blue',
    //       borderColor: 'blue',
    //     },
    //     // {
    //     //   label: 'Выкупы',
    //     //   data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 1),
    //     //   backgroundColor: 'orange',
    //     //   borderColor: 'orange',
    //     // },
    //     // {
    //     //   label: 'ДРР',
    //     //   data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 1),
    //     //   borderColor: 'red',
    //     //   backgroundColor: 'rgba(255, 0, 0, 0)', // Линия, без заливки
    //     //   type: 'line',
    //     // },
    //     // {
    //     //   label: 'Прибыль',
    //     //   data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) - 10), // Допустимы отрицательные значения
    //     //   backgroundColor: 'green',
    //     //   borderColor: 'green',
    //     // },
    //   ];
    //   const chartUrl = createChartURL(labels, datasets);
    //   return bot.sendPhoto(chatId, chartUrl)
    //   .then(() => console.log('chart ok!'))
    //   .catch(console.error);
    // }
    if (!text) {
        return;
    }
    ;
    if (text.startsWith('/admin__')) {
        return (0, adminHandler_1.handleAdminCommand)(chatId, text, bot);
    }
    if (['/start', '/menu'].includes(text)) {
        yield exports.RediceService.deleteUserState(chatId);
        answer = yield (0, answers_1.handleStartMenu)(bot, userMsg, text);
    }
    ;
    const userState = yield exports.RediceService.getUserState(chatId);
    if (userState && redis_1.waitingStates.includes(userState)) {
        answer = yield bot.sendMessage(chatId, "Проверяем...⌛️");
        const response = yield (0, awaitingHandler_1.awaitingHandler)(userMsg, userState, process.env);
        msgs.push({ chatId, messageId: answer.message_id, direction: 'outgoing' });
        if (!response.result) {
            yield messageService.saveMessages(msgs);
            return bot.editMessageText(response.text, { chat_id: chatId, message_id: answer.message_id });
        }
        else {
            yield bot.editMessageText(response.text, { chat_id: chatId, message_id: answer.message_id });
            msgs.push({ chatId, messageId: answer.message_id, direction: 'outgoing' });
            yield exports.RediceService.deleteUserState(chatId);
            yield bot.editMessageReplyMarkup((0, buttons_1.mainOptions)(response.type).reply_markup, { chat_id: chatId, message_id: answer.message_id });
        }
    }
    ;
    if (text === '/help') {
        answer = yield (0, answers_1.getHelp)(bot, chatId);
    }
    ;
    if (answer && answer.message_id) {
        msgs.push({ chatId, messageId: answer.message_id, direction: 'outgoing' });
    }
    else {
        const res = yield bot.sendMessage(chatId, 'Я вас не понял. /menu.');
        msgs.push({ chatId, messageId: res.message_id, direction: 'outgoing' });
    }
    return messageService.addNewAndDelOld(msgs, chatId);
}));
console.log('Bot started!');
