import * as THREE from "three"
import { Ball } from "./Ball.js"
import { Player } from "./Player.js"

const DEG2RAD = Math.PI / 180;

const cube = new THREE.BoxGeometry(1, 1, 1);

export class Map
{
    iPlayers;
    #game;
    width;
    height;
    iPaddleWidth = 0.1;
    paddles = [];
    walls = [];
    ball;
    textureLoader;
    ground;
    texture;
    fCap = 2.0;
    firstColor;
    secondoColor;
    init = false;
    start = false;

    constructor(_game)
    {
        this.#game = _game;
        this.SetTheme();
        this.iPlayers = this.#game.iPlayers;
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
                this.GenerateMap();
                this.init = true;
                this.start = true;
                setInterval(() => this.MovePlayerIA(), 25); // 1000
            }, 
            undefined, 
            function(err) {
                console.error("Error loading texture", err);
            }
        );
    }

    SetTheme()
    {
        if (this.#game.theme == "theme2")
        {
            this.firstColor = 0xeccc68;
            this.secondoColor = 0xff7f50;
        }
        else if (this.#game.theme == "theme3")
        {
            this.firstColor = 0x3742fa;
            this.secondoColor = 0x2ed573;
        }
        else if (this.#game.theme == "theme4")
        {
            this.firstColor = 0xffa502;
            this.secondoColor = 0x70a1ff;
        }
        else 
        {
            this.firstColor = 0xffffff;
            this.secondoColor = 0x2f3542;
        }
    }

    GenerateMap()
    {
        this.#GenerateDot();
        this.#GenerateSimpleGround();
    }

    MovePlayerIA()
    {
        for (let i = 0; i < this.paddles.length; i++)
        {
            if (this.paddles[i].bIA)
                this.paddles[i].UpdateIA(this.ball);
        }
    }

    TogglePlayerIA(_index)
    {
        if (_index + 1 > this.iPlayers || _index + 1 > this.paddles.length)
            return;

        this.paddles[_index].bIA = !this.paddles[_index].bIA;

        if (this.paddles[_index].bIA)
            this.paddles[_index].UpdateIA(this.ball);
    }

    MovePlayer(_index, _direction)
    {
        if (_index + 1 > this.iPlayers || _index + 1 > this.paddles.length)
            return;

        this.paddles[_index].Move(_direction);
    }

    Update(_scene)
    {
        if (!this.init)
            return;

        this.ball.Update(_scene);

        for (let i = 0; i < this.paddles.length; i++)
        {
            if (!this.paddles[i]?.bCanPlay)
            {
                this.paddles[i]?.Die(_scene);
                this.paddles.splice(i, 1);

                if (this.paddles.length <= 1)
                {
                    this.ball.SetNoRespawn();
                    this.start = false;
                }
            }
        }
    }

    #GenerateDot()
    {
        const material = new THREE.MeshLambertMaterial({color: this.firstColor});
        material.emissive.set(this.firstColor);
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.11);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0);
        mesh.receiveShadow = true;
        this.#game.scene.add(mesh);
    }

    // #region Simple
    #GenerateSimpleGround()
    {
        this.width = 10;
        this.height = 5;
        const texture = this.texture.clone();
        texture.repeat.set(1, 1);
        const material = new THREE.MeshLambertMaterial({color: this.secondoColor, map: texture});
        const mesh = new THREE.Mesh(cube, material);
        mesh.scale.set(this.width, 0.1, this.height);
        mesh.position.set(0, 0, 0);
        mesh.receiveShadow = true;
        this.ground = mesh;
        this.#game.scene.add(mesh);
        this.#GenerateSimplePlayerArea();
    }

    #GenerateSimplePlayerArea()
    {
        this.walls.push(this.#CreateSimpleWall(0, this.height / 2 + this.iPaddleWidth / 2, this.width - this.iPaddleWidth));
        this.walls.push(this.#CreateSimpleWall(0, -this.height / 2 - this.iPaddleWidth / 2, this.width - this.iPaddleWidth));
        this.paddles.push(this.#CreateSimplePaddle(-this.width / 2, 0, 0));  
        this.paddles.push(this.#CreateSimplePaddle(this.width / 2, 0, 1));
        this.ball = new Ball(this.#game, this.#game.scene, this.firstColor);
    }

    #CreateSimpleWall(_x, _y, _width)
    {
        const material = new THREE.MeshLambertMaterial({color: this.firstColor});
        material.emissive.set(this.firstColor);
        // const capsule = new THREE.CapsuleGeometry(this.iPaddleWidth, _width, 8, 8);
        const capsule = new THREE.BoxGeometry(this.iPaddleWidth, _width, this.iPaddleWidth);
        const mesh = new THREE.Mesh(capsule, material);
        mesh.rotation.set(90 * DEG2RAD, 0, 90 * DEG2RAD);
        mesh.position.set(_x, this.iPaddleWidth * 2, _y);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isPlayer = false;
        this.#game.scene.add(mesh);
        this.#CreateSimpleKillZone(_x * 1.5, _y * 1.5, _width * 2);
        return mesh;
    }

    #CreateSimpleKillZone(_x, _y, _width)
    {
        const material = new THREE.MeshLambertMaterial({color: 0xff0000, transparent: true});
        material.emissive.set(0xff0000);
        material.opacity = 0;
        const capsule = new THREE.CapsuleGeometry(this.iPaddleWidth, _width, 8, 8);
        const mesh = new THREE.Mesh(capsule, material);
        mesh.rotation.set(90 * DEG2RAD, 0, 90 * DEG2RAD);
        mesh.position.set(_x, this.iPaddleWidth * 2, _y);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isKillZone = true;
        this.#game.scene.add(mesh);
    }

    #CreateSimplePaddle(_x, _y, _index)
    {
        const position = new THREE.Vector3(_x, this.iPaddleWidth * 2, _y);
        let offset = 1;

        if (_index == 1)
            offset = -1;

        const rotation = new THREE.Vector3(90 * DEG2RAD * offset, 0, 0);

        if (_index == 0)
            return new Player(this.#game.scene, this.#game.playerLeft, position, rotation, this.fCap, this.firstColor, this.#game.iPoints, 90);
        else
            return new Player(this.#game.scene, this.#game.playerRight, position, rotation, this.fCap, this.firstColor, this.#game.iPoints, -90);
    }
    // #endregion
}