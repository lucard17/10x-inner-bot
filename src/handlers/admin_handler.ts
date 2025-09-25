import TelegramBot from "node-telegram-bot-api";
import { Pool } from "pg";
import axios from "axios";
import { ReportService } from "../services/report.service";
import { usersDb } from "../db/users.model";
import { getEnv } from "../config/env.config";
import { formatError } from "../utils/string.utils";
import { migrations } from "../helpers/wip-quick-fix-migration";
import pool from "../db/db.config";
import { blacklistDb } from "../db/blacklist.model";

const env = getEnv();

const helpInfo = `
/admin__run_report_service - Run report service for the previous hour
/admin__run_report_service_hour_{number} - Run report service for a specific hour
/admin__clean_db_{tableName} - Clear a database table
/admin__delete_user_{id} - Delete a user from the users table
/admin__help - Show this help message
/admin__db_migrate_{step} - Run database migrations for a specific step
/admin__send_all_data - Send all data to spreadsheet
/admin__add_to_blacklist_{ss}_{username}
/admin__remove_from_blacklist_{ss}_{username}
`;

interface AdminAction {
  (chatId: number, bot: TelegramBot, params?: string): Promise<void>;
}

const adminActions: Record<string, AdminAction> = {
  run_report_service: async (chatId, bot) => {
    try {
      console.log("Admin started report service");
      const reportService = new ReportService(new Pool());
      await reportService.run();
      await bot.sendMessage(chatId, "Report service executed successfully.");
    } catch (error) {
      throw new Error(`Failed to run report service: ${error}`);
    }
  },
  run_report_service_hour: async (chatId, bot, params) => {
    try {
      const hour = params ? parseInt(params, 10) : NaN;
      if (isNaN(hour)) throw new Error("Invalid hour specified");
      console.log(`Admin started report service for hour ${hour}`);
      const reportService = new ReportService(new Pool());
      await reportService.run(hour);
      await bot.sendMessage(
        chatId,
        `Report service executed for hour ${hour}.`
      );
    } catch (error) {
      throw new Error(`Failed to run report service for hour: ${error}`);
    }
  },
  clean_db: async (chatId, bot, params) => {
    try {
      if (!params) throw new Error("No table specified for deletion");
      const tableName = params.replace(/[^a-zA-Z_]/g, ""); // Sanitize input
      if (!["users", "connections"].includes(tableName)) {
        throw new Error("Invalid table name");
      }
      await pool.query(`DELETE FROM ${tableName}`);
      console.log(`All data deleted from ${tableName} by admin`);
      await bot.sendMessage(chatId, `Table ${tableName} cleared successfully.`);
    } catch (error) {
      throw new Error(`Failed to clear table: ${error}`);
    }
  },
  delete_user: async (chatId, bot, params) => {
    try {
      const userId = params ? parseInt(params, 10) : NaN;
      if (isNaN(userId)) throw new Error("Invalid user ID specified");
      await pool.query("DELETE FROM users WHERE chat_id = $1", [userId]);
      console.log(`User ${userId} deleted by admin`);
      await bot.sendMessage(chatId, `User ${userId} deleted successfully.`);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  },
  help: async (chatId, bot) => {
    await bot.sendMessage(chatId, helpInfo);
  },
  db_migrate: async (chatId, bot, params) => {
    try {
      const step = params ? parseInt(params, 10) : NaN;
      if (isNaN(step) || !migrations[step])
        throw new Error("Invalid migration step");
      for (const migration of migrations[step]) {
        await pool.query(migration);
      }
      console.log(`Migration step ${step} executed successfully`);
      await bot.sendMessage(
        chatId,
        `Migration step ${step} completed successfully.`
      );
    } catch (error) {
      throw new Error(`Error during migration process: ${error}`);
    }
  },
  send_all_data: async (chatId, bot) => {
    try {
      const data = await usersDb.getAllData();
      if (!env.SS_ALL_DATA_URL)
        throw new Error("SS_ALL_DATA_URL not configured");
      await axios.post(env.SS_ALL_DATA_URL, data, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("All data sent to spreadsheet");
      await bot.sendMessage(
        chatId,
        "All data sent to spreadsheet successfully."
      );
    } catch (error) {
      throw new Error(`Error sending all data: ${error}`);
    }
  },
  add_to_blacklist: async (chatId, bot, params) => {
    try {
      const [ss, username] = params?.split("_") ?? [];
      if (!ss || !username)
        throw new Error("Some of params are not speciefied");
      const isUsernameBlacklisted = await blacklistDb.isBlacklisted(
        ss,
        username
      );
      if (isUsernameBlacklisted)
        throw new Error("Username already blacklisted");
      await blacklistDb.createBlacklist({ ss, username });
      console.log(`Added ${username} to blacklist`);
      await bot.sendMessage(chatId, `Added ${username} to blacklist`);
    } catch (error) {
      throw new Error(`Error adding to blacklist: ${error}`);
    }
  },
  remove_from_blacklist: async (chatId, bot, params) => {
    try {
      const [ss, username] = params?.split("_") ?? [];
      if (!ss || !username)
        throw new Error("Some of params are not speciefied");
      const isUsernameBlacklisted = await blacklistDb.isBlacklisted(
        ss,
        username
      );
      if (!isUsernameBlacklisted) {
        await bot.sendMessage(chatId, `Username ${username} not in blacklist`);
        return;
      }
      await blacklistDb.deleteBlacklist({ ss, username });
      console.log(`Removed ${username} from blacklist`);
      await bot.sendMessage(chatId, `Removed ${username} to blacklist`);
    } catch (error) {
      throw new Error(`Error adding to blacklist: ${error}`);
    }
  },
};

/**
 * Handles admin commands starting with /admin__.
 * @param chatId - User's chat ID.
 * @param command - Command text.
 * @param bot - Telegram bot instance.
 */
export async function handleAdminCommand(
  chatId: number,
  command: string,
  bot: TelegramBot
): Promise<void> {
  try {
    const adminChatIds = env.ADMIN_CHAT
      ? env.ADMIN_CHAT.split(",").map(Number)
      : [];
    if (!adminChatIds.includes(chatId)) {
      console.log(`Chat ID ${chatId} does not have access.`);
      await bot.sendMessage(chatId, "Access denied.");
      return;
    }

    const [prefix, action] = command.split("__");
    if (prefix !== "/admin") {
      console.log(`Invalid admin command prefix: ${prefix}`);
      return;
    }

    console.log("Admin handler action:", action);

    let handler: AdminAction | undefined;
    let params: string | undefined;

    if (action.startsWith("run_report_service_hour_")) {
      handler = adminActions.run_report_service_hour;
      params = action.split("hour_")[1];
    } else if (action.startsWith("clean_db_")) {
      handler = adminActions.clean_db;
      params = action.split("clean_db_")[1];
    } else if (action.startsWith("delete_user_")) {
      handler = adminActions.delete_user;
      params = action.split("delete_user_")[1];
    } else if (action.startsWith("db_migrate_")) {
      handler = adminActions.db_migrate;
      params = action.split("db_migrate_")[1];
    } else if (action.startsWith("add_to_blacklist_")) {
      handler = adminActions.add_to_blacklist;
      params = action.split("add_to_blacklist_")[1];
    } else if (action.startsWith("remove_from_blacklist_")) {
      handler = adminActions.remove_from_blacklist;
      params = action.split("remove_from_blacklist_")[1];
    } else {
      handler = adminActions[action];
    }

    if (handler) {
      await handler(chatId, bot, params);
    } else {
      await bot.sendMessage(
        chatId,
        "Unknown admin command. Use /admin__help for available commands."
      );
    }
  } catch (error) {
    formatError(error, `Error in admin handler for chat ${chatId}:`);
    await bot.sendMessage(
      chatId,
      "An error occurred while processing the admin command."
    );
  }
}
