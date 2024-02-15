import { IonActionSheet } from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core';
import { useEffect } from 'react';
import { CARD_ACTIONS, CARD_ACTION_TITLES } from '../constants/cardActions';

interface CardImageProps {
    isOpen: boolean;
    setIsOpen: Function;
    cardActions: CARD_ACTIONS[];
}

const CardActions: React.FC<CardImageProps> = ({
    isOpen,
    setIsOpen,
    cardActions
}) => {
    const handleActionsDismissed = (result: OverlayEventDetail) => {
        // TODO: Implement card actions and their effects on the card image
        switch (result.data.action) {
            case CARD_ACTIONS.ACTIVATE_CARD:
                console.log('Implement flip card');
                break;
            case CARD_ACTIONS.ATTACK_POSITION:
                console.log('Implement attack position update');
                break;
            case CARD_ACTIONS.DEFENSE_POSITION:
                console.log('Implement defense position update');
                break;
            case CARD_ACTIONS.BANISH:
                console.log('Implement banish action');
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
