"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwaitingAnswer = exports.UserCb = exports.UserMsg = void 0;
class UserMsg {
    constructor(data) {
        var _a, _b;
        this.chatId = data.chat.id;
        this.text = data.text;
        this.user_id = (_a = data.from) === null || _a === void 0 ? void 0 : _a.id;
        this.username = (_b = data.from) === null || _b === void 0 ? void 0 : _b.username;
        this.messageId = data.message_id;
    }
}
exports.UserMsg = UserMsg;
class UserCb {
    constructor(data) {
        var _a, _b, _c, _d;
        this.chatId = (_a = data.message) === null || _a === void 0 ? void 0 : _a.chat.id;
        this.cb = data.data;
        this.user_id = (_b = data.from) === null || _b === void 0 ? void 0 : _b.id;
        this.username = (_c = data.from) === null || _c === void 0 ? void 0 : _c.username;
        this.messageId = (_d = data.message) === null || _d === void 0 ? void 0 : _d.message_id;
    }
}
exports.UserCb = UserCb;
class AwaitingAnswer {
    constructor(data) {
        this.text = data.text;
        this.buttons = data.buttons;
        this.result = data.result;
        this.type = data.type;
    }
}
exports.AwaitingAnswer = AwaitingAnswer;
