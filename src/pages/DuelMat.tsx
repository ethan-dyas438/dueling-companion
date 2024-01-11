import { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonFooter,
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
import { add, checkmarkCircle, clipboardOutline, diceOutline, exitOutline, refresh } from 'ionicons/icons';
import { useParams } from 'react-router';
import './Home.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { duelWebsocket } from '../constants/urls';
import { DUEL_ACTION } from '../constants/duelActions';
import { getPlayerAttribute } from '../utils/getPlayerDuelData';
import { updateReadyStatus } from '../utils/updateDuelActions';
import { Clipboard } from '@capacitor/clipboard';
import LifePointAlert from '../components/LifePointAlert';
import CardImage from '../components/CardImage';
import CardActions from '../components/CardActions';
import { CARD_ACTIONS } from '../constants/cardActions';

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
  const [duel, setDuel] = useState<{ [key: string]: any }>(JSON.parse(localStorage.getItem('duel') || 'null'));
  const [turnActive, setTurnActive] = useState<boolean>(false);
  const [diceResult, setDiceResult] = useState<number>(0);
  const [isLPAlertOpen, setIsLPAlertOpen] = useState<boolean>(false);
  const [isCardActionsOpen, setIsCardActionsOpen] = useState<boolean>(false);
  const [currentCardActions, setCurrentCardActions] = useState<CARD_ACTIONS[]>([]);
  const [isDiceToastOpen, setIsDiceToastOpen] = useState<boolean>(false);
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
    if (!duel && duelId && activeWebSocket && readyState === ReadyState.OPEN) {
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
        const updatedDuelData = { ...duel.duelData };
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

  const handleCardActionsOpen = (cardData: { [key: string]: any }) => {
    // TODO: Use the cardData to set the card actions
    setCurrentCardActions([]);
    setIsCardActionsOpen(true);
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
    setDuel(JSON.parse('null'));
  };

  const renderOponentCards = () => {
    const oponentPlayer = createdDuel ? 'playerB' : 'playerA';
    const cardsKey = `${oponentPlayer}Cards`;

    return (
      <>
        <IonRow>
          <IonCol><CardImage placeholderImage="resources\yugiohCard.png" altText="Main Deck Slot" /></IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapFive`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapFour`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapThree`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapTwo`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapOne`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage placeholderImage="resources\yugiohCard.png" altText="Extra Deck Slot" /></IonCol>
        </IonRow>
        <IonRow>
          <IonCol><CardImage placeholderImage="resources\placeholderGraveyard.png" altText="Graveyard Slot" /></IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterFive`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterFour`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterThree`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterTwo`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterOne`}
              duel={duel}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderFieldZone.png"
              altText="Field Spell Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}FieldSpell`}
              duel={duel}
            />
          </IonCol>
        </IonRow>
      </>
    );
  }

  const renderYourCards = () => {
    const oponentPlayer = createdDuel ? 'playerA' : 'playerB';
    const cardsKey = `${oponentPlayer}Cards`;

    return (
      <>
        <IonRow>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderFieldZone.png"
              altText="Field Spell Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}FieldSpell`}
              duel={duel}
              shortCardKey="FieldSpell"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterOne`}
              duel={duel}
              shortCardKey="MonsterOne"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterTwo`}
              duel={duel}
              shortCardKey="MonsterTwo"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterThree`}
              duel={duel}
              shortCardKey="MonsterThree"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterFour`}
              duel={duel}
              shortCardKey="MonsterFour"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterFive`}
              duel={duel}
              shortCardKey="MonsterFive"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol><CardImage placeholderImage="resources\placeholderGraveyard.png" altText="Graveyard Slot" /></IonCol>
        </IonRow>
        <IonRow>
          <IonCol><CardImage placeholderImage="resources\yugiohCard.png" altText="Extra Deck Slot" /></IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapOne`}
              duel={duel}
              shortCardKey="SpellTrapOne"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapTwo`}
              duel={duel}
              shortCardKey="SpellTrapTwo"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapThree`}
              duel={duel}
              shortCardKey="SpellTrapThree"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapFour`}
              duel={duel}
              shortCardKey="SpellTrapFour"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapFive`}
              duel={duel}
              shortCardKey="SpellTrapFive"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol><CardImage placeholderImage="resources\yugiohCard.png" altText="Main Deck Slot" /></IonCol>
        </IonRow>
      </>
    );
  }

  // TODO: Start on adding card actions. The card data model will need to be updated.
  // TODO: Implement enlarged image viewer. Could be a modal for single images, then for graveyard and banished it
  //      could be a carousel (with the graveyard and banished views enabling actions).
  // TODO: Look into issue, where if a image upload is cancelled then a different slot is selected the image still goes to the originally
  //      selected slot.

  return (
    <IonPage id="duel-mat-page" style={{ overflowY: "scroll" }}>
      <IonLoading isOpen={loadingDuel} message="Loading Duel..." />
      <LifePointAlert isOpen={isLPAlertOpen} setIsOpen={setIsLPAlertOpen} duel={duel} createdDuel={createdDuel} websocketAction={sendJsonMessage} />
      <CardActions isOpen={isCardActionsOpen} setIsOpen={setIsCardActionsOpen} cardActions={currentCardActions} />

      <IonContent>
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
                  onClick={() => updateReadyStatus(createdDuel, duelId, sendJsonMessage)}
                >
                  Ready!
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          :
          <IonGrid>
            {renderOponentCards()}
            <IonRow>
              <IonCol style={{ height: "15rem" }}>
                <CardImage style={{ height: "90%" }} placeholderImage="resources\placeholderBanished.png" altText="Banished Slot" />
              </IonCol>
              <IonCol style={{ height: "15rem" }}>
                <CardImage
                  style={{ height: "90%" }}
                  placeholderImage="resources\placeholderExtraMonster.png"
                  altText="Extra Monster Card Slot"
                  shortCardKey="extraMonsterTwo"
                  duel={duel}
                  createdDuel={createdDuel}
                  cardOwner
                  handleCardActionsOpen={handleCardActionsOpen}
                />
              </IonCol>
              <IonCol>
                <IonLabel>Their Life Points: {createdDuel ? duel?.duelData.playerLifePoints.B : duel?.duelData.playerLifePoints.A}</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Your Life Points:</IonLabel>
                <IonButton onClick={(_) => setIsLPAlertOpen(true)}>
                  {createdDuel ? duel?.duelData.playerLifePoints.A : duel?.duelData.playerLifePoints.B}
                </IonButton>
              </IonCol>
              <IonCol style={{ height: "15rem" }}>
                <CardImage
                  style={{ height: "90%" }}
                  placeholderImage="resources\placeholderExtraMonster.png"
                  altText="Extra Monster Card Slot"
                  shortCardKey="extraMonsterOne"
                  duel={duel}
                  createdDuel={createdDuel}
                  cardOwner
                  handleCardActionsOpen={handleCardActionsOpen}
                />
              </IonCol>
              <IonCol style={{ height: "15rem" }}>
                <CardImage style={{ height: "90%" }} placeholderImage="resources\placeholderBanished.png" altText="Banished Slot" />
              </IonCol>
            </IonRow>
            {renderYourCards()}
            {/* <IonRow style={{ paddingTop: "2rem" }}>
              <IonCol>
                <div style={{ border: "solid white 1px", marginBottom: "2rem" }} />
                <IonLabel style={{ textAlign: 'center' }}>{turnActive ? 'Your Turn' : 'Waiting on other player...'}</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                // Turns will be passed off between players as the need to update cards is needed.
                //   So passing a turn doesn't necessarily mean that a player is actually ending their turn.
                <IonButton
                  disabled={!turnActive}
                  onClick={
                    () =>
                      updateCurrentPlayer(duelId, duel?.duelData.currentPlayer === PLAYERS.A ? PLAYERS.B : PLAYERS.A, sendJsonMessage)
                  }
                >
                  End Turn
                </IonButton>
              </IonCol>
            </IonRow> */}
          </IonGrid>
        }
      </IonContent>

      <IonFooter>
        <IonFab horizontal="end" vertical="bottom">
          <IonFabButton>
            <IonIcon icon={add}></IonIcon>
          </IonFabButton>
          <IonFabList side="top">
            <IonFabButton onClick={() => {
              setDiceResult(Math.round(Math.random() * 5) + 1);
              setIsDiceToastOpen(true);
            }}>
              <IonIcon icon={diceOutline}></IonIcon>
            </IonFabButton>
            <IonFabButton onClick={() => {
              copyDuelId();
              setIsCopyToastOpen(true);
            }}>
              <IonIcon icon={clipboardOutline}></IonIcon>
            </IonFabButton>
            <IonFabButton onClick={() => window.location.reload()}>
              <IonIcon icon={refresh}></IonIcon>
            </IonFabButton>
            <IonFabButton onClick={() => exitDuel()}>
              <IonIcon icon={exitOutline}></IonIcon>
            </IonFabButton>
          </IonFabList>
        </IonFab>
      </IonFooter>

      <IonToast
        isOpen={isDiceToastOpen}
        onDidDismiss={() => setIsDiceToastOpen(false)}
        position='top'
        message={`The number rolled is ${diceResult}!`}
        duration={10000}
        buttons={[
          {
            text: 'Dismiss',
            role: 'cancel'
          },
        ]}
      />
      <IonToast
        isOpen={isCopyToastOpen}
        onDidDismiss={() => setIsCopyToastOpen(false)}
        position='top'
        message="The Duel ID has been copied to your clipboard to share!"
        icon={checkmarkCircle}
        duration={5000}
      />
    </IonPage>
  );
}

export default DuelMat;
