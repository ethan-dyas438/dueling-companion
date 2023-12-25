export const getPlayerAttribute = (createdDuel: boolean, attributeKey: string, duelData: {[key: string]: any}) => {
    if (createdDuel) {
        return duelData[attributeKey].A;
    } else {
        return duelData[attributeKey].B;
    }
}