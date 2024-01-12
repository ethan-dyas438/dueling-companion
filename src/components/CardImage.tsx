import { IonAlert, IonImg } from '@ionic/react';
import { useCardPhotos } from '../hooks/useCardPhotos';
import { updateCardPhoto } from '../utils/updateDuelActions';
import { useEffect, useState } from 'react';
import { Photo } from '@capacitor/camera';
import { CARD_POSITIONS } from '../constants/cardPositions';

interface CardImageProps {
    altText: string;
    shortCardKey?: string;
    fullCardKey?: string;
    duel?: { [key: string]: any };
    createdDuel?: boolean;
    placeholderImage: string;
    cardOwner?: boolean;
    cardsKey?: string;
    style?: { [key: string]: any };
    handleCardActionsOpen?: Function;
}

const CardImage: React.FC<CardImageProps> = ({
    altText,
    shortCardKey,
    fullCardKey,
    duel,
    createdDuel,
    placeholderImage,
    cardOwner,
    cardsKey,
    style,
    handleCardActionsOpen,
}) => {
    const { takePhoto } = useCardPhotos();
    const [tempCardPhoto, setTempCardPhoto] = useState<Photo>();
    const [positionAlertOpen, setPositionAlertOpen] = useState<boolean>(false);
    const [flippedAlertOpen, setFlippedAlertOpen] = useState<boolean>(false);
    const [tempCardPosition, setTempCardPosition] = useState<CARD_POSITIONS>();
    const [tempCardFlipped, setTempCardFlipped] = useState<boolean>();

    useEffect(() => {
        if (tempCardPhoto) {
            setPositionAlertOpen(true);
        }
    }, [tempCardPhoto]);

    useEffect(() => {
        if (tempCardPosition && tempCardFlipped !== undefined) {
            handleUploadCard();
        }
    }, [tempCardPosition, tempCardFlipped]);

    let cardImage = placeholderImage;

    if (duel && cardsKey && fullCardKey && duel.duelData[cardsKey][fullCardKey]) {
        cardImage = duel.duelData[cardsKey][fullCardKey];
    } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey].length > 0) {
        cardImage = duel.duelData[shortCardKey];
    }

    const handleUploadCard = async () => {
        if (shortCardKey && duel && tempCardPhoto && tempCardPosition && tempCardFlipped !== undefined) {
            const cardData = {
                chosenPosition: tempCardPosition,
                cardFlipped: tempCardFlipped
            }
            console.log(cardData);
            await updateCardPhoto(!!createdDuel, shortCardKey, tempCardPhoto, duel.duelId, cardData);
            setTempCardPhoto(undefined);
            setTempCardPosition(undefined);
            setTempCardFlipped(undefined);
        } // TODO: Test the new upload and update image assignment to get the image fromt he card data (set cardData then grab image)
    }

    const handleCardClick = async () => {
        if (cardOwner && shortCardKey && createdDuel !== undefined && duel && duel.duelId) {
            if (cardImage === placeholderImage) {
                const newCard = await takePhoto();
                setTempCardPhoto(newCard);
            } else if (handleCardActionsOpen) {
                handleCardActionsOpen(cardImage);
            }
        }
    };

    return (
        <>
            <IonImg style={style} src={cardImage} alt={altText} onClick={handleCardClick} />

            <IonAlert
                isOpen={positionAlertOpen}
                header="Choose New Card Position"
                message="Will you choose to set this card in attack or defense position?"
                inputs={[
                    {
                      label: 'Attack',
                      type: 'radio',
                      value: CARD_POSITIONS.ATTACK,
                      checked: true
                    },
                    {
                      label: 'Defense',
                      type: 'radio',
                      value: CARD_POSITIONS.DEFENSE,
                    }
                ]}
                buttons={['Submit']}
                onDidDismiss={({ detail }) => {
                    setTempCardPosition(detail.data.values);

                    setPositionAlertOpen(false);
                    setFlippedAlertOpen(true);
                }}
            />
            <IonAlert
                isOpen={flippedAlertOpen}
                header="Choose New Card Set Status"
                message="Will you choose to set this card face up or face down?"
                inputs={[
                    {
                      label: 'Face Up',
                      type: 'radio',
                      value: true,
                      checked: true
                    },
                    {
                      label: 'Face Down',
                      type: 'radio',
                      value: false,
                    }
                ]}
                buttons={['Submit']}
                onDidDismiss={({ detail }) => {
                    setTempCardFlipped(detail.data.values);

                    setFlippedAlertOpen(false);
                }}
            />
        </>
    );
}
export default CardImage;
