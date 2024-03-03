export const getPlayerAttribute = (createdDuel: boolean, attributeKey: string, duelData: {[key: string]: any}) => {
    if (createdDuel) {
        return duelData[attributeKey].A;
    } else {
        return duelData[attributeKey].B;
    }
}

export const getPlayerCardImage = (createdDuel: boolean, isCardOwner: boolean, duelData: {[key: string]: any}, cardKey: string) => {
    if (cardKey === 'extraMonsterOne' || cardKey === 'extraMonsterTwo') {
        return duelData[cardKey]?.cardImage;
    }
    
    if (createdDuel) {
        if (isCardOwner) {
            return duelData.playerACards[cardKey]?.cardImage;
        } else {
            return duelData.playerBCards[cardKey]?.cardImage;
        }
    } else {
        if (isCardOwner) {
            return duelData.playerBCards[cardKey]?.cardImage;
        } else {
            return duelData.playerACards[cardKey]?.cardImage;
        }
    }
}

export const getPlayerBanishedCards = (createdDuel: boolean, isCardOwner: boolean, duelData: {[key: string]: any}) => {
    
    if (createdDuel) {
        if (isCardOwner) {
            return duelData.playerACards.playerABanished;
        } else {
            return duelData.playerBCards.playerBBanished;
        }
    } else {
        if (isCardOwner) {
            return duelData.playerBCards.playerBBanished;
        } else {
            return duelData.playerACards.playerABanished;
        }
    }
}