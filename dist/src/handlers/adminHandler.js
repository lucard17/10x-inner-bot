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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAdminCommand = handleAdminCommand;
const reportService_1 = require("../services/reportService");
const dotenv = __importStar(require("dotenv"));
const db_1 = __importDefault(require("../../database/db"));
dotenv.config();
function handleAdminCommand(chatId, command, bot) {
    try {
        const adminChatId = process.env.ADMIN_CHAT;
        if (!adminChatId || chatId !== +adminChatId) {
            return console.log(`Сhat id ${chatId} does not have access.`);
        }
        const action = command.split('__')[1];
        if (action === 'run_report_service') {
            console.log('admin started report serivce');
            const RS = new reportService_1.ReportService(db_1.default);
            RS.run();
        }
        if (action.startsWith('clean_db')) {
            const db = action.split('db_')[1];
            if (db) {
                db_1.default.query(`DELETE FROM ${db}`, (err, result) => {
                    if (err) {
                        console.error(`Failed to delete data from ${db}:`, err);
                    }
                    else {
                        console.log(`All data deleted from ${db} by admin`);
                    }
                });
            }
            else {
                console.error('No table specified for deletion.');
            }
        }
    }
    catch (e) {
        console.error('error in admin handler: ' + e);
    }
}
