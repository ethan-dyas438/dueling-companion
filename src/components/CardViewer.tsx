import { IonButton, IonButtons, IonContent, IonHeader, IonImg, IonModal, IonTitle, IonToolbar } from '@ionic/react';

interface CardViewerProps {
    isOpen: boolean;
    setIsOpen: Function;
    cardImage: string;
}

const CardViewer: React.FC<CardViewerProps> = ({ isOpen, setIsOpen, cardImage }) => {
    return (
        <IonModal isOpen={isOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>View Card</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setIsOpen(false)}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonImg src={cardImage} alt="Enlarged Card Viewer" />
            </IonContent>
        </IonModal>
    );
}
export default CardViewer;
