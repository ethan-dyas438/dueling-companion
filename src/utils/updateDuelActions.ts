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

export const transferCard = (
    oldCardKey: string,
    newCardKey: string,
    duelData: { [key: string]: any },
    createdDuel: boolean,
    duelId: string,
    sendWebsocketAction: SendJsonMessage,
    extraMonsterPlayerOwner?: string
) => {
    let updatedDuelData
    const playerToUpdate = createdDuel ? 'playerA' : 'playerB';
    
    if (oldCardKey.includes('banished-')) {
        const currentBanishedCards = duelData[`${playerToUpdate}Cards`][`${playerToUpdate}Banished`];
        const banishedIndex = oldCardKey.split('-')[1];
        const cardData = currentBanishedCards.splice(banishedIndex, 1);

        if (newCardKey === 'extraMonsterOne' || newCardKey === 'extraMonsterTwo') {
            updatedDuelData = {
                [newCardKey]: { ...cardData[0], player: extraMonsterPlayerOwner },
                [`${playerToUpdate}Cards`]: {
                    [`${playerToUpdate}Banished`]: currentBanishedCards,
                }
            }
        } else {
            const newShortKey = `${newCardKey.substring(0, 7)}Cards`;

            if (newShortKey === `${playerToUpdate}Cards`) {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: cardData[0], [`${playerToUpdate}Banished`]: currentBanishedCards },
                }
            } else {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: cardData[0] },
                    [`${playerToUpdate}Cards`]: { [`${playerToUpdate}Banished`]: currentBanishedCards },
                };
            }
        }
    } else if (oldCardKey.includes('graveyard-')) {
        const currentGraveyardCards = duelData[`${playerToUpdate}Cards`][`${playerToUpdate}Graveyard`];
        const graveyardIndex = oldCardKey.split('-')[1];
        const cardData = currentGraveyardCards.splice(graveyardIndex, 1);

        if (newCardKey === 'extraMonsterOne' || newCardKey === 'extraMonsterTwo') {
            updatedDuelData = {
                [newCardKey]: { ...cardData[0], player: extraMonsterPlayerOwner },
                [`${playerToUpdate}Cards`]: {
                    [`${playerToUpdate}Graveyard`]: currentGraveyardCards,
                }
            }
        } else {
            const newShortKey = `${newCardKey.substring(0, 7)}Cards`;

            if (newShortKey === `${playerToUpdate}Cards`) {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: cardData[0], [`${playerToUpdate}Graveyard`]: currentGraveyardCards },
                }
            } else {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: cardData[0] },
                    [`${playerToUpdate}Cards`]: { [`${playerToUpdate}Graveyard`]: currentGraveyardCards },
                };
            }
        }
    } else if (oldCardKey === 'extraMonsterOne' || oldCardKey === 'extraMonsterTwo') {
        if (newCardKey === 'extraMonsterOne' || newCardKey === 'extraMonsterTwo') {
            updatedDuelData = {
                [newCardKey]: { ...duelData[oldCardKey], player: extraMonsterPlayerOwner },
                [oldCardKey]: 'delete',
            }
        } else {
            const newShortKey = `${newCardKey.substring(0, 7)}Cards`;
            updatedDuelData = {
                [newShortKey]: { [newCardKey]: duelData[oldCardKey] },
                [oldCardKey]: 'delete',
            }
        }
    } else {
        if (newCardKey === 'extraMonsterOne' || newCardKey === 'extraMonsterTwo') {
            const oldShortKey = `${oldCardKey.substring(0, 7)}Cards`;
            updatedDuelData = {
                [newCardKey]: { ...duelData[oldShortKey][oldCardKey], player: extraMonsterPlayerOwner },
                [oldShortKey]: { [oldCardKey]: null },
            }
        } else {
            const newShortKey = `${newCardKey.substring(0, 7)}Cards`;
            const oldShortKey = `${oldCardKey.substring(0, 7)}Cards`;
            if (newShortKey === oldShortKey) {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: duelData[oldShortKey][oldCardKey], [oldCardKey]: null },
                }
            } else {
                updatedDuelData = {
                    [newShortKey]: { [newCardKey]: duelData[oldShortKey][oldCardKey] },
                    [oldShortKey]: { [oldCardKey]: null },
                };
            }
        }
    }

    sendWebsocketAction({
        action: DUEL_ACTION.UPDATE,
        payload: {
            duelId: duelId,
            duelData: updatedDuelData,
        }
    });
}

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