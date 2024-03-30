import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// import { Filesystem, Directory } from '@capacitor/filesystem';
// import { Preferences } from '@capacitor/preferences';
// import { Capacitor } from '@capacitor/core';

export function useCardPhotos() {
    const takePhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera,
                quality: 60,
                height: 2000,
                width: 1240,
                allowEditing: false,
            });
    
            if (photo.base64String) {
                return photo;
            }
        } catch (e) {
            console.log('Image capture cancelled.')
        }
    };

    return {
        takePhoto,
    };
}
