import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { DUEL_ACTION } from "../constants/duelActions";

export const updateReadyStatus = (createdDuel: boolean, duelData: {[key: string]: any}, duelId: string, sendWebsocketAction: SendJsonMessage) => {
    let updatedDuelData = {...duelData};

    if (createdDuel) {
        updatedDuelData.playerReady.A = true;
    } else {
        updatedDuelData.playerReady.B = true;
    }

    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: updatedDuelData }
    });
};

export const updateCurrentPlayer = (duelData: {[key: string]: any}, duelId: string, newPlayer: string, sendWebsocketAction: SendJsonMessage) => {
    let updatedDuelData = {...duelData, currentPlayer: newPlayer };

    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: updatedDuelData }
    });
};