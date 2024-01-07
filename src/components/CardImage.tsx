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
    style
}) => {
    const { takePhoto } = useCardPhotos();

    const handleCardClick = () => {
        // TODO: Once an image is present for the slot, then it must be moved before another card photo can be added.
        if (cardOwner && shortCardKey && createdDuel !== undefined && duel && duel.duelId) {
            takePhoto(shortCardKey, createdDuel, duel.duelId);
        }
    };

    let cardImage = placeholderImage;

    if (duel && cardsKey && fullCardKey && duel.duelData[cardsKey][fullCardKey]) {
        cardImage = duel.duelData[cardsKey][fullCardKey];
    } else if (duel && shortCardKey && (shortCardKey === 'extraMonsterOne' || shortCardKey === 'extraMonsterTwo') && duel.duelData[shortCardKey].length > 0) {
        cardImage = duel.duelData[shortCardKey];
    }

    return <IonImg style={style} src={cardImage} alt={altText} onClick={handleCardClick} />;
}
export default CardImage;
