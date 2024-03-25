import { IonAlert, IonImg, IonLoading } from '@ionic/react';
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
    const [uploadingCard, setUploadingCard] = useState<boolean>(false);

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
        if (fullCardKey.includes('Banished')) {
            if (duel.duelData[cardsKey][fullCardKey].length > 0) {
                cardImage = "resources\\banished.png";
            }
        } else if (fullCardKey.includes('Graveyard')) {
            if (duel.duelData[cardsKey][fullCardKey].length > 0) {
                cardImage = "resources\\graveyard.png";
            }
        } else if (!duel.duelData[cardsKey][fullCardKey].flipped) {
            cardImage = "resources\\yugiohCard.png";
        } else {
            cardImage = duel.duelData[cardsKey][fullCardKey].cardImage;
        }
    } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey]) {
        if (!duel.duelData[shortCardKey].flipped) {
            cardImage = "resources\\yugiohCard.png";
        } else {
            cardImage = duel.duelData[shortCardKey].cardImage;
        }
    }

    const handleUploadCard = async () => {
        if (shortCardKey && duel && tempCardPhoto && tempCardPosition && tempCardFlipped !== undefined) {
            const cardData = {
                chosenPosition: tempCardPosition,
                cardFlipped: tempCardFlipped
            }

            setUploadingCard(true);
            await updateCardPhoto(!!createdDuel, shortCardKey, tempCardPhoto, duel.duelId, cardData);
            setUploadingCard(false);
            setTempCardPhoto(undefined);
            setTempCardPosition(undefined);
            setTempCardFlipped(undefined);
        }
    }

    const handleCardClick = async () => {
        if (duel && duel.duelId) {
            if (cardOwner && cardImage === placeholderImage && !placeholderImage.includes('Banished') && !placeholderImage.includes('Graveyard')) {
                const newCard = await takePhoto();
                setTempCardPhoto(newCard);
            } else if (handleCardActionsOpen && cardsKey && fullCardKey) {
                handleCardActionsOpen(duel.duelData[cardsKey][fullCardKey], fullCardKey, !!cardOwner);
            } else if (
                handleCardActionsOpen &&
                shortCardKey &&
                (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo')
            ) {
                handleCardActionsOpen(duel.duelData[shortCardKey], shortCardKey, (createdDuel && duel.duelData[shortCardKey].player === 'a') || (!createdDuel && duel.duelData[shortCardKey].player === 'b'));
            }
        }
    };

    const getRotation = () => {
        if (duel && cardsKey && fullCardKey && duel.duelData[cardsKey][fullCardKey]) {
            if (duel.duelData[cardsKey][fullCardKey].position === CARD_POSITIONS.DEFENSE) {
                return '90deg'
            }
        } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey]) {
            if (duel.duelData[shortCardKey].position === CARD_POSITIONS.DEFENSE) {
                return '90deg'
            }
        }
        return '0deg'
    }

    const getOpacity = () => {
        if (duel && cardsKey && fullCardKey && duel.duelData[cardsKey][fullCardKey]) {
            return '1.0'
        } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey]) {
            return '1.0'
        }
        return '0.6'
    }

    return (
        <>
            <IonLoading isOpen={uploadingCard} message="Uploading Card..." />
            <IonImg style={ { ...style, padding: "0 15px", rotate: getRotation(), opacity: getOpacity() }} src={cardImage} alt={altText} onClick={handleCardClick} />

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
