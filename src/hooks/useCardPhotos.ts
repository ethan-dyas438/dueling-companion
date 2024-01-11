import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { updateCardPhoto } from '../utils/updateDuelActions';
// import { Filesystem, Directory } from '@capacitor/filesystem';
// import { Preferences } from '@capacitor/preferences';
// import { Capacitor } from '@capacitor/core';

export function useCardPhotos() {
    const takePhoto = async (cardSlot: string, createdDuel: boolean, duelId: string) => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Base64,
            quality: 100,
            allowEditing: true,
            
        });

        if (photo.base64String) { // TODO: Display an alert for player to choose initial position of the card
            await updateCardPhoto(createdDuel, cardSlot, photo, duelId);
        }
    };

    return {
        takePhoto,
    };
}
