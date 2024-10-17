import * as THREE from "three"
import { Text } from "./Text.js"

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

export class Player
{
    iMaxHP = 4;
    iHP = this.iMaxHP;
    name;
    mesh;
    fPaddleWidth = 0.1;
    fPaddleHeight = 1.2;
    fCap;
    basePosition;
    textName;
    killLine;
    killZone;
    fSpeed = 1.4;
    bCanPlay = true;
    bDied = false;
    bIA = false;
    nextPosition = null;
    ballSpeed = 0.1;
    color;
    rotationOffset;

    constructor(_scene, _name, _position, _rotation, _fCap, _color, _hp, _offset)
    {
        this.rotationOffset = _offset;
        this.name = _name;
        this.color = _color;
        this.fCap = _fCap;
        this.iHP = _hp;
        this.iMaxHP = _hp;

        const change = 0.2;
        this.fCap -= change;
        this.fPaddleHeight += change * 2;

        this.#CreatePhysics(_scene, _position, _rotation);
        this.#UpdateHP();
        this.#GenerateScore();
    }

    #CreatePhysics(_scene, _position, _rotation)
    {
        const material = new THREE.MeshLambertMaterial({color: this.color});
        material.emissive.set(this.color);
        // const capsule = new THREE.CapsuleGeometry(this.fPaddleWidth, this.fPaddleHeight, 4, 8);
        const capsule = new THREE.BoxGeometry(this.fPaddleWidth, this.fPaddleHeight, this.fPaddleWidth);
        this.mesh = new THREE.Mesh(capsule, material);
        this.mesh.rotation.set(_rotation.x, _rotation.y, _rotation.z);
        this.mesh.position.set(_position.x, _position.y, _position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isPlayer = true;
        _scene.add(this.mesh);
        this.basePosition = _position.clone();
        this.#CreateText(_scene, _position, _rotation);
        this.#CreateKillZone(_scene, _position, _rotation);
    }

    #CreateText(_scene, _position, _rotation)
    {
        const textRotation = new THREE.Vector3(0, _rotation.z + this.rotationOffset * DEG2RAD, 0);
        const textPosition = _position.clone().add(new THREE.Vector3(_position.x * 0.1, 1, _position.z * 0.1));
        this.textName = new Text(_scene, this.name, textPosition, textRotation, 0.4, 0.02, this.color);
    }

    #CreateKillZone(_scene, _position, _rotation)
    {
        const scale = 8;
        const material = new THREE.MeshLambertMaterial({color: this.color});
        material.emissive.set(this.color);
        const capsule = new THREE.CapsuleGeometry(this.fPaddleWidth / scale, this.fPaddleHeight + this.fCap * 2, 4, 8);
        const mesh = new THREE.Mesh(capsule, material);
        mesh.rotation.set(_rotation.x, _rotation.y, _rotation.z);
        mesh.position.set(_position.x, _position.y - this.fPaddleWidth, _position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = false;
        _scene.add(mesh);
        this.killLine = mesh;
        this.#InvisibleKillZone(_scene, _position, _rotation);
    }

    #InvisibleKillZone(_scene, _position, _rotation)
    {
        const dist = 1.08;
        _position.x *= dist;
        _position.z *= dist;
        const material = new THREE.MeshLambertMaterial({color: 0xff0000, transparent: true});
        material.emissive.set(0xff0000);
        material.opacity = 0;
        const geometry = new THREE.BoxGeometry(this.fPaddleWidth / 2, this.fPaddleHeight + this.fCap * 4, this.fPaddleWidth / 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(_rotation.x, _rotation.y, _rotation.z);
        mesh.position.set(_position.x, _position.y, _position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isKillZone = true;
        mesh.userData.playerData = this;
        _scene.add(mesh);
        this.killZone = mesh;
    }

    #UpdateHP()
    {
        const color = new THREE.Color(this.color);
        const colorPer = this.iHP / this.iMaxHP;
        const colorCode = new THREE.Color(colorPer * color.r, colorPer * color.g, colorPer * color.b);
        const material = new THREE.MeshLambertMaterial({color: colorCode});
        material.emissive.set(colorCode);
        material.emissiveIntensity = colorPer;
        this.mesh.material = material;

        if (this.textName.mesh)
            this.textName.mesh.material = material;
    }

    Die(_scene)
    {
        if (this.bDied)
            return;

        this.bDied = true;
        _scene.remove(this.mesh);
        _scene.remove(this.killLine);
        _scene.remove(this.killZone);
        _scene.remove(this.textName.mesh);
    }

    TakeDamage()
    {
        this.iHP--;
        this.#UpdateHP();
        this.#UpdateScore();

        if (this.iHP <= 0)
            this.bCanPlay = false;
    }

    Move(_direction)
    {
        if (this.nextPosition)
            this.MoveTo();

        if (_direction == 0 || !this.bCanPlay)
            return;

        const direction = new THREE.Vector3(0, 1, 0).applyEuler(this.mesh.rotation).multiplyScalar(_direction * this.fSpeed);
        const newPosition = this.mesh.position.clone().add(direction);
        const distance = Math.abs(this.basePosition.distanceTo(newPosition));

        if (distance > this.fCap)
        {
            const clampedDistance = this.fCap - this.basePosition.distanceTo(this.mesh.position);
            const clampedDirection = direction.normalize().multiplyScalar(clampedDistance);
            const clampedPosition = this.mesh.position.clone().add(clampedDirection);
            this.mesh.position.copy(clampedPosition);
        }
        else
            this.mesh.position.copy(newPosition);
    }

    MoveTo()
    {
        const cap = 0.1;
        const speed = 1 * this.ballSpeed;

        if (Math.abs(this.mesh.position.distanceTo(this.nextPosition)) <= cap)
        {
            if (Math.abs(this.basePosition.distanceTo(this.nextPosition)) <= this.fCap)
            {
                this.mesh.position.copy(this.nextPosition);
                this.nextPosition = null;
                return;
            }
        }

        const direction = this.nextPosition.clone().sub(this.mesh.position).normalize();
        const newPosition = this.mesh.position.clone().add(direction.multiplyScalar(speed));
        const distance = Math.abs(this.basePosition.distanceTo(newPosition));
        
        if (distance > this.fCap)
        {
            const clampedDistance = this.fCap - this.basePosition.distanceTo(this.mesh.position);
            const clampedDirection = direction.normalize().multiplyScalar(clampedDistance);
            const clampedPosition = this.mesh.position.clone().add(clampedDirection);
            this.mesh.position.copy(clampedPosition);
            this.nextPosition = null;
        }
        else
            this.mesh.position.copy(newPosition);
    }

    UpdateIA(_ball)
    {
        if (!this.bCanPlay)
            return;

        const velocity = _ball.velocity.clone().normalize();
        const position = this.basePosition.clone();
        const ballPos = _ball.mesh.position.clone();
        const point = ballPos.clone().add(velocity.clone());

        if (_ball.mesh.visible == false)
            this.nextPosition = position;
        else
            this.nextPosition = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, ballPos.z + velocity.z * _ball.fSpeed * 0.8);

        this.ballSpeed = _ball.fSpeed;
    }

    #GenerateScore()
    {
        const list = document.getElementById("score-list");
        const elem = document.createElement("ul");
        const content = `${this.name} - ${this.iHP}`;
        elem.append(content);
        elem.setAttribute("data-id", this.name);
        elem.setAttribute("data-score", this.iHP);
        list.appendChild(elem);
    }

    #UpdateScore()
    {
        try {
            const list = document.getElementById("score-list");
            const elems = list.getElementsByTagName("ul");

            for (let i = 0; i < elems.length; i++)
            {
                const elem = elems[i];
                const id = elem.getAttribute("data-id");

                if (id != this.name)
                    continue;

                if (this.iHP <= 0)
                    elem.id = "invisible";

                elem.setAttribute("data-score", this.iHP);
                elem.textContent = `${this.name} - ${this.iHP}`;
                break;
            }

            this.#SortScore();
        } catch (error) {
            return;
        }
    }

    #SortScore()
    {
        const max = 4;
        let list = document.getElementById("score-list");
        let switching = true;

        while (switching)
        {
            switching = false;
            const elems = Array.from(list.getElementsByTagName("ul"));

            for (let i = 0; i < elems.length - 1; i++)
            {
                const currentScore = parseInt(elems[i].getAttribute("data-score"), 10);
                const nextScore = parseInt(elems[i + 1].getAttribute("data-score"), 10);

                if (currentScore < nextScore)
                {
                    list.insertBefore(elems[i + 1], elems[i]);
                    switching = true;
                    break;
                }
            }
        }

        const elems = Array.from(list.getElementsByTagName("ul"));

        if (elems.length <= max)
            return;

        for (let i = 0; i < elems.length; i++)
        {
            const elem = elems[i];

            if (i < max)
                continue;

            elem.id = "invisible";
        }
    }
}