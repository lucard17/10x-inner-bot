export interface Connection {
  chat_id: number;
  ss: string;
  title: string;
  status: ConnectionStatus;
  notification_time?: number;
  type?: string;
}

export type ConnectionStatus = 'on' | 'off';

export interface ConnectionCallbackData {
  action: string;
  spreadsheetId: string;
  status: ConnectionStatus;
  additional: string;
}

