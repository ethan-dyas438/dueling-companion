import { useEffect, useState } from 'react';
import {
    IonFab,
    IonFabButton,
    IonFabList,
    IonIcon,
    IonLoading,
    IonPage,
} from '@ionic/react';
import { add, exit } from 'ionicons/icons';
import { useParams } from 'react-router';

function DuelMat() {
  const [loadingDuel, setLoadingDuel] = useState<boolean>(true);
  const duelId = useParams<{ id: string }>();

  useEffect(() => {
    if (!loadingDuel) {        
        setLoadingDuel(true)
    }
    setTimeout(() => {
        setLoadingDuel(false)
    }, 2000)
  }, [duelId]);

  return (
    <IonPage id="duel-mat-page">
        <IonLoading isOpen={loadingDuel} message="Loading Duel..."/>

        <IonFab slot="fixed" horizontal="end" vertical="bottom">
            <IonFabButton>
                <IonIcon icon={add}></IonIcon>
            </IonFabButton>
            <IonFabList side="top">
                <IonFabButton routerLink="/home">
                    <IonIcon icon={exit}></IonIcon>
                </IonFabButton>
            </IonFabList>
        </IonFab>
    </IonPage>
  );
}

export default DuelMat;
