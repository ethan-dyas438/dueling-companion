import { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonCol,
    IonFab,
    IonFabButton,
    IonFabList,
    IonGrid,
    IonIcon,
    IonLabel,
    IonLoading,
    IonPage,
    IonRow,
    NavContext,
    useIonViewWillEnter,
} from '@ionic/react';
import { add, exit } from 'ionicons/icons';
import { useParams } from 'react-router';
import './Home.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { duelWebsocket } from '../constants/urls';
import { DUEL_ACTION } from '../constants/duelActions';

enum PLAYERS {
    A = 'A',
    B = 'B',
}

const DuelMat: React.FC = () => {
  const { id: duelId } = useParams<{ id: string }>();
  let create = new URLSearchParams(location.search).get('create');
  const { navigate } = useContext(NavContext);

  const [loadingDuel, setLoadingDuel] = useState<boolean>(true);
  const [activeWebSocket, setActiveWebSocket] = useState<boolean>(true);
  const [createdDuel, setCreatedDuel] = useState<boolean>(localStorage.getItem('createdDuel') === 'true' || false);
  const [duel, setDuel] = useState(JSON.parse(localStorage.getItem('duel') || 'null'));
  const [turnActive, setTurnActive] = useState<boolean>(false);
  const { sendJsonMessage, readyState } = useWebSocket(duelWebsocket, {
    onOpen: () => {
      if (duel) {
        sendJsonMessage({
          action: DUEL_ACTION.REJOIN,
          payload: { duelId, oldConnectionId: localStorage.getItem('oldConnectionId') }
        });
      }
    },
    onMessage: (event) => {
      const formattedDuelData = JSON.parse(event.data).payload;
      localStorage.setItem('duel', JSON.stringify(formattedDuelData));
      setDuel(formattedDuelData);
      if (createdDuel) {
        localStorage.setItem('oldConnectionId', formattedDuelData.playerAId);
      } else {
        localStorage.setItem('oldConnectionId', formattedDuelData.playerBId);
      }
    },
    retryOnError: true,
    shouldReconnect: () => true,
  }, activeWebSocket);

  useIonViewWillEnter(() => {
    setActiveWebSocket(true);
    setLoadingDuel(true);
    create = new URLSearchParams(location.search).get('create');
  });

  useEffect(() => {
    if(!duel && duelId && activeWebSocket && readyState === ReadyState.OPEN) {
      if (create === 'true') {
        sendJsonMessage({
          action: DUEL_ACTION.CREATE,
          payload: { duelId }
        });
        localStorage.setItem('createdDuel', 'true');
        setCreatedDuel(true);
      } else {
        sendJsonMessage({
          action: DUEL_ACTION.JOIN,
          payload: { duelId }
        });
        localStorage.setItem('createdDuel', 'false');
        setCreatedDuel(false);
      }
    }

    if (duel && readyState === ReadyState.OPEN) {
      setLoadingDuel(false);
    }
  }, [duel, duelId, readyState]);

  const exitDuel = () => {
    if (createdDuel) {
      sendJsonMessage({
        action: DUEL_ACTION.DELETE,
        payload: { duelId }
      });
    }
    navigate('/home');
    setActiveWebSocket(false);
    setDuel(null);
    localStorage.clear();
  }

  return (
    <IonPage id="duel-mat-page">
      <IonLoading isOpen={loadingDuel} message="Loading Duel..."/>

      <IonGrid>
        <IonRow>
          <IonCol>
            <IonLabel style={{ textAlign: 'center' }}>{turnActive ? 'Your Turn' : 'Waiting on other player...'}</IonLabel>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            {/* TODO: Finish basic turn trade-off UI for Duel Mat. */}
            <IonButton disabled={!turnActive} onClick={() => setTurnActive(!turnActive)}>End Turn</IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonFab slot="fixed" horizontal="end" vertical="bottom">
        <IonFabButton>
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
        <IonFabList side="top">
          {/* TODO: Add button here for copying the duel id to the clipboard for easy sharing. */}
          <IonFabButton onClick={() => exitDuel()}>
            <IonIcon  icon={exit}></IonIcon>
          </IonFabButton>
        </IonFabList>
      </IonFab>
    </IonPage>
  );
}

export default DuelMat;
