import axios from 'axios';
import { UserState } from '../services/redis.service';
import { usersDb } from '../db/users.model';
import { connectionsDb } from '../db/connections.model';
import { UserMessage, AwaitingAnswer } from '../types/message.types';
import { getEnv } from '../config/env.config';
import { formatError, getFormatReportTitle } from '../utils/string.utils';

const env = getEnv();

/**
 * Handles user input when the user is in a specific Redis state.
 * @param userMessage - User message data.
 * @param state - Current user state from Redis.
 * @returns A promise resolving to an AwaitingAnswer object indicating the result.
 */
export async function handleAwaitingInput(userMessage: UserMessage, state: string): Promise<AwaitingAnswer> {
  if (!userMessage.text) {
    return new AwaitingAnswer({ result: false, text: 'Текст отсутствует.' });
  }

  if (!isValidKey(userMessage.text, state)) {
    return new AwaitingAnswer({ result: false, text: 'Введенные данные не соответствуют ожидаемому формату.' });
  }

  try {
    if (state === UserState.AwaitingPremPass || state === UserState.AwaitingNewConnection) {
      const response = await checkConnection(userMessage.text);
      console.log('Pass checker result:', JSON.stringify(response.data));

      if (response.data.error) {
        return handleError('Возникла ошибка, попробуйте еще раз.');
      }
      if (response.data.status === false) {
        return handleError('Неверный пароль, попробуйте еще раз.');
      }

      await connectionsDb.addConnection({
        chat_id: userMessage.chat_id,
        ss: response.data.spreadsheet_id,
        title: `⚙️${getFormatReportTitle(response.data.spreadsheet_name)}`,
      });

      if (state === UserState.AwaitingPremPass) {
        await usersDb.updateType(userMessage.chat_id, userMessage.text);
        return new AwaitingAnswer({
          result: true,
          text: '✅ Спасибо. Таблица успешно подключена.',
          type: 'registered',
        });
      }
      return new AwaitingAnswer({
        result: true,
        text: '✅ Вы успешно подключили еще одну систему.',
        type: 'registered',
      });
    }

    if (state.startsWith(UserState.AwaitingConnectionTitle)) {
      const [, spreadsheetId] = state.split('?');
      if (!spreadsheetId) {
        return handleError('Ошибка, попробуйте позже');
      }
      await connectionsDb.updateTitle(userMessage.chat_id, spreadsheetId, `⚙️${userMessage.text}`);
      return new AwaitingAnswer({ result: true, text: '✅ Подключение переименовано.' });
    }

    return handleError('Возникла ошибка, попробуйте еще раз.');
  } catch (error) {
    formatError(error, `Error handling awaiting input for chat ${userMessage.chat_id}:`);
    return handleError('Возникла ошибка, попробуйте еще раз.');
  }
}

/**
 * Checks the validity of a connection key with the backend.
 * @param code - Connection key to verify.
 * @returns Axios response containing the verification result.
 */
async function checkConnection(code: string) {
  return axios.post(env.PASS_CHECKER_URL, { pass: code }, {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Validates the format of a key based on the user state.
 * @param text - The text to validate.
 * @param state - The current user state.
 * @returns True if the text matches the expected format, false otherwise.
 */
function isValidKey(text: string, state: string): boolean {
  if ([UserState.AwaitingPremPass, UserState.AwaitingNewConnection].includes(state as UserState)) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d_-]{20,}$/.test(text);
  }
  return true;
}

/**
 * Creates an AwaitingAnswer object for error cases.
 * @param message - Error message to include.
 * @returns AwaitingAnswer object with result set to false.
 */
function handleError(message: string): AwaitingAnswer {
  return new AwaitingAnswer({ result: false, text: message });
}