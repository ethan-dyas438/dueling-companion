import { MouseEventHandler, useContext, useState } from 'react';
import {
  IonButton,
  IonCol,
  IonGrid,
  IonInput,
  IonPage,
  IonRow,
  NavContext,
  useIonViewWillEnter
} from '@ionic/react';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import './Home.css';
import axios from 'axios';
import { duelsURL } from '../constants/urls';

const Home: React.FC = () => {
  const { navigate } = useContext(NavContext);

  const [duelCode, setDuelCode] = useState<string>('');
  const [newRandomDuelCode, setNewRandomDuelCode] = useState<string>(uuidv4());
  const [failedDuelJoin, setFailedDuelJoin] = useState<boolean>(false);

  const validateDuelCode = (): boolean => {
    if (duelCode && validateUuid(duelCode)) {
      return false
    }
    return true
  }

  const validateDuelAndJoin: MouseEventHandler<HTMLIonButtonElement> = async () => {
    try {
      const duelResponse = await axios.get(duelsURL + `/${duelCode}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_REST_API_KEY
        }
      })
      
      if (duelResponse.data === 'Found Duel') {
        setDuelCode('');
        setFailedDuelJoin(false);
        navigate(`/duel/${duelCode}`);
      }
    } catch {
      setFailedDuelJoin(true);
    }
  }

  useIonViewWillEnter(() => {
    setNewRandomDuelCode(uuidv4());
  });

  return (
    <IonPage id="home-page">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonButton routerLink={`/duel/${newRandomDuelCode}?create=true`}>Start Duel!</IonButton>
          </IonCol>
        </IonRow>
        <IonRow className="duel-code-input">
          <IonCol>
            <IonInput
              label="Duel Code"
              label-placement="floating"
              fill="outline"
              placeholder="Enter duel code"
              type='text'
              value={duelCode}
              onIonInput={changeEvent => changeEvent?.target?.value ? setDuelCode(changeEvent.target.value.toString()) : setDuelCode('')}
            />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton disabled={validateDuelCode()} onClick={(_) => validateDuelAndJoin(_)}>Join Duel!</IonButton>
            {failedDuelJoin &&
              <p style={{ color: 'red', textAlign: 'center' }}>Unable to find duel with provided Duel ID</p>
            }
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonPage>
  );
};

export default Home;
