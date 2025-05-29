import TelegramBot, { InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { UserType } from '../types/user.types';
import { ConnectionCallbackData, ConnectionStatus } from '../types/connection.types';
import { newConnectionData } from '../utils/parse.utils';
import { connectionsDb } from '../db/connections.model';

export enum CallbackAction {
  ReturnMain = 'return_main',
  RegistrateUser = 'set_old_user_type',
  OnTable = 'ton',
  OffTable = 'tof',
  Yes = 'yes',
  No = 'no',
  Menu = 'menu',
  MenuAndEdit = 'menu_edit',
  GoPrem = 'go_prem',
  Loading = 'loading',
  GetAllReportsNow = 'get_all_report_now',
  ConnectionBtn = 'con',
  MyConnections = 'myc',
  NewConnection = 'onc',
  GetReportNow = 'grn',
  ChangeTime = 'ct',
  EditReportProducts = 'erp',
  EditConnectionTitle = 'ecn',
  OffConnection = 'offc',
  ReturnConnection = 'rc',
  MenuEditImg = 'edit_menu_img',
}

interface ButtonConfig {
  text: string;
  callback_data: string;
}

const mainButtons: Record<string, ButtonConfig> = {
  returnMain: { text: '🔙 Вернуться в главное меню', callback_data: CallbackAction.ReturnMain },
  onTable: { text: '📂 Подключить телеграм отчет', callback_data: CallbackAction.OnTable },
  menu: { text: '↩️ Меню', callback_data: CallbackAction.Menu },
  menuAndEdit: { text: '↩️ Меню', callback_data: CallbackAction.MenuAndEdit },
  changeTime: { text: '🕘 Настроить расписание отчетов', callback_data: CallbackAction.ChangeTime },
  getAllReportsNow: { text: '📂 Сформировать отчеты сейчас', callback_data: CallbackAction.GetAllReportsNow },
  myConnections: { text: '📊 Подключенные таблицы', callback_data: CallbackAction.MyConnections },
  newConnection: { text: '➕ Новое подключение', callback_data: CallbackAction.NewConnection },
  loading: { text: '⏳ Загрузка...', callback_data: CallbackAction.Loading },
  registrateUser: { text: '➕ Новое подключение', callback_data: CallbackAction.RegistrateUser },
};

const connectionButtons: Record<string, (connection: string) => ButtonConfig> = {
  getReportNow: (connection) => ({ text: '📂 Сформировать отчет сейчас', callback_data: `${CallbackAction.GetReportNow}?${connection}` }),
  editReportProducts: (connection) => ({ text: '⚙️ Настроить товары в отчете', callback_data: `${CallbackAction.EditReportProducts}?${connection}` }),
  editReportName: (connection) => ({ text: '✏ Переименовать подключение', callback_data: `${CallbackAction.EditConnectionTitle}?${connection}` }),
  offTable: (connection) => ({ text: '❌ Отключить телеграм отчет', callback_data: `${CallbackAction.OffTable}?${connection}` }),
  offConnection: (connection) => ({ text: '🛑 Удалить подключение', callback_data: `${CallbackAction.OffConnection}?${connection}` }),
  returnConnection: (connection) => ({ text: '↩️ К подключению', callback_data: `${CallbackAction.ReturnConnection}?${connection}` }),
  menuEditImg: (connection) => ({ text: '↩️ К подключению', callback_data: `${CallbackAction.MenuEditImg}?${connection}` }),
};

/**
 * Sets the bot's available commands.
 * @param bot - The Telegram bot instance.
 */
export async function setBotCommands(bot: TelegramBot): Promise<void> {
  try {
    await bot.setMyCommands([{ command: '/menu', description: 'Главное меню' }]);
    console.log('Bot commands set successfully.');
  } catch (error) {
    console.error('Failed to set bot commands:', error);
  }
}

/**
 * Creates an inline keyboard from an array of button rows.
 * @param buttons - Array of button rows.
 * @returns Inline keyboard markup.
 */
export function createInlineButtons(buttons: InlineKeyboardButton[][]): InlineKeyboardMarkup {
  return { inline_keyboard: buttons };
}

/**
 * Creates a keyboard with a single "Menu" button.
 * @param edit - If true, uses the edit menu button.
 * @returns Inline keyboard markup.
 */
export function returnMenu(edit: boolean = false): InlineKeyboardMarkup {
  const button = mainButtons[edit ? 'menuAndEdit' : 'menu'];
  return createInlineButtons([[{ text: button.text, callback_data: button.callback_data }]]);
}

/**
 * Creates a keyboard with a "Menu with Image" button for a connection.
 * @param connection - Connection identifier.
 * @returns Inline keyboard markup.
 */
export function returnMenuWithImg(connection: string): InlineKeyboardMarkup {
  const button = connectionButtons.menuEditImg(connection);
  return createInlineButtons([[{ text: button.text, callback_data: button.callback_data }]]);
}

/**
 * Creates the main options keyboard based on user type.
 * @param waitReport - If true, shows a loading button.
 * @param userType - The user's type.
 * @returns Inline keyboard markup.
 */
export function mainOptions(waitReport: boolean = false, userType?: UserType): InlineKeyboardMarkup {
  if (userType?.startsWith('new')) {
    const button = mainButtons.registrateUser;
    return createInlineButtons([[{ text: button.text, callback_data: button.callback_data }]]);
  }

  const buttons = [
    [waitReport ? mainButtons.loading : mainButtons.getAllReportsNow],
    [mainButtons.myConnections],
    [mainButtons.changeTime],
  ].map(row => row.map(btn => ({ text: btn.text, callback_data: btn.callback_data })));
  return createInlineButtons(buttons);
}

/**
 * Creates a keyboard for connection-specific options.
 * @param connection - Connection identifier.
 * @param status - Connection status.
 * @param waitReport - If true, shows a loading button.
 * @returns Inline keyboard markup.
 */
export function connectionOptions(connection: string, status: ConnectionStatus, waitReport: boolean = false): InlineKeyboardMarkup {
  const buttons = [
    [waitReport ? mainButtons.loading : connectionButtons.getReportNow(connection)],
    [connectionButtons.editReportProducts(connection)],
    [connectionButtons.editReportName(connection)],
    [status === 'on' ? connectionButtons.offTable(connection) : connectionButtons.offConnection(connection)],
    [mainButtons.menuAndEdit],
  ].map(row => row.map(btn => ({ text: btn.text, callback_data: btn.callback_data })));
  return createInlineButtons(buttons);
}

/**
 * Creates a keyboard with a "Return to Connection" button.
 * @param connection - Connection identifier.
 * @returns Inline keyboard markup.
 */
export function returnConnectionMenu(connection: string): InlineKeyboardMarkup {
  const button = connectionButtons.returnConnection(connection);
  return createInlineButtons([[{ text: button.text, callback_data: button.callback_data }]]);
}

/**
 * Creates a yes/no keyboard for a callback action.
 * @param callbackPart - The callback action prefix.
 * @returns Inline keyboard markup.
 */
export function yesNo(callbackPart: string): InlineKeyboardMarkup {
  return createInlineButtons([
    [{ text: '✅ Да', callback_data: `${callbackPart}?${CallbackAction.Yes}` }],
    [{ text: '❌ Нет', callback_data: `${callbackPart}?${CallbackAction.No}` }],
  ]);
}

/**
 * Generates buttons for a user's connections.
 * @param chatId - The user's chat ID.
 * @param page - The page number for pagination.
 * @returns Array of button rows.
 */
export async function generateConnectionsButtons(chatId: number, page: number = 1): Promise<InlineKeyboardButton[][]> {
  const connections = await connectionsDb.getConnections(chatId);
  const connectionsPerPage = 12;
  const buttons: InlineKeyboardButton[][] = [];

  connections.forEach((connection, index) => {
    const data: ConnectionCallbackData = {
      action: CallbackAction.ConnectionBtn,
      spreadsheetId: connection.ss,
      status: connection.status,
      additional: '',
    };
    const rowIndex = Math.floor(index / 3);
    if (!buttons[rowIndex]) buttons[rowIndex] = [];
    buttons[rowIndex].push({
      text: connection.title || connection.ss,
      callback_data: `${data.action}?${newConnectionData(data)}`,
    });
  });

  buttons.push([
    { text: mainButtons.newConnection.text, callback_data: mainButtons.newConnection.callback_data },
    { text: mainButtons.menuAndEdit.text, callback_data: mainButtons.menuAndEdit.callback_data },
  ]);

  return buttons;
}

/**
 * Generates buttons for selecting report times.
 * @param callback - The callback action prefix.
 * @param page - The page number for pagination.
 * @returns Array of button rows.
 */
export function generateReportTimeButtons(callback: string, page: number = 0): InlineKeyboardButton[][] {
  const startTime = 9;
  const endTime = 24;
  const timesPerPage = 16;
  const buttons: InlineKeyboardButton[][] = [];

  for (let i = page * timesPerPage + startTime; i < Math.min((page + 1) * timesPerPage + startTime, endTime); i++) {
    const row = Math.floor((i - page * timesPerPage - startTime) / 4);
    if (!buttons[row]) buttons[row] = [];
    buttons[row].push({ text: `${i}:00`, callback_data: `${callback}?${i}` });
  }

  buttons.push([{ text: mainButtons.menuAndEdit.text, callback_data: mainButtons.menuAndEdit.callback_data }]);
  return buttons;
}