import { Redis } from 'ioredis';
import { getEnv } from '../config/env.config';

export enum UserState {
  AwaitingConnectionTitle = 'awaiting_connection_title',
  AwaitingWbApiKey = 'awaiting_wb_api_key',
  AwaitingPremPass = 'awaiting_prem_pass',
  AwaitingCostArt = 'awaiting_cost_art',
  AwaitingTitleArt = 'awaiting_title_art',
  AwaitingNewConnection = 'awaiting_new_connection',
}

export const TTL = {
  USUAL: 600,
  HOUR: 3600,
};

export class RedisService {
  private client: Redis;

  constructor() {
    const env = getEnv();
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: 6379,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async getUserState(chatId: number): Promise<string | null> {
    try {
      return await this.client.get(`user:${chatId}:state`);
    } catch (error) {
      console.error(`Error getting user state for chatId ${chatId}:`, error);
      return null;
    }
  }

  async setUserState(chatId: number, state: UserState, ttlSeconds: number = TTL.HOUR): Promise<void> {
    try {
      const key = `user:${chatId}:state`;
      await this.client.set(key, state, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`Error setting user state for chatId ${chatId}:`, error);
    }
  }

  async deleteUserState(chatId: number): Promise<void> {
    try {
      await this.client.del(`user:${chatId}:state`);
    } catch (error) {
      console.error(`Error deleting user state for chatId ${chatId}:`, error);
    }
  }
}