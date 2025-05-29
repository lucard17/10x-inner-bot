import { bot, MessageService, RediceService } from "../bot.js";
import { handleStartMenu, sendImageWithText } from "../components/commonAnswers.js";
import { mainOptions } from "../components/buttons.js";
import { AwaitingAnswer, MessageMS, UserMsg } from "../types/messages.js";
import { waitingStates } from "../redis.js";
import { awaitingHandler } from "./awaitingHandler.js";

export async function handleMenuCommand(UserMsg: UserMsg, chat_id: number, text: string, msgs: MessageMS[]) {
  await RediceService.deleteUserState(chat_id);
  const menu = await MessageService.getSpecialMsg(chat_id, 'menu');
  await MessageService.deleteAllNewMessages(msgs, chat_id, 'menu');
  return handleStartMenu(UserMsg, text as '/start' | '/menu', !menu, menu?.message_id);
}

export async function handleUserState(chat_id: number, msgs: MessageMS[], userTextMessage: UserMsg) {
  const userState = await RediceService.getUserState(chat_id);

  if (userState && (waitingStates.includes(userState) || userState.startsWith(waitingStates[0]))) {
    const response = await bot.sendMessage(chat_id, "Проверяем...⌛️");
    const answer: AwaitingAnswer = await awaitingHandler(userTextMessage, userState);
    msgs.push({ chat_id, message_id: response.message_id, special: 'menu' });

    if (!answer.result) {
      await MessageService.saveMessages(msgs);
      return bot.editMessageText(answer.text, { chat_id, message_id: response.message_id });
    } else {
      await MessageService.deleteOldAndNewMessages(chat_id, msgs);
      await RediceService.deleteUserState(chat_id);
      const successResponse = await sendImageWithText(bot, chat_id, 'menu.jpg', answer.text, mainOptions().inline_keyboard);
      
      if (successResponse) {
        await MessageService.saveMessage({ chat_id, message_id: successResponse.message_id, special: "menu" });
      }
    }
  }
}
