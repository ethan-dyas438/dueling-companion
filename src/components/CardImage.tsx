import { IonImg } from '@ionic/react';
import { useCardPhotos } from '../hooks/useCardPhotos';

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
    let cardImage = placeholderImage;

    if (duel && cardsKey && fullCardKey && duel.duelData[cardsKey][fullCardKey]) {
        cardImage = duel.duelData[cardsKey][fullCardKey];
    } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey].length > 0) {
        cardImage = duel.duelData[shortCardKey];
    }

    const handleCardClick = () => {
        if (cardOwner && shortCardKey && createdDuel !== undefined && duel && duel.duelId) {
            if (cardImage === placeholderImage) {
                takePhoto(shortCardKey, createdDuel, duel.duelId);
            } else if (handleCardActionsOpen) {
                handleCardActionsOpen(cardImage);
            }
        }
    };

    return <IonImg style={style} src={cardImage} alt={altText} onClick={handleCardClick} />;
}
export default CardImage;
