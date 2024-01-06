import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonRadio, IonRadioGroup, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { updateLifePoints } from '../utils/updateDuelActions';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { useEffect, useState } from 'react';

interface LifePointAlertProps {
    isOpen: boolean;
    setIsOpen: Function;
    duel: { [key: string]: any };
    createdDuel: boolean;
    websocketAction: SendJsonMessage;
}

const LifePointAlert: React.FC<LifePointAlertProps> = ({ isOpen, setIsOpen, duel, createdDuel, websocketAction }) => {
    const [lifePointOperation, setLifePointOperation] = useState<'add' | 'subtract'>('add');
    const [lifePointChange, setLifePointChange] = useState<number>(0);
    const [currentPlayerLifePoints, setCurrentPlayerLifePoints] =
        useState<number>(createdDuel ? duel?.duelData.playerLifePoints.A : duel?.duelData.playerLifePoints.B);

    useEffect(() => {
        setCurrentPlayerLifePoints(createdDuel ? duel?.duelData.playerLifePoints.A : duel?.duelData.playerLifePoints.B);
    }, [duel]);

    useEffect(() => {
        setLifePointOperation('add');
        setLifePointChange(0);
    }, [isOpen]);

    const updateLPAndClose = () => {
        let updatedDuelData;

        if (lifePointOperation === 'add') {
            if (createdDuel) {
                updatedDuelData = { playerLifePoints: { A: currentPlayerLifePoints + lifePointChange } };
            } else {
                updatedDuelData = { playerLifePoints: { B: currentPlayerLifePoints + lifePointChange } };
            }
        } else {
            if (createdDuel) {
                updatedDuelData = { playerLifePoints: { A: currentPlayerLifePoints - lifePointChange } };
            } else {
                updatedDuelData = { playerLifePoints: { B: currentPlayerLifePoints - lifePointChange } };
            }
        }

        updateLifePoints(updatedDuelData, duel.duelId, websocketAction);
        setIsOpen(false);
    }

    return (
        <IonModal isOpen={isOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Life Points Update</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setIsOpen(false)}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Enter a positive number to update your life points by.</IonLabel>
                            <br />
                            <IonLabel>Current Life Points: {currentPlayerLifePoints}</IonLabel>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonInput
                                label="Number to update LP by"
                                labelPlacement="stacked"
                                type="number"
                                placeholder='0'
                                value={lifePointChange}
                                onIonInput={(ev) => ev.detail.value && setLifePointChange(+ev.detail.value)}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonList>
                                <IonRadioGroup value={lifePointOperation} onIonChange={(ev) => setLifePointOperation(ev.detail.value)}>
                                    <IonItem>
                                        <IonRadio value="add">Add</IonRadio>
                                    </IonItem>
                                    <IonItem>
                                        <IonRadio value="subtract">Subtract</IonRadio>
                                    </IonItem>
                                </IonRadioGroup>
                            </IonList>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton
                                onClick={(_) => updateLPAndClose()} disabled={lifePointChange <= 0 || lifePointChange > currentPlayerLifePoints}
                            >
                                Update Life Points
                            </IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonModal>
    );
}
export default LifePointAlert;
