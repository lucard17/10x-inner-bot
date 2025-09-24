import { Pool } from "pg";
import { Blacklist } from "../types/blacklist.types";
import { BaseModel } from "./base.model";
import pool from "./db.config";
import { usersDb } from "./users.model";
import { connectionsDb } from "./connections.model";

export class BlacklistModel extends BaseModel<Blacklist> {
  constructor(poll: Pool) {
    super("blacklist", poll);
  }

  /**
   * Retrieves a blacklisted user by username and spreadsheetID.
   * @param {string} ss - User's chat ID.
   * @param {string} username - User's chat ID.
   */
  async getBlacklisted(ss: string, username: string): Promise<Blacklist> {
    const query = `SELECT * FROM ${this.tableName} WHERE ss = $1 AND username = $2`;
    const result = await this.pool.query<Blacklist>(query, [ss, username]);
    return result.rows[0];
  }

  /**
   * Creates a blacklist by spreadsheetID and username.
   * @param {Blacklist} [blacklist] - Optional user type to downgrade to.
   */
  async createBlacklist(blacklist: Blacklist): Promise<void> {
    if (!blacklist.ss || !blacklist.username) {
      throw new Error("Missing required fields");
    }
    const user = await usersDb.getUserByUsername(blacklist.username);
    if (user) {
      await connectionsDb.removeConnection(user.chat_id, blacklist.ss);
    }
    await this.insert(blacklist);
  }

  /**
   * Delete blacklist by spreadsheetID and username.
   * @param {Blacklist} [blacklist] - Optional user type to downgrade to.
   */
  async deleteBlacklist(blacklist: Blacklist): Promise<void> {
    if (!blacklist.ss || !blacklist.username) {
      throw new Error("Missing required fields");
    }
    await this.delete("username", blacklist.username);
  }

  /**
   * Checks if username in blacklist.
   * @param {string} ss - SpreadsheetID.
   * @param {string} username - TG Username.
   */
  async isBlacklisted(ss: string, username: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE ss = $1 AND username = $2 LIMIT 1`;
    const result = await this.pool.query(query, [ss, username]);
    return result.rows.length > 0;
  }
}

export const blacklistDb = new BlacklistModel(pool);
