import * as THREE from "three"
import { Cannon} from "./Cannon.js";
import { Ball } from "./Ball.js";
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const DEG2RAD = Math.PI / 180;
const cube = new THREE.BoxGeometry(1, 1, 1);

export class Map
{
    #game;
    width = 10;
    tiles = [];
    wall = [];
    loader;
    ship = [];
    fMapOffset = 5.5;
    textureLoader;
    texture;
    waterColor = 0xFFFFFF;
    color;
    cannon;
    ball;
    bActive = true;
    ship = [];
    otherMap;
    name;
    cannonShot;
    init = false;

    constructor(_game, _color, _waterColor, _name, _cannonShot)
    {
        this.loader = new FBXLoader();
        this.waterColor = _waterColor;
        this.color = _color;
        this.#game = _game;
        this.name = _name;
        this.cannonShot = _cannonShot;
        this.textureLoader = new THREE.TextureLoader();
        this.LoadSafe();
    }

    LoadSafe()
    {
        this.textureLoader.load(`https://${document.location.host}/app/assets/img/halftone.jpg`,
            texture => {
                this.texture = texture;
                this.texture.wrapS = THREE.RepeatWrapping;
                this.texture.wrapT = THREE.RepeatWrapping;
                this.texture.repeat.set(0.5, 0.5);
                this.GenerateMap();
                this.init = true;
            },
            undefined, 
            function(err) {
                console.error("Error loading texture", err);
            }
        );
    }

    Update()
    {
        if (!this.bActive)
            return;

        if (!this.init)
            return;

        this.cannon.Update();
        this.ball.Update();
    }

    GenerateMap()
    {
        this.cannon = new Cannon(this.#game.scene, this.fMapOffset, this.name, this.#game.cameraManager, this, this.cannonShot);
        this.#GenerateAlly();
        this.#GenerateShip(this.color);
        this.#GenerateEnemy();
        this.ball = new Ball(this.#game.scene, this.#game.cameraManager, true, this.cannon);
    }

    ShootHere(_x, _y)
    {
        let tile = null;

        for (let i = 0; i < this.otherMap.tiles.length; i++)
        {
            const tmp = this.otherMap.tiles[i];

            if (tmp.userData.x == _x && tmp.userData.y == _y)
                tile = this.otherMap.tiles[i];
        }

        if (!tile)
            return;

        const start = tile.position.clone().add(new THREE.Vector3(0, 20, 0));
        this.ball.Shoot(start, tile.position, tile, tile.userData.used);
    }

    SetActive(_status)
    {
        this.bActive = _status;
        this.cannon.bActive = _status;

        if (this.cannon.mesh)
            this.cannon.mesh.visible = _status;

        if (this.cannon.base)
            this.cannon.base.visible = _status;

        for (let i = 0; i < this.ship.length; i++)
        {
            if (this.ship[i])
                this.ship[i].visible = _status;            
        }

        for (let i = 0; i < this.tiles.length; i++)
        {
            if (this.tiles[i])
                this.tiles[i].visible = _status;            
        }

        for (let i = 0; i < this.wall.length; i++)
        {
            if (this.wall[i])
                this.wall[i].visible = _status;            
        }
    }

    #GenerateAlly()
    {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.width; y++)
                this.#GenerateCube(x - this.width / 2 + 0.5, y - this.width / 2 + 0.5 + this.fMapOffset, x, y);
    }

    #GenerateCube(_x, _y, _indexX, _indexY)
    {
        const material = new THREE.MeshLambertMaterial({color: this.waterColor, map: this.texture.clone()});
        const mesh = new THREE.Mesh(cube, material);
        mesh.scale.set(0.9, 0.1, 0.9);
        mesh.position.set(_x, 0, _y);
        mesh.receiveShadow = true;
        mesh.userData.x = _indexX;
        mesh.userData.y = _indexY;
        mesh.userData.ground = true;
        this.tiles.push(mesh);
        this.#game.scene.add(mesh);
    }

    #GenerateShip(_color)
    {
        const offset1 = new THREE.Vector3(0, 0.3, -0.1);
        const offset2 = new THREE.Vector3(0, 0.3, 0.4);
        const offset3 = new THREE.Vector3(0, 0.2, 0.2);
        const basePosition = new THREE.Vector3(-6, 0, 4 + this.fMapOffset);
        const baseRevPosition = new THREE.Vector3(6, 0, 4 + this.fMapOffset);
        const baseRotation = new THREE.Vector3(0, Math.PI * 1, 0);
        const baseScale = new THREE.Vector3(0.00055, 0.00055, 0.00055);
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})01.fbx`, basePosition.clone().add(new THREE.Vector3(0, 0, -7)), baseRotation, baseScale.clone().multiplyScalar(1.1), offset1, 4));
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})02.fbx`, basePosition.clone().add(new THREE.Vector3(0, 0, -3)), baseRotation, baseScale, offset2, 3));
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})03.fbx`, basePosition, baseRotation, baseScale.clone().multiplyScalar(0.9), offset3, 2));
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})01.fbx`, baseRevPosition.clone().add(new THREE.Vector3(0, 0, -7)), baseRotation, baseScale.clone().multiplyScalar(1.1), offset1, 4));
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})02.fbx`, baseRevPosition.clone().add(new THREE.Vector3(0, 0, -3)), baseRotation, baseScale, offset2, 3));
        this.ship.push(this.#GenerateObject(`https://${document.location.host}/app/assets/models/Ship(${_color})03.fbx`, baseRevPosition, baseRotation, baseScale.clone().multiplyScalar(0.9), offset3, 2));
    }

    #GenerateObject(_path, _position, _rotation, _scale, _offset, _size)
    {
        this.loader.load(_path, (object) => {
            object.traverse(function (child) {
                if (child.isMesh)
                {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(`https://${document.location.host}/app/assets/img/MiniPiratesIsland.png`,
                        texture => {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                            child.receiveShadow = true;
                            child.castShadow = true;
                            child.userData.canBeMove = true;
                            child.userData.offset = _offset;
                            child.userData.size = _size;
                            child.userData.tile = null;
                            child.scale.copy(_scale);
                            child.position.copy(_position);
                            child.rotation.set(_rotation.x, _rotation.y, _rotation.z);
                        },
                        undefined, 
                        function(err) {
                            console.error("Error loading texture", err);
                        }
                    );
                }
            });
        
            this.#game.scene.add(object);
            this.ship.push(object);
        });
    }

    #GenerateEnemy()
    {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.width; y++)
                this.#GenerateEnemyCube(x - this.width / 2 + 0.5, y + 1.5, -this.width / 2 - 1.5 + this.fMapOffset, x, y);
    }

    #GenerateEnemyCube(_x, _y, _z, _indexX, _indexY)
    {
        const material = new THREE.MeshLambertMaterial({color: this.waterColor, map: this.texture.clone()});
        const mesh = new THREE.Mesh(cube, material);
        mesh.scale.set(0.9, 0.9, 0.1);
        mesh.position.set(_x, _y, _z);
        mesh.receiveShadow = true;
        mesh.userData.canBeHighlight = true;
        mesh.userData.hit = true;
        mesh.userData.x = _indexX;
        mesh.userData.y = this.width - 1 - _indexY;
        mesh.userData.ground = false;
        this.wall.push(mesh);
        this.#game.scene.add(mesh);
    }
}