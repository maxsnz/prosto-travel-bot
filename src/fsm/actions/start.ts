import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";

export const start: FSMAction = {
  onEnter: async (chatId, ctx) => {
    console.log("start onEnter");
    await fsmStore.set(chatId, { step: "start" });
    await FSM["start_flow"].onEnter(chatId, ctx);
  },
};
