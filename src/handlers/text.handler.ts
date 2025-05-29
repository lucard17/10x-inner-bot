import { mainOptions } from '../components/buttons.component';
import { handleStartMenu, sendImageWithText } from '../components/common-answers.component';
import { MessageService } from '../services/message.service';
import { RedisService, UserState } from '../services/redis.service';
import { AwaitingAnswer, UserMessage } from '../types/message.types';
import { ImageType } from '../types/image.types';
import { handleAwaitingInput } from './awaiting.handler';

/**
 * Handles text messages from users, including menu commands and state-based input.
 * @param userMessage - The user's message data.
 * @param isMenuCommand - Whether the message is a menu command (/start or /menu).
 * @param redis - Redis service instance.
 * @param messageService - Message service instance.
 */
export async function handleTextMessage(
  userMessage: UserMessage,
  isMenuCommand: boolean,
  redis: RedisService,
  messageService: MessageService,
): Promise<void> {
  const { chat_id, text, message_id } = userMessage;

  if (isMenuCommand) {
    await redis.deleteUserState(chat_id);
    const menu = await messageService.getSpecialMessage(chat_id, 'menu');
    await messageService.deleteAllNewMessages([{ chat_id, message_id, special: 'menu' }], chat_id, 'menu');
    await handleStartMenu(userMessage, text as '/start' | '/menu', !menu, menu?.message_id);
    return;
  }

  const userState = await redis.getUserState(chat_id);
  if (userState && (Object.values(UserState).includes(userState as UserState) || userState.startsWith(UserState.AwaitingConnectionTitle))) {
    const response = await messageService.sendMessage(chat_id, 'Проверяем...⌛️');
    const answer: AwaitingAnswer = await handleAwaitingInput(userMessage, userState);
    const messages = [{ chat_id, message_id: response.message_id, special: 'menu' }];

    if (!answer.result) {
      await messageService.saveMessages(messages);
      await messageService.editMessage(chat_id, response.message_id, { text: answer.text });
    } else {
      await messageService.deleteOldAndNewMessages(chat_id, messages);
      await redis.deleteUserState(chat_id);
      const successResponse = await sendImageWithText(chat_id, ImageType.Menu, answer.text, mainOptions().inline_keyboard);
      if (successResponse) {
        await messageService.saveMessage({ chat_id, message_id: successResponse.message_id, special: 'menu' });
      }
    }
  }
}