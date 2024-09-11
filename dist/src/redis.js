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
exports.ttls = exports.rStates = exports.waitingStates = exports.redis = void 0;
const ioredis_1 = require("ioredis");
class redis {
    constructor() {
        this.client = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: 6379,
        });
    }
    getClient() {
        return this.client;
    }
    getUserState(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.get(`user:${chatId}:state`);
        });
    }
    setUserState(chatId, state, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ttlSeconds) {
                yield this.client.set(`user:${chatId}:state`, state, 'EX', ttlSeconds);
            }
            else {
                yield this.client.set(`user:${chatId}:state`, state);
            }
        });
    }
    deleteUserState(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.del(`user:${chatId}:state`);
        });
    }
}
exports.redis = redis;
exports.waitingStates = ['awaiting_article', 'awaiting_wb_api_key', 'awaiting_prem_pass', 'awaiting_cost_art', 'awaiting_title_art'];
exports.rStates = {
    waitArticle: exports.waitingStates[0],
    waitWbApiKey: exports.waitingStates[1],
    waitPremPass: exports.waitingStates[2],
    waitCostArt: exports.waitingStates[3],
    waitTitleArt: exports.waitingStates[4],
};
exports.ttls = {
    usual: 600,
    hour: 3600,
};
