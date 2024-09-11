import { BaseModel } from "../BaseModel";
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import pool from "../db";
import { User } from "node-telegram-bot-api";
dotenv.config();

interface Article {
  article: number;
  user_id: number;
  created_at: string;
  name: string,
  self_cost: number,
  other_cost: number,
  marketing_cost: number,
}

class ArticlesModel extends BaseModel<Article> {
  constructor(pool: Pool) {
    super('user_articles', pool)
  }

  async updateArticle(chat_id: number, key: string): Promise<void> {
    try {
      await this.insert({ article: +key, created_at: `${new Date().toISOString()}`, user_id: chat_id })
    } catch(e) {
      console.error(e)
    }
  }

  async updateField(chat_id: number, key: string, value: any) {
    try {
      const query = `
        UPDATE user_articles 
        SET ${key === 'name' ? 'name' : 'self_cost'} = $1 
        WHERE user_id = $2
      `;
      await this.pool.query(query, [value, chat_id]);
    } catch (e) {
      console.error('Error updating field:', e);
    }
  }
  
  async deleteArticle(chat_id: number) {
    try {
      const query = `DELETE FROM user_articles WHERE user_id = $1`;
      await this.pool.query(query, [chat_id]);
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  }

  async selectArticle(article: number) {
    try {
      const res = await this.select({ article });

      if (res.rows.length > 0) {
        return res.rows[0];  
      } else {
        return null
      }
    } catch (e) {
      console.error('postgres: '+e)
    }
  }
}

export const user_articles_db = new ArticlesModel(pool);