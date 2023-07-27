import { useState } from 'react';
import {
  IonButton,
  IonCol,
  IonGrid,
  IonInput,
  IonItemDivider,
  IonPage,
  IonRow,
  useIonViewWillEnter
} from '@ionic/react';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import './Home.css';

const Home: React.FC = () => {

  const [duelCode, setDuelCode] = useState<string>('');
  const [newRandomDuelCode, setNewRandomDuelCode] = useState<string>(uuidv4());

  const validateDuelCode = (): boolean => {
    if (duelCode && validateUuid(duelCode)) {
      return false
    }
    return true
  }

  useIonViewWillEnter(() => {
    setNewRandomDuelCode(uuidv4());
  });

  return (
    <IonPage id="home-page">
      <IonGrid>
        <IonRow>
          <IonCol>
            {/* Once on the duel page display a loading indicator for creating the duel session as the backend processes the reques to create and initialize a new duel, then display page when finished */}
            <IonButton routerLink={`/message/${newRandomDuelCode}`}>Start Duel</IonButton>
            <IonItemDivider />
          </IonCol>
        </IonRow>
        <IonRow className="duel-code-input" >
          <IonCol>
            <IonInput label="Duel Code" label-placement="floating" fill="outline" placeholder="Enter duel code" type='text' onIonInput={changeEvent => changeEvent?.target?.value ? setDuelCode(changeEvent.target.value.toString()) : setDuelCode('')} />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton routerLink={`/message/${duelCode}`} disabled={validateDuelCode()}>Join Duel</IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonPage>
  );
};

export default Home;
