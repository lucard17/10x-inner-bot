import TelegramBot from 'node-telegram-bot-api';

export interface Message {
  chat_id: number;
  message_id: number;
  direction?: string;
  content?: string;
  special?: string;
  timestamp?: number;
}

export class UserMessage {
  chat_id: number;
  text: string;
  message_id: number;
  username?: string;

  constructor(msg: TelegramBot.Message) {
    this.chat_id = msg.chat.id;
    this.text = msg.text || '';
    this.message_id = msg.message_id;
    this.username = msg.from?.username;
  }
}

export class UserCallback {
  chat_id: number;
  userCallbackData: string;
  message_id: number;
  username?: string;

  constructor(query: TelegramBot.CallbackQuery) {
    this.chat_id = query.message?.chat.id || 0;
    this.userCallbackData = query.data || '';
    this.message_id = query.message?.message_id || 0;
    this.username = query.from.username;
  }
}

export class AwaitingAnswer {
  result: boolean;
  text: string;
  type?: string;

  constructor({ result, text, type }: { result: boolean; text: string; type?: string }) {
    this.result = result;
    this.text = text;
    this.type = type;
  }
}