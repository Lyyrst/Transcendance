import * as THREE from "three"
import { Text } from "./Text.js"

export class Player
{
    iScore;
    name;
    mesh;
    fPaddleWidth = 0.1;
    fPaddleHeight = 1;
    fCap;
    basePosition;
    textName;
    textScore;

    constructor(_scene, _iScore, _name, _position, _rotation, _fCap)
    {
        this.iScore = _iScore;
        this.name = _name;
        this.fCap = _fCap;
        this.#CreatePhysics(_scene, _position, _rotation);
    }

    #CreatePhysics(_scene, _position, _rotation)
    {
        const material = new THREE.MeshLambertMaterial({color: 0xffffff});
        material.emissive.set(0xffffff);
        const capsule = new THREE.CapsuleGeometry(this.fPaddleWidth, this.fPaddleHeight, 4, 8);
        this.mesh = new THREE.Mesh(capsule, material);
        this.mesh.rotation.set(_rotation.x, _rotation.y, _rotation.z);
        this.mesh.position.set(_position.x, _position.y, _position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        _scene.add(this.mesh);
        this.basePosition = _position;
        // this.textName = new Text(_scene, this.name, this.basePosition, _rotation, 0.3, 0.1);
    }

    #DisplayName(_toggle)
    {
        this.textName.SetVisibility(_toggle);
    }

    Move(_direction)
    {
        if (_direction == 0)
            return;

        const direction = new THREE.Vector3(0, 1, 0).applyEuler(this.mesh.rotation).multiplyScalar(_direction);
        const newPosition = this.mesh.position.clone().add(direction);

        if (Math.abs(this.basePosition.distanceTo(newPosition)) > this.fCap)
            return;

        this.mesh.position.copy(newPosition);
    }
}