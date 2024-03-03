import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonLabel, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';

interface BanishedCardsViewerProps {
    isOpen: boolean;
    setIsOpen: Function;
    cardOwner: boolean;
    banishedCards: { [key: string]: any }[];
}

const BanishedCardsViewer: React.FC<BanishedCardsViewerProps> = ({ isOpen, setIsOpen, cardOwner, banishedCards }) => {
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
                {cardOwner ?
                    banishedCards.map((banishedCard, banishedIndex) => <IonImg src={banishedCard.cardImage} alt={`Banished Card ${banishedIndex + 1}`} key={`Banished Card ${banishedIndex + 1}`} />).reverse() :
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
