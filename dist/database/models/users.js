"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.users_db = void 0;
const BaseModel_1 = require("../BaseModel");
const dotenv = __importStar(require("dotenv"));
const db_1 = __importDefault(require("../db"));
dotenv.config();
class UsersModel extends BaseModel_1.BaseModel {
    constructor(pool) {
        super('users', pool);
    }
    findOrCreateUser(chat_id, username) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.select({ chat_id });
            if (existingUser.rows.length > 0) {
                return existingUser.rows[0];
            }
            else {
                const newUser = { chat_id, username };
                yield this.insert(newUser);
                return (yield this.select({ chat_id })).rows[0];
            }
        });
    }
    updateType(chat_id, ss, decreaseTo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (decreaseTo) {
                yield this.update('chat_id', chat_id, { type: decreaseTo }, ['chat_id']);
                return;
            }
            const newType = ss ? 'old' : 'new';
            const updateData = {
                type: newType,
                ss,
            };
            yield this.update('chat_id', chat_id, updateData, ['chat_id']);
        });
    }
    updateReportTime(chat_id, time) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentType = yield this.select({ chat_id }).then(res => { return res.rows[0].type; });
                if (currentType === 'new_art' || currentType === 'new') {
                    const updateData = { notification_time: time, type: 'new_art' };
                    yield this.update('chat_id', chat_id, updateData, ['chat_id']);
                    return 'new_art';
                }
                else {
                    const updateData = { notification_time: time, type: 'old_ss' };
                    yield this.update('chat_id', chat_id, updateData, ['chat_id']);
                    console.log('postgres: update ss report time for ' + chat_id);
                    return 'old_ss';
                }
            }
            catch (e) {
                console.error('postgres: error to update ss report time for ' + chat_id + " - " + e);
            }
        });
    }
    checkWbApiKey(chat_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.select({ chat_id });
                if (user.rows.length > 0 && user.rows[0].wb_api_key) {
                    return user.rows[0].wb_api_key;
                }
                else {
                    return false;
                }
            }
            catch (e) {
                console.error('postgres: error to check key - ' + e);
            }
        });
    }
    checkTrack(chat_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.select({ chat_id });
                if (user.rows.length > 0 && user.rows[0].article) {
                    return user.rows[0].article;
                }
                else {
                    return false;
                }
            }
            catch (e) {
                console.error('postgres: error to get article - ' + e);
            }
        });
    }
    updateWbApiKey(chat_id, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = { wb_api_key: key };
                yield this.update('chat_id', chat_id, updateData, ['chat_id']);
                console.log('postres: success to update wb api key for ' + chat_id);
            }
            catch (e) {
                console.error('postgres: error to update wb api key - ' + e);
            }
        });
    }
    updateArticle(chat_id, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = { article: key, type: 'new_art' };
                yield this.update('chat_id', chat_id, updateData, ['chat_id']);
                console.log('postres: success to update article for ' + chat_id);
            }
            catch (e) {
                console.error('postgres: error to update article - ' + e);
            }
        });
    }
    checkWbApiKeyAndTrack(chat_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.select({ chat_id });
                if (user.rows.length > 0) {
                    return [user.rows[0].wb_api_key, user.rows[0].article];
                }
                else {
                    return [false, false];
                }
            }
            catch (e) {
                console.error('postgres: error to check article and key - ' + e);
                return [false, false];
            }
        });
    }
    cancelFollowingArticle(chat_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = { article: null, type: 'new' };
                yield this.update('chat_id', chat_id, updateData, ['chat_id']);
                console.log('postres: success to cancel article for ' + chat_id);
            }
            catch (e) {
                console.error('postgres: error while canceling following article - ' + e);
            }
        });
    }
}
exports.users_db = new UsersModel(db_1.default);
