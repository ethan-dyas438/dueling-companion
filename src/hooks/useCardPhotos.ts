import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
// import { Filesystem, Directory } from '@capacitor/filesystem';
// import { Preferences } from '@capacitor/preferences';
// import { Capacitor } from '@capacitor/core';

export function useCardPhotos() {
    // TODO: Reduce image quality and maybe disable image uploads
    const takePhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Base64,
                quality: 100,
                allowEditing: true,
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
