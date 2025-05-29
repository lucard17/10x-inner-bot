import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * Generic base model for database operations.
 * @template T - The type of the database row, constrained to QueryResultRow.
 */
export abstract class BaseModel<T extends QueryResultRow> {
  protected tableName: string;
  protected pool: Pool;

  constructor(tableName: string, pool: Pool) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Retrieves all data from users and connections tables.
   * @returns Data from both tables or undefined on error.
   */
  async getAllData(): Promise<{ users: T[], connections: T[] } | undefined> {
    try {
      const usersResult = await this.pool.query('SELECT * FROM users');
      const connectionsResult = await this.pool.query('SELECT * FROM connections');
      return {
        users: usersResult.rows as T[],
        connections: connectionsResult.rows as T[],
      };
    } catch (error) {
      console.error(`Error fetching all data from ${this.tableName}:`, error);
      return undefined;
    }
  }

  /**
   * Inserts a new record into the table.
   * @param data - Data to insert.
   */
  async insert(data: Partial<T>): Promise<void> {
    try {
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      await this.pool.query(query, values);
    } catch (error) {
      console.error(`Error inserting into ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a record from the table by key.
   * @param key - Column name.
   * @param value - Value to match.
   */
  async delete(key: keyof T, value: any): Promise<void> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${String(key)} = $1`;
      await this.pool.query(query, [value]);
    } catch (error) {
      console.error(`Error deleting from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Selects records from the table based on conditions.
   * @param whereClause - Conditions for selection.
   * @returns Query result with rows typed as T.
   */
  async select(whereClause: Partial<T>): Promise<QueryResult<T>> {
    try {
      const conditions = Object.keys(whereClause)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      const values = Object.values(whereClause);
      const query = `SELECT * FROM ${this.tableName} WHERE ${conditions}`;
      const result = await this.pool.query(query, values);
      return result as QueryResult<T>;
    } catch (error) {
      console.error(`Error selecting from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Updates or inserts a record with conflict handling.
   * @param key - Key column for condition.
   * @param keyValue - Value for key column.
   * @param data - Data to update.
   * @param uniqueColumns - Columns for conflict resolution.
   */
  async update(key: keyof T, keyValue: any, data: Partial<T>, uniqueColumns: (keyof T)[]): Promise<void> {
    try {
      const columns = Object.keys(data);
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const conflictColumns = uniqueColumns.map(col => `"${String(col)}"`).join(', ');
      const conflictAction = columns
        .filter(col => !uniqueColumns.includes(col as keyof T))
        .map(col => `"${col}" = EXCLUDED."${col}"`)
        .join(', ');
      const values = [...Object.values(data), keyValue];
      const query = `
        INSERT INTO ${this.tableName} (${columnNames}, "${String(key)}")
        VALUES (${valuePlaceholders}, $${values.length})
        ON CONFLICT (${conflictColumns})
        DO UPDATE SET ${conflictAction};
      `;
      await this.pool.query(query, values);
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }
}