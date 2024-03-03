import { IonActionSheet } from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core';
import { useEffect } from 'react';
import { CARD_ACTIONS, CARD_ACTION_TITLES } from '../constants/cardActions';
import { DUEL_ACTION } from '../constants/duelActions';
import { CARD_POSITIONS } from '../constants/cardPositions';

interface CardImageProps {
    isOpen: boolean;
    setIsOpen: Function;
    cardActions: CARD_ACTIONS[];
    cardKey: string;
    duel: { [key: string]: any };
    createdDuel: boolean;
    websocketAction: Function;
    setCardViewerIsOpen: Function;
}

const CardActions: React.FC<CardImageProps> = ({
    isOpen,
    setIsOpen,
    cardActions,
    cardKey,
    duel,
    createdDuel,
    websocketAction,
    setCardViewerIsOpen
}) => {
    const updateCardState = (cardProperty: string, cardValue: string | boolean) => {
        if (cardKey.includes('player')) {
            const playerToUpdate = createdDuel ? 'playerACards' : 'playerBCards';
            websocketAction({
                action: DUEL_ACTION.UPDATE,
                payload: { duelId: duel.duelId, duelData: { [playerToUpdate]: { [cardKey]: { ...duel.duelData[playerToUpdate][cardKey], [cardProperty]: cardValue } } } }
            });
        } else if (cardKey === 'extraMonsterOne' || cardKey === 'extraMonsterTwo') {
            websocketAction({
                action: DUEL_ACTION.UPDATE,
                payload: { duelId: duel.duelId, duelData: { [cardKey]: { ...duel.duelData[cardKey], [cardProperty]: cardValue } } }
            });
        }
    }

    const handleActionsDismissed = (result: OverlayEventDetail) => {
        // TODO: Implement card actions and their effects on the card image
        switch (result.data.action) {
            case CARD_ACTIONS.VIEW_CARD:
                setCardViewerIsOpen(true);
                break;
            case CARD_ACTIONS.ACTIVATE_CARD:
                updateCardState('flipped', true);
                break;
            case CARD_ACTIONS.ATTACK_POSITION:
                updateCardState('position', CARD_POSITIONS.ATTACK);
                break;
            case CARD_ACTIONS.DEFENSE_POSITION:
                updateCardState('position', CARD_POSITIONS.DEFENSE);
                break;
            case CARD_ACTIONS.BANISH:
                const playerToUpdate = createdDuel ? 'playerA' : 'playerB';
                const currentBanishedCards = duel.duelData[`${playerToUpdate}Cards`][`${playerToUpdate}Banished`]

                if (cardKey === 'extraMonsterOne' || cardKey === 'extraMonsterTwo') {
                    const banishedCard = duel.duelData[cardKey];
                    websocketAction({
                        action: DUEL_ACTION.UPDATE,
                        payload: {
                            duelId: duel.duelId,
                            duelData: {
                                [cardKey]: 'delete',
                                [`${playerToUpdate}Cards`]: {
                                    [`${playerToUpdate}Banished`]: currentBanishedCards ? [...currentBanishedCards, banishedCard] : [banishedCard]
                                }
                            }
                        }
                    });
                } else {
                    const banishedCard = duel.duelData[`${playerToUpdate}Cards`][cardKey];
                    websocketAction({
                        action: DUEL_ACTION.UPDATE,
                        payload: {
                            duelId: duel.duelId,
                            duelData: {
                                [`${playerToUpdate}Cards`]: {
                                    [cardKey]: null,
                                    [`${playerToUpdate}Banished`]: currentBanishedCards ? [...currentBanishedCards, banishedCard] : [banishedCard]
                                }
                            }
                        }
                    });
                }
                break;
            case CARD_ACTIONS.SEND_TO_GRAVEYARD:
                console.log('Implement graveyard action');
                break;
            case CARD_ACTIONS.TRANSFER_TO_OPPONENT:
                console.log('Implement transfer action');
                break;
        }

        setIsOpen(false);
    };

    let actionButtons = [
        {
            text: 'Cancel',
            role: 'cancel',
            data: {
                action: 'cancel',
            },
        },
    ]

    useEffect(() => {
        for (const cardAction of cardActions) {
            actionButtons.unshift({
                text: CARD_ACTION_TITLES[cardAction],
                role: cardAction,
                data: {
                    action: cardAction,
                }
            })
        }
    }, [cardActions])

    return (
        <IonActionSheet
            isOpen={isOpen}
            header="Card Actions"
            buttons={actionButtons}
            onDidDismiss={({ detail }) => handleActionsDismissed(detail)}
        />
    );
}
export default CardActions;
