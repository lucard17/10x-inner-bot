import { Pool } from "pg";
import { BaseModel } from "./base.model";
import { User, UserType } from "../types/user.types";
import pool from "./db.config";

export class UsersModel extends BaseModel<User> {
  constructor(pool: Pool) {
    super("users", pool);
  }

  /**
   * Finds or creates a user by chat ID.
   * @param {number} chatId - User's chat ID.
   * @param {string | undefined} username - User's username.
   * @returns {Promise<User | null>} The user or null if not found.
   */
  async findOrCreateUser(
    chatId: number,
    username: string | undefined
  ): Promise<User | null> {
    const existingUser = await this.select({ chat_id: chatId });
    if (existingUser.rows.length > 0) {
      return existingUser.rows[0];
    }
    await this.insert({ chat_id: chatId, username, type: "new" });
    return (await this.select({ chat_id: chatId })).rows[0] || null;
  }

  /**
   * Updates user type and optionally spreadsheet ID.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @param {UserType} [decreaseTo] - Optional user type to downgrade to.
   */
  async updateType(
    chatId: number,
    spreadsheetId: string,
    decreaseTo?: UserType
  ): Promise<void> {
    const updateData: Partial<User> = decreaseTo
      ? { type: decreaseTo }
      : { type: "registered", ss: spreadsheetId };
    await this.update("chat_id", chatId, updateData, ["chat_id"]);
  }

  /**
   * Retrieves a user by chat ID.
   * @param {number} chatId - User's chat ID.
   * @returns {Promise<User | null>} The user or null if not found.
   */
  async getUserById(chatId: number): Promise<User | null> {
    const result = await this.select({ chat_id: chatId });
    return result.rows[0] || null;
  }

  /**
   * Retrieves a user by username.
   * @param {string} username - User's username.
   * @returns {Promise<User | null>} The user or null if not found.
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.select({ username });
    return result.rows[0] || null;
  }
}

export const usersDb = new UsersModel(pool);
