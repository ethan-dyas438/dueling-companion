import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonLabel, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useState } from 'react';
import CardActions from './CardActions';
import { CARD_ACTIONS } from '../constants/cardActions';

interface BanishedCardsViewerProps {
    isOpen: boolean;
    setIsOpen: Function;
    duel: { [key: string]: any };
    createdDuel: boolean;
    cardOwner: boolean;
    banishedCards: { [key: string]: any }[];
    sendJsonMessage: Function;
    setIsTransferring: Function;
    setCurrentCardKey: Function;
}

const BanishedCardsViewer: React.FC<BanishedCardsViewerProps> = ({ isOpen, setIsOpen, duel, createdDuel, cardOwner, banishedCards, sendJsonMessage, setIsTransferring, setCurrentCardKey }) => {
    const [isCardActionsOpen, setIsCardActionsOpen] = useState<boolean>(false);
    const [currentCard, setCurrentCard] = useState<string>("");

    const transferCardHandler = () => {
        setIsTransferring(true);
        setCurrentCardKey(currentCard);
        setIsOpen(false);
    }

    useEffect(() => {
        if (!banishedCards || (banishedCards && banishedCards.length === 0)) {
            setIsOpen(false);
        }
    })

    return (
        <IonModal isOpen={isOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>View Banished Cards</IonTitle>
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
                        cardActions={[CARD_ACTIONS.TRANSFER_CARD, CARD_ACTIONS.SEND_TO_GRAVEYARD]}
                        cardKey={currentCard}
                        duel={duel}
                        createdDuel={createdDuel}
                        websocketAction={sendJsonMessage}
                        setCardViewerIsOpen={() => {}}
                        setIsTransferringCard={transferCardHandler}
                    />
                }
                {cardOwner ?
                    banishedCards.map((banishedCard, banishedIndex) =>
                        <IonImg src={banishedCard.cardImage} alt={`Banished Card ${banishedIndex + 1}`} key={`Banished Card ${banishedIndex + 1}`}
                            onClick={() => {
                                if (cardOwner) {
                                    setIsCardActionsOpen(true);
                                    setCurrentCard(`banished-${banishedIndex}`);
                                }
                            }}
                        />
                    ).reverse() :
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonLabel>Opponent has {banishedCards.length} banished cards.</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                }
            </IonContent>
        </IonModal>
    );
}
export default BanishedCardsViewer;
