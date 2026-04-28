import TelegramBot, { InlineKeyboardButton } from 'node-telegram-bot-api';
import { RedisService, UserState, TTL } from '../services/redis.service';
import { CallbackAction, connectionOptions, generateConnectionsButtons, generateReportTimeButtons, mainOptions, returnConnectionMenu, returnMenu, returnMenuWithImg, yesNo } from '../components/buttons.component';
import { UserCallback } from '../types/message.types';
import { MessageService } from '../services/message.service';
import { handleStartMenu } from '../components/common-answers.component';
import { newConnectionData, parseConnectionData } from '../utils/parse.utils';
import { runPersonReport } from '../services/report.service';
import { ImageType } from '../types/image.types';
import { connectionsDb } from '../db/connections.model';

interface CallbackHandler {
  (userCallback: UserCallback, bot: TelegramBot, redis: RedisService, messageService: MessageService): Promise<void>;
}

const callbackHandlers: Record<CallbackAction, CallbackHandler> = {
  [CallbackAction.Menu]: async (userCallback, bot, redis, messageService) => {
    await redis.deleteUserState(userCallback.chat_id);
    await handleStartMenu(userCallback, '/menu');
  },
  [CallbackAction.MenuAndEdit]: async (userCallback, bot, redis, messageService) => {
    await redis.deleteUserState(userCallback.chat_id);
    const menu = await messageService.getSpecialMessage(userCallback.chat_id, 'menu');
    await handleStartMenu(userCallback, '/menu', !menu, menu?.message_id);
  },
  [CallbackAction.RegistrateUser]: async (userCallback, _, redis, messageService) => {
    await redis.setUserState(userCallback.chat_id, UserState.AwaitingPremPass, TTL.USUAL);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: '🔑 Введите код подключения :)',
      options: returnMenu(true),
    });
  },
  [CallbackAction.MyConnections]: async (userCallback, _, __, messageService) => {
    const buttons = await generateConnectionsButtons(userCallback.chat_id);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: 'Выберите подключение:',
      options: { inline_keyboard: buttons },
    });
  },
  [CallbackAction.ConnectionBtn]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: ' ',
      options: connectionOptions(newButtonCallback, data.status),
    });
  },
  [CallbackAction.NewConnection]: async (userCallback, _, redis, messageService) => {
    await redis.setUserState(userCallback.chat_id, UserState.AwaitingNewConnection, TTL.USUAL);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: '🔑 Введите код подключения',
      options: returnMenu(true),
    });
  },
  [CallbackAction.GetReportNow]: async (userCallback, bot, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: ' ',
      options: connectionOptions(newButtonCallback, data.status, true),
    });
    await runPersonReport(userCallback.chat_id, 'single', data.spreadsheetId);
    await messageService.deleteAllMessages(userCallback.chat_id);
  },
  [CallbackAction.EditReportProducts]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: `Настроить его можно в своей <a href="https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit">Системе 10X</a>, во вкладке <b>Отчёт Telegram</b>`,
      options: returnMenuWithImg(newButtonCallback),
      image: ImageType.EditProducts,
    });
  },
  [CallbackAction.EditConnectionTitle]: async (userCallback, _, redis, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const stateWithData = `${UserState.AwaitingConnectionTitle}?${data.spreadsheetId}`;

    await redis.setUserState(userCallback.chat_id, stateWithData as UserState, TTL.USUAL);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: '✏ Введите новое название подключения:',
      options: returnMenu(true),
    });
  },
  [CallbackAction.OffTable]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    if (!data.additional) {
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: 'Вы уверены, что хотите отключить ежедневную рассылку?',
        options: yesNo(`${CallbackAction.OffTable}?${newButtonCallback}`),
      });
    } else if (userCallback.userCallbackData.endsWith(CallbackAction.Yes)) {
      await connectionsDb.updateNotificationTime(userCallback.chat_id, 0, data.spreadsheetId);
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: '✅ Вы отключили ежедневную рассылку.',
        options: mainOptions(),
      });
    } else {
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: ' ',
        options: connectionOptions(newButtonCallback, data.status),
      });
    }
  },
  [CallbackAction.OffConnection]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    if (!data.additional) {
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: 'Вы уверены, что хотите удалить таблицу из подключений?',
        options: yesNo(`${CallbackAction.OffConnection}?${newButtonCallback}`),
      });
    } else if (userCallback.userCallbackData.endsWith(CallbackAction.Yes)) {
      await connectionsDb.removeConnection(userCallback.chat_id, data.spreadsheetId);
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: '✅ Вы удалили таблицу. Вы сможете подключить ее повторно в меню "Подключения"',
        options: mainOptions(),
      });
    } else {
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: ' ',
        options: connectionOptions(newButtonCallback, data.status),
      });
    }
  },
  [CallbackAction.ReturnConnection]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: ' ',
      options: connectionOptions(newButtonCallback, data.status),
    });
  },
  [CallbackAction.GetAllReportsNow]: async (userCallback, bot, __, messageService) => {
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: ' ',
      options: mainOptions(true),
    });
    await runPersonReport(userCallback.chat_id, 'all');
    await messageService.deleteAllMessages(userCallback.chat_id);
  },
  [CallbackAction.ChangeTime]: async (userCallback, _, __, messageService) => {
    const selectedTime = parseInt(userCallback.userCallbackData.split('?')[1], 10);
    if (!selectedTime) {
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: 'Выберите время по МСК, когда вам будет удобно получать отчет:',
        options: { inline_keyboard: generateReportTimeButtons(userCallback.userCallbackData) },
      });
    } else {
      await connectionsDb.updateNotificationTime(userCallback.chat_id, selectedTime);
      await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
        text: `✅ Вы будете получать отчёт ежедневно в ${selectedTime}:00`,
        options: mainOptions(),
      });
    }
  },
  [CallbackAction.MenuEditImg]: async (userCallback, _, __, messageService) => {
    const data = parseConnectionData(userCallback.userCallbackData);
    const newButtonCallback = newConnectionData(data);
    await messageService.editMessage(userCallback.chat_id, userCallback.message_id, {
      text: ' ',
      options: connectionOptions(newButtonCallback, data.status),
      image: ImageType.Menu,
    });
  },
  [CallbackAction.ReturnMain]: async () => { /* Not used directly */ },
  [CallbackAction.OnTable]: async () => { /* Not used directly */ },
  [CallbackAction.Yes]: async () => { /* Handled in OffTable/OffConnection */ },
  [CallbackAction.No]: async () => { /* Handled in OffTable/OffConnection */ },
  [CallbackAction.GoPrem]: async () => { /* Not used directly */ },
  [CallbackAction.Loading]: async () => { /* Not used directly */ },
};

export async function handleCallbackQuery(
  query: TelegramBot.CallbackQuery,
  bot: TelegramBot,
  redis: RedisService,
  messageService: MessageService,
): Promise<void> {
  const userCallback = new UserCallback(query);
  const { chat_id, userCallbackData, message_id } = userCallback;

  if (!message_id) {
    console.error('Callback handler: message_id not found');
    return;
  }
  if (!userCallbackData) {
    console.error('Callback handler: userCallbackData not found');
    return;
  }

  const [action] = userCallbackData.split('?') as [CallbackAction, string];
  const handler = callbackHandlers[action];
  if (handler) {
    await handler(userCallback, bot, redis, messageService);
  } else {
    await messageService.sendMessage(chat_id, 'Возникла ошибка при обработке ответа!', mainOptions());
    console.error(`Callback handler: Unknown action ${action}`);
  }

  try {
    await bot.answerCallbackQuery(query.id);
  } catch (err: any) {
    if (err?.code === 'ETELEGRAM') {
      console.log('Callback query expired, skipping');
    } else {
      throw err;
    }
  }
}