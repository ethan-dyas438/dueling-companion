import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { updateCardPhoto } from '../utils/updateDuelActions';
// import { Filesystem, Directory } from '@capacitor/filesystem';
// import { Preferences } from '@capacitor/preferences';
// import { Capacitor } from '@capacitor/core';

export function useCardPhotos() {
    const takePhoto = async (cardSlot: string, createdDuel: boolean, duelId: string, websocketAction: SendJsonMessage) => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.DataUrl,
            quality: 100,
            allowEditing: true,
        });

        if (photo.dataUrl) {
            await updateCardPhoto(createdDuel, cardSlot, photo, duelId);
        }
    };

    return {
        takePhoto,
    };
}
