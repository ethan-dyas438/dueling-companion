import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { DUEL_ACTION } from "../constants/duelActions";
import { Photo } from "@capacitor/camera";
import axios from "axios";
import { cardURL } from "../constants/urls";

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

export const updateLifePoints = (updatedDuelData: { [key: string]: any }, duelId: string, sendWebsocketAction: SendJsonMessage) => {
    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: updatedDuelData }
    });
};

export const updateCardPhoto = async (createdDuel: boolean, cardSlot: string, cardImage: Photo, duelId: string, cardData: { [key: string]: any }) => {
    await axios.post(cardURL, {
        payload: {
            duelId,
            playerId: localStorage.getItem('oldConnectionId'),
            duelData: {
                cardUpdate: { createdDuel, cardSlot, cardImage, cardData }
            }
        }
    }, {
        headers: {
            'x-api-key': import.meta.env.VITE_REST_API_KEY
        }
    });
};

export const updateCurrentPlayer = (duelId: string, newPlayer: string, sendWebsocketAction: SendJsonMessage) => {
    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: { duelId, duelData: { currentPlayer: newPlayer } }
    });
};