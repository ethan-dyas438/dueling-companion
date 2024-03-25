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
import { getPlayerAttribute, getPlayerBanishedCards, getPlayerCardImage, getPlayerGraveyardCards } from '../utils/getPlayerDuelData';
import { updateReadyStatus } from '../utils/updateDuelActions';
import { Clipboard } from '@capacitor/clipboard';
import LifePointAlert from '../components/LifePointAlert';
import CardImage from '../components/CardImage';
import CardActions from '../components/CardActions';
import { CARD_ACTIONS } from '../constants/cardActions';
import { CARD_POSITIONS } from '../constants/cardPositions';
import CardViewer from '../components/CardViewer';
import BanishedCardsViewer from '../components/BanishedCardsViewer';
import GraveyardCardsViewer from '../components/GraveyardCardsViewer';

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
  // const [turnActive, setTurnActive] = useState<boolean>(false);
  const [diceResult, setDiceResult] = useState<number>(0);
  const [isLPAlertOpen, setIsLPAlertOpen] = useState<boolean>(false);
  const [isCardViewerOpen, setIsCardViewerOpen] = useState<boolean>(false);
  const [isCardOwner, setIsCardOwner] = useState<boolean>(false);
  const [isCardActionsOpen, setIsCardActionsOpen] = useState<boolean>(false);
  const [currentCardActions, setCurrentCardActions] = useState<CARD_ACTIONS[]>([]);
  const [isBanishedViewerOpen, setIsBanishedViewerOpen] = useState<boolean>(false);
  const [isGraveyardViewerOpen, setIsGraveyardViewerOpen] = useState<boolean>(false);
  const [currentCardKey, setCurrentCardKey] = useState<string>("");
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
        sendJsonMessage({
          action: DUEL_ACTION.UPDATE,
          payload: { duelId, duelData: { currentPlayer: PLAYERS.A } }
        });
      }

      // if (createdDuel) {
      //   if (duel.duelData.currentPlayer === PLAYERS.A) {
      //     setTurnActive(true);
      //   } else if (duel.duelData.currentPlayer === PLAYERS.B) {
      //     setTurnActive(false);
      //   }
      // } else {
      //   if (duel.duelData.currentPlayer === PLAYERS.A) {
      //     setTurnActive(false);
      //   } else if (duel.duelData.currentPlayer === PLAYERS.B) {
      //     setTurnActive(true);
      //   }
      // }
    }
  }, [duel]);

  const copyDuelId = async () => {
    if (duelId) {
      await Clipboard.write({
        string: duelId
      });
    }
  };

  const handleCardActionsOpen = (cardData: { [key: string]: any }, cardKey: string, ownsCard: boolean) => {
    const validActions = [];

    if (ownsCard) {
      if (!cardData.flipped) {
        validActions.push(CARD_ACTIONS.ACTIVATE_CARD);
      } else {
        validActions.push(CARD_ACTIONS.TRANSFER_TO_OPPONENT);
        validActions.push(CARD_ACTIONS.BANISH);
        validActions.push(CARD_ACTIONS.SEND_TO_GRAVEYARD);
  
        if (cardData.position === CARD_POSITIONS.ATTACK) {
          validActions.push(CARD_ACTIONS.DEFENSE_POSITION);
        } else if (cardData.position === CARD_POSITIONS.DEFENSE) {
          validActions.push(CARD_ACTIONS.ATTACK_POSITION);
        }
      }
      validActions.push(CARD_ACTIONS.VIEW_CARD);
    } else if (!ownsCard && cardData.flipped) {
      validActions.push(CARD_ACTIONS.VIEW_CARD);
    }

    setCurrentCardActions(validActions);
    setCurrentCardKey(cardKey);
    setIsCardOwner(ownsCard);
    setIsCardActionsOpen(true);
  };

  const handleBanishedCardViewerOpen = (_: any, cardKey: string, ownsCard: boolean) => {
    setCurrentCardKey(cardKey);
    setIsCardOwner(ownsCard);
    setIsBanishedViewerOpen(true);
  };

  const handleGraveyardCardViewerOpen = (_: any, cardKey: string, ownsCard: boolean) => {
    setCurrentCardKey(cardKey);
    setIsCardOwner(ownsCard);
    setIsGraveyardViewerOpen(true);
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
              shortCardKey="SpellTrapFive"
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
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}SpellTrapOne`}
              duel={duel}
              shortCardKey="SpellTrapOne"
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage placeholderImage="resources\yugiohCard.png" altText="Extra Deck Slot" /></IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderGraveyard.png"
              altText="Graveyard Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}Graveyard`}
              duel={duel}
              createdDuel={createdDuel}
              handleCardActionsOpen={handleGraveyardCardViewerOpen} />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderMonster.png"
              altText="Monster Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}MonsterFive`}
              duel={duel}
              shortCardKey="MonsterFive"
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
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderFieldZone.png"
              altText="Field Spell Slot"
              cardsKey={cardsKey}
              fullCardKey={`${oponentPlayer}FieldSpell`}
              duel={duel}
              shortCardKey="FieldSpell"
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
        </IonRow>
      </>
    );
  }

  const renderYourCards = () => {
    const currentPlayer = createdDuel ? 'playerA' : 'playerB';
    const cardsKey = `${currentPlayer}Cards`;

    return (
      <>
        <IonRow>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderFieldZone.png"
              altText="Field Spell Slot"
              cardsKey={cardsKey}
              fullCardKey={`${currentPlayer}FieldSpell`}
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
              fullCardKey={`${currentPlayer}MonsterOne`}
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
              fullCardKey={`${currentPlayer}MonsterTwo`}
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
              fullCardKey={`${currentPlayer}MonsterThree`}
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
              fullCardKey={`${currentPlayer}MonsterFour`}
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
              fullCardKey={`${currentPlayer}MonsterFive`}
              duel={duel}
              shortCardKey="MonsterFive"
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleCardActionsOpen}
            />
          </IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderGraveyard.png"
              altText="Graveyard Slot"
              cardsKey={cardsKey}
              fullCardKey={`${currentPlayer}Graveyard`}
              duel={duel}
              createdDuel={createdDuel}
              cardOwner
              handleCardActionsOpen={handleGraveyardCardViewerOpen}
            />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol><CardImage placeholderImage="resources\yugiohCard.png" altText="Extra Deck Slot" /></IonCol>
          <IonCol>
            <CardImage
              placeholderImage="resources\placeholderSpellTrap.png"
              altText="Spell/Trap Card Slot"
              cardsKey={cardsKey}
              fullCardKey={`${currentPlayer}SpellTrapOne`}
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
              fullCardKey={`${currentPlayer}SpellTrapTwo`}
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
              fullCardKey={`${currentPlayer}SpellTrapThree`}
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
              fullCardKey={`${currentPlayer}SpellTrapFour`}
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
              fullCardKey={`${currentPlayer}SpellTrapFive`}
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

  // TODO: Look into issue, where if a image upload is cancelled then a different slot is selected the image still goes to the originally
  //       selected slot. This also applies to other card actions sometimes.
  // TODO: Stop card actions from calling websocket twice

  return (
    <IonPage id="duel-mat-page" style={{ overflowY: "scroll" }}>
      <IonLoading isOpen={loadingDuel} message="Loading Duel..." />
      <LifePointAlert isOpen={isLPAlertOpen} setIsOpen={setIsLPAlertOpen} duel={duel} createdDuel={createdDuel} websocketAction={sendJsonMessage} />
      {duel?.duelData && <CardViewer isOpen={isCardViewerOpen} setIsOpen={setIsCardViewerOpen} cardImage={getPlayerCardImage(createdDuel, isCardOwner, duel.duelData, currentCardKey)} />}
      {
        duel?.duelData && getPlayerBanishedCards(createdDuel, isCardOwner, duel.duelData) && getPlayerBanishedCards(createdDuel, isCardOwner, duel.duelData).length > 0 &&
        <BanishedCardsViewer
          isOpen={isBanishedViewerOpen}
          setIsOpen={setIsBanishedViewerOpen}
          duel={duel}
          createdDuel={createdDuel}
          cardOwner={isCardOwner}
          banishedCards={getPlayerBanishedCards(createdDuel, isCardOwner, duel.duelData)}
          sendJsonMessage={sendJsonMessage}
        />
      }
      {
        duel?.duelData && getPlayerGraveyardCards(createdDuel, isCardOwner, duel.duelData) && getPlayerGraveyardCards(createdDuel, isCardOwner, duel.duelData).length > 0 &&
          <GraveyardCardsViewer
            isOpen={isGraveyardViewerOpen}
            setIsOpen={setIsGraveyardViewerOpen}
            duel={duel}
            createdDuel={createdDuel}
            cardOwner={isCardOwner}
            graveyardCards={getPlayerGraveyardCards(createdDuel, isCardOwner, duel.duelData)}
            sendJsonMessage={sendJsonMessage}
          />
      }
      <CardActions
        isOpen={isCardActionsOpen}
        setIsOpen={setIsCardActionsOpen}
        cardActions={currentCardActions}
        cardKey={currentCardKey || ""}
        duel={duel}
        createdDuel={createdDuel}
        websocketAction={sendJsonMessage}
        setCardViewerIsOpen={setIsCardViewerOpen}
      />

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
                <CardImage
                  style={{ height: "90%" }}
                  placeholderImage="resources\placeholderBanished.png"
                  altText="Opponent Banished Slot"
                  cardsKey={`${createdDuel ? 'playerB' : 'playerA'}Cards`}
                  fullCardKey={`${createdDuel ? 'playerB' : 'playerA'}Banished`}
                  duel={duel}
                  handleCardActionsOpen={handleBanishedCardViewerOpen}
                />
              </IonCol>
              <IonCol style={{ height: "15rem" }}>
                <CardImage
                  style={{ height: "90%" }}
                  placeholderImage="resources\placeholderExtraMonster.png"
                  altText="Extra Monster Card Slot"
                  shortCardKey={`extraMonster${createdDuel ? 'One' : 'Two'}`}
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
                  shortCardKey={`extraMonster${createdDuel ? 'Two' : 'One'}`}
                  duel={duel}
                  createdDuel={createdDuel}
                  cardOwner
                  handleCardActionsOpen={handleCardActionsOpen}
                />
              </IonCol>
              <IonCol style={{ height: "15rem" }}>
                <CardImage
                  style={{ height: "90%" }}
                  placeholderImage="resources\placeholderBanished.png"
                  altText="Your Banished Slot"
                  cardsKey={`${createdDuel ? 'playerA' : 'playerB'}Cards`}
                  fullCardKey={`${createdDuel ? 'playerA' : 'playerB'}Banished`}
                  duel={duel}
                  cardOwner
                  handleCardActionsOpen={handleBanishedCardViewerOpen}
                />
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
