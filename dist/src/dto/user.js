"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(data) {
        var _a;
        this.chat_id = data.chat.id;
        this.username = (_a = data.from) === null || _a === void 0 ? void 0 : _a.username;
        this.wb_api_key = data.message_id;
        this.type = data.text;
        this.article = data.message_id;
        this.notification_time = null;
        this.added_at = `${new Date()}`;
    }
}
exports.User = User;
