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
    IonToast,
    NavContext,
    useIonViewWillEnter,
} from '@ionic/react';
import { add, checkmarkCircle, clipboardOutline, exitOutline, refresh } from 'ionicons/icons';
import { useParams } from 'react-router';
import './Home.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { duelWebsocket } from '../constants/urls';
import { DUEL_ACTION } from '../constants/duelActions';
import { getPlayerAttribute } from '../utils/getPlayerDuelData';
import { updateCurrentPlayer, updateReadyStatus } from '../utils/updateDuelActions';
import { Clipboard } from '@capacitor/clipboard';

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
  const [isCopyToastOpen, setIsCopyToastOpen] = useState<boolean>(false);
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
        const localDuel = JSON.parse(localStorage.getItem('duel') || 'null');
        const oldConnectionId = localStorage.getItem('oldConnectionId');
        if (oldConnectionId && localDuel && localDuel.duelId === duelId) {
          sendJsonMessage({
            action: DUEL_ACTION.REJOIN,
            payload: { duelId, oldConnectionId: oldConnectionId }
          });
        } else {
          sendJsonMessage({
            action: DUEL_ACTION.JOIN,
            payload: { duelId }
          });
          localStorage.setItem('createdDuel', 'false');
          setCreatedDuel(false);
        }
      }
    }

    if (loadingDuel && duel && readyState === ReadyState.OPEN) {
      setLoadingDuel(false);
    }
  }, [duel, duelId, readyState]);

  useEffect(() => {
    if (duel && duel.duelData) {
      const playerAReady = getPlayerAttribute(true, 'playerReady', duel.duelData);
      const playerBReady = getPlayerAttribute(false, 'playerReady', duel.duelData);
      if (createdDuel && duel.duelData.currentPlayer === "" && playerAReady && playerBReady) {
        const updatedDuelData = {...duel.duelData};
        updatedDuelData.currentPlayer = PLAYERS.A;

        sendJsonMessage({
          action: DUEL_ACTION.UPDATE,
          payload: { duelId, duelData: updatedDuelData }
        });
      }

      if (createdDuel) {
        if (duel.duelData.currentPlayer === PLAYERS.A) {
          setTurnActive(true);
        } else if (duel.duelData.currentPlayer === PLAYERS.B) {
          setTurnActive(false);
        }
      } else {
        if (duel.duelData.currentPlayer === PLAYERS.A) {
          setTurnActive(false);
        } else if (duel.duelData.currentPlayer === PLAYERS.B) {
          setTurnActive(true);
        }
      }
    }
  }, [duel]);

  const copyDuelId = async () => {
    if (duelId) {
      await Clipboard.write({
        string: duelId
      });
    }
  };

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
  };

  return (
    <IonPage id="duel-mat-page">
      <IonLoading isOpen={loadingDuel} message="Loading Duel..."/>

      {duel?.duelData?.currentPlayer === "" ? 
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonLabel style={{ textAlign: 'center' }}>Waiting for players to ready...</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                disabled={getPlayerAttribute(createdDuel, 'playerReady', duel.duelData)}
                onClick={() => updateReadyStatus(createdDuel, duel.duelData, duelId, sendJsonMessage)}
              >
                Ready!
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      : 
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonLabel style={{ textAlign: 'center' }}>{turnActive ? 'Your Turn' : 'Waiting on other player...'}</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {/* Turns will be passed off between players as the need to update cards is needed.
                So passing a turn doesn't necessarily mean that a player is actually ending their turn. */}
              <IonButton
                disabled={!turnActive}
                onClick={
                  () =>
                    updateCurrentPlayer(duel.duelData, duelId, duel.duelData.currentPlayer === PLAYERS.A ? PLAYERS.B : PLAYERS.A, sendJsonMessage)
                }
              >
                End Turn
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      }

      <IonFab slot="fixed" horizontal="end" vertical="bottom">
        <IonFabButton>
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
        <IonFabList side="top">
          <IonFabButton onClick={() => exitDuel()}>
            <IonIcon  icon={exitOutline}></IonIcon>
          </IonFabButton>
          <IonFabButton onClick={() => window.location.reload()}>
            <IonIcon  icon={refresh}></IonIcon>
          </IonFabButton>
          <IonFabButton onClick={() => {
            copyDuelId();
            setIsCopyToastOpen(true);
          }}>
            <IonIcon  icon={clipboardOutline}></IonIcon>
          </IonFabButton>
        </IonFabList>
      </IonFab>

      <IonToast
        isOpen={isCopyToastOpen}
        onDidDismiss={() => setIsCopyToastOpen(false)}
        position='top'
        message="The Duel ID has been copied to your clipboard to share!"
        icon={checkmarkCircle}
        duration={5000}
      ></IonToast>
    </IonPage>
  );
}

export default DuelMat;
