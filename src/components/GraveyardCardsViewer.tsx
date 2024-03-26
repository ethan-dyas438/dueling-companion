import { IonButton, IonButtons, IonContent, IonHeader, IonImg, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import CardActions from './CardActions';
import { useEffect, useState } from 'react';
import { CARD_ACTIONS } from '../constants/cardActions';

interface GraveyardCardsViewerProps {
    isOpen: boolean;
    setIsOpen: Function;
    duel: { [key: string]: any };
    createdDuel: boolean;
    cardOwner: boolean;
    graveyardCards: { [key: string]: any }[];
    sendJsonMessage: Function;
    setIsTransferring: Function;
    setCurrentCardKey: Function;
}

const GraveyardCardsViewer: React.FC<GraveyardCardsViewerProps> = ({ isOpen, setIsOpen, duel, createdDuel, cardOwner, graveyardCards, sendJsonMessage, setIsTransferring, setCurrentCardKey }) => {
    const [isCardActionsOpen, setIsCardActionsOpen] = useState<boolean>(false);
    const [currentCard, setCurrentCard] = useState<string>("");

    const transferCardHandler = () => {
        setIsTransferring(true);
        setCurrentCardKey(currentCard);
        setIsOpen(false);
    }

    useEffect(() => {
        if (!graveyardCards || (graveyardCards && graveyardCards.length === 0)) {
            setIsOpen(false);
        }
    })

    return (
        <IonModal isOpen={isOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>View Graveyard Cards</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setIsOpen(false)}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                { cardOwner &&
                    <CardActions
                        isOpen={isCardActionsOpen}
                        setIsOpen={setIsCardActionsOpen}
                        cardActions={[CARD_ACTIONS.TRANSFER_CARD, CARD_ACTIONS.BANISH]}
                        cardKey={currentCard}
                        duel={duel}
                        createdDuel={createdDuel}
                        websocketAction={sendJsonMessage}
                        setCardViewerIsOpen={() => {}}
                        setIsTransferringCard={transferCardHandler}
                    />
                }
                {
                    graveyardCards.map((graveyardCard, graveyardIndex) => 
                        <IonImg src={graveyardCard.cardImage} alt={`Graveyard Card ${graveyardIndex + 1}`} key={`Graveyard Card ${graveyardIndex + 1}`}
                            onClick={() => {
                                if (cardOwner) {
                                    setIsCardActionsOpen(true);
                                    setCurrentCard(`graveyard-${graveyardIndex}`);
                                }
                            }}
                        />
                    ).reverse()
                }
            </IonContent>
        </IonModal>
    );
}
export default GraveyardCardsViewer;
