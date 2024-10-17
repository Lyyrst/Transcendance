import * as THREE from "three"

const DEG2RAD = Math.PI / 180;

export class CameraManager
{
    camera;
    cameraOrigin;
    iCameraDistance = 10;
    iCameraAzimuth = 0;
    iCameraElevation = 60;
    fShakeIntensity = 0;
    fShakeDuration = 0;
    fShakeTimer = 0;

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
        if (this.fShakeTimer <= 0)
            return;

        const shakeOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
            (Math.random() - 0.5) * 2 * this.fShakeIntensity,
        );
        this.camera.position.add(shakeOffset);
        this.fShakeTimer -= 1;
    }

    Shake(_intensity, _duration)
    {
        _duration++;
        this.fShakeIntensity = _intensity;
        this.fShakeDuration = _duration;
        this.fShakeTimer = _duration;
        this.Update();
    }
}