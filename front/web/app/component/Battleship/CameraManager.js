import * as THREE from "three"

const DEG2RAD = Math.PI / 180;

export class CameraManager
{
    camera;
    cameraOrigin;
    iCameraDistance = 30;
    iCameraAzimuth = 0;
    iCameraElevation = 40;
    fShakeStart;
    fShakeIntensity = 0;
    fShakeDuration = 0;
    bShake = false;

    constructor(_cameraOrigin, _gameWindow)
    {
        this.cameraOrigin = _cameraOrigin;
        this.camera = new THREE.PerspectiveCamera(45, _gameWindow.offsetWidth / _gameWindow.offsetHeight, 0.1, 1000);
        this.Update();
    }

    Update()
    {
        this.camera.position.x = this.iCameraDistance * Math.sin(this.iCameraAzimuth * DEG2RAD) * Math.cos(this.iCameraElevation * DEG2RAD);
        this.camera.position.y = this.iCameraDistance * Math.sin(this.iCameraElevation * DEG2RAD);
        this.camera.position.z = this.iCameraDistance * Math.cos(this.iCameraAzimuth * DEG2RAD) * Math.cos(this.iCameraElevation * DEG2RAD);
        this.camera.position.add(this.cameraOrigin);
        this.#UpdateShake();
        this.camera.lookAt(this.cameraOrigin);
        this.camera.updateMatrix();
    }

    #UpdateShake()
    {
        if (!this.bShake)
            return;

        const elapsedTime = (new Date().getTime() - this.fShakeStart) / 1000;
        const progress = Math.min(elapsedTime / this.fShakeDuration, 1);
        const shakeOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
        );
        this.camera.position.add(shakeOffset);
        
        if (progress >= 1)
            this.bShake = false;

    }

    Shake(_intensity, _duration)
    {
        this.bShake = true;
        this.fShakeIntensity = _intensity;
        this.fShakeDuration = _duration;
        this.fShakeStart = new Date().getTime();
        this.Update();
    }
}