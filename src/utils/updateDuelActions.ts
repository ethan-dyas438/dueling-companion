import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { DUEL_ACTION } from "../constants/duelActions";

export const updateReadyStatus = (createdDuel: boolean, duelId: string, sendWebsocketAction: SendJsonMessage) => {
    let updatedDuelData;

    if (createdDuel) {
        updatedDuelData = { playerReady: { A: true } };
    } else {
        updatedDuelData = { playerReady: { B: true } };
    }

    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: updatedDuelData }
    });
};

export const updateCurrentPlayer = (duelId: string, newPlayer: string, sendWebsocketAction: SendJsonMessage) => {
    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: { currentPlayer: newPlayer } }
    });
};