import { Pool, QueryResult } from 'pg';
import { BaseModel } from './base.model';
import { Connection, ConnectionStatus } from '../types/connection.types';
import pool from './db.config';

export class ConnectionsModel extends BaseModel<Connection> {
  constructor(pool: Pool) {
    super('connections', pool);
  }

  /**
   * Retrieves all connections for a user.
   * @param {number} chatId - User's chat ID.
   * @returns {Promise<Connection[]>} List of connections.
   */
  async getConnections(chatId: number): Promise<Connection[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1`;
    const result = await this.pool.query<Connection>(query, [chatId]);
    return result.rows;
  }

  /**
   * Retrieves a specific connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @returns {Promise<Connection | undefined>} The connection or undefined.
   */
  async getConnection(chatId: number, spreadsheetId: string): Promise<Connection | undefined> {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1 AND ss = $2`;
    const result = await this.pool.query<Connection>(query, [chatId, spreadsheetId]);
    return result.rows[0];
  }

  /**
   * Retrieves connections by notification time.
   * @param {number} notificationTime - Notification hour.
   * @returns {Promise<Connection[]>} List of connections.
   */
  async getConnectionsByTime(notificationTime: number): Promise<Connection[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE notification_time = $1`;
    return (await this.pool.query<Connection>(query, [notificationTime])).rows;
  }

  /**
   * Adds a new connection.
   * @param {Partial<Connection>} connection - Connection data.
   */
  async addConnection(connection: Partial<Connection>): Promise<void> {
    await this.insert(connection);
  }

  /**
   * Removes a connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   */
  async removeConnection(chatId: number, spreadsheetId: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE chat_id = $1 AND ss = $2`;
    await this.pool.query(query, [chatId, spreadsheetId]);
  }

  /**
   * Updates notification time and status for a connection.
   * @param {number} chatId - User's chat ID.
   * @param {number} notificationTime - Notification hour.
   * @param {string} [spreadsheetId] - Optional spreadsheet ID.
   */
  async updateNotificationTime(chatId: number, notificationTime: number, spreadsheetId?: string): Promise<void> {
    const status: ConnectionStatus = notificationTime === 0 ? 'off' : 'on';
    const values: any[] = [notificationTime, chatId, status];
    let query = `UPDATE ${this.tableName} SET notification_time = $1, status = $3 WHERE chat_id = $2`;
    if (spreadsheetId) {
      query += ` AND ss = $4`;
      values.push(spreadsheetId);
    }
    await this.pool.query(query, values);
  }

  /**
   * Updates the title of a connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @param {string} title - New title.
   */
  async updateTitle(chatId: number, spreadsheetId: string, title: string): Promise<void> {
    const query = `UPDATE ${this.tableName} SET title = $1 WHERE chat_id = $2 AND ss = $3`;
    await this.pool.query(query, [title, chatId, spreadsheetId]);
  }

  /**
   * Updates the type of a connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @param {string} type - New type.
   */
  async updateType(chatId: number, spreadsheetId: string, type: string): Promise<void> {
    const query = `UPDATE ${this.tableName} SET type = $1 WHERE chat_id = $2 AND ss = $3`;
    await this.pool.query(query, [type, chatId, spreadsheetId]);
  }

  /**
   * Updates the status of a connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @param {ConnectionStatus} status - New status.
   */
  async updateStatus(chatId: number, spreadsheetId: string, status: ConnectionStatus): Promise<void> {
    const query = `UPDATE ${this.tableName} SET status = $1 WHERE chat_id = $2 AND ss = $3`;
    await this.pool.query(query, [status, chatId, spreadsheetId]);
  }

  /**
   * Updates multiple fields of a connection.
   * @param {number} chatId - User's chat ID.
   * @param {string} spreadsheetId - Spreadsheet ID.
   * @param {Partial<Connection>} fields - Fields to update.
   */
  async updateFields(chatId: number, spreadsheetId: string, fields: Partial<Connection>): Promise<void> {
    const keys = Object.keys(fields);
    if (keys.length === 0) throw new Error('No fields to update');
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE chat_id = $${keys.length + 1} AND ss = $${keys.length + 2}`;
    await this.pool.query(query, [...Object.values(fields), chatId, spreadsheetId]);
  }
}

export const connectionsDb = new ConnectionsModel(pool);