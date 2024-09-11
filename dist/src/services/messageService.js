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
exports.MessageService = void 0;
class MessageService {
    constructor(bot, client) {
        this.bot = bot;
        this.client = client;
    }
    // delete msg from chat
    deleteMessage(chatId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.bot.deleteMessage(chatId, messageId);
                console.log(`Сообщение с ID ${messageId} удалено из чата ${chatId}`);
            }
            catch (error) {
                console.error(`Ошибка при удалении сообщения с ID ${messageId}:`, error);
            }
        });
    }
    // save msg
    saveMessage(_a) {
        return __awaiter(this, arguments, void 0, function* ({ chatId, messageId, direction, content }) {
            const messageKey = `messages:${chatId}`;
            const message = {
                messageId,
                direction,
                content,
                timestamp: Date.now(),
            };
            yield this.client.rpush(messageKey, JSON.stringify(message));
        });
    }
    // save msgs
    saveMessages(msgs) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const msg of msgs) {
                yield this.saveMessage(msg);
            }
        });
    }
    // delete all current msgs and add new array of msgs
    addNewAndDelOld(msgs, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.deleteAllMessages(chatId);
            yield this.saveMessages(msgs);
        });
    }
    // get all msg
    getMessages(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageKey = `messages:${chatId}`;
            const messages = yield this.client.lrange(messageKey, 0, -1);
            return messages.map(message => JSON.parse(message));
        });
    }
    // delete all msgs from chat
    deleteAllMessages(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield this.getMessages(chatId);
                for (const message of messages) {
                    try {
                        yield this.bot.deleteMessage(chatId, message.messageId);
                        console.log(`Message ${message.messageId} deleted from ${chatId}`);
                    }
                    catch (error) {
                        console.error(`Error during deleting message ${message.messageId}:`, error);
                    }
                }
                const messageKey = `messages:${chatId}`;
                yield this.client.del(messageKey);
                console.log(`Все сообщения для чата ${chatId} удалены из хранилища`);
            }
            catch (error) {
                console.error(`Ошибка при удалении всех сообщений для чата ${chatId}:`, error);
            }
        });
    }
    // delete msg
    deleteMessageFromStorage(chatId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageKey = `messages:${chatId}`;
            const messages = yield this.getMessages(chatId);
            const updatedMessages = messages.filter(message => message.messageId !== messageId);
            yield this.client.del(messageKey);
            for (const msg of updatedMessages) {
                yield this.client.rpush(messageKey, JSON.stringify(msg));
            }
        });
    }
    // delete all msgs from storage
    clearMessages(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageKey = `messages:${chatId}`;
            yield this.client.del(messageKey);
        });
    }
}
exports.MessageService = MessageService;
