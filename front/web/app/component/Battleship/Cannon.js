import * as THREE from "three";
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Ball } from "./Ball.js";

export class Cannon
{
    mesh;
    base;
    ball;
    scene;
    camera;
    loader;
    raycaster;
    intersectedObject;
    objectInHand;
    mouse = new THREE.Vector2(0, 0);
    map;
    placed = 0;
    turn = true;
    bActive = true;
    bNeedSwitch = false;
    shot = 0;
    maxShot = 2;
    score = 0;
    name = "Cannon";
    textureLoader;

    constructor(_scene, _offset, _name, _camera, _map, _shot)
    {
        this.scene = _scene;
        this.camera = _camera;
        this.loader = new FBXLoader();
        this.raycaster = new THREE.Raycaster();
        this.map = _map;
        this.name = _name;
        this.maxShot = _shot;
        this.textureLoader = new THREE.TextureLoader();
        this.#GeneratePhysics(_scene, _offset);
        window.addEventListener("mousemove", (event) => this.onMouseMove(event));
        window.addEventListener("click", (event) => this.onMouseClick(event));
        window.addEventListener("keydown", (event) => this.onKeyDown(event));
        this.#GenerateScore();
    }

    OnDestroy()
    {
        window.removeEventListener("mousemove", (event) => this.onMouseMove(event));
        window.removeEventListener("click", (event) => this.onMouseClick(event));
        window.removeEventListener("keydown", (event) => this.onKeyDown(event));
    }

    AddScore()
    {
        this.score++;
        this.#UpdateScore();
    }

    onKeyDown(event)
    {
        if (!this.bActive || this.bNeedSwitch)
            return;

        if (event.key != 'E' && event.key != 'e')
            return;

        if (event.repeat)
            return;

        if (!this.objectInHand)
            return;

        this.objectInHand.rotation.y += Math.PI / 2;

        if (this.objectInHand.rotation.y == Math.PI * 2)
            this.objectInHand.rotation.y = 0;

        this.#ModifiyOffset();
    }

    #ModifiyOffset()
    {
        const x = this.objectInHand.userData.offset.x;
        const z = this.objectInHand.userData.offset.z;
        let offset = new THREE.Vector3(0, this.objectInHand.userData.offset.y, 0);

        if (x == 0 && z != 0)
            offset.x = z;
        else
            offset.z = -x;

        this.objectInHand.position.add(this.objectInHand.userData.offset.clone().multiplyScalar(-1));
        this.objectInHand.userData.offset = offset;
        this.objectInHand.position.add(this.objectInHand.userData.offset);
    }

    onMouseMove(event)
    {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onMouseClick(event)
    {
        if (!this.bActive || this.bNeedSwitch)
            return;

        if (this.objectInHand && this.#CanPlace())
        {
            this.#PlaceHere();
            this.objectInHand.userData.canBeMove = false;
            this.objectInHand = null;
            this.placed++;

            if (this.placed == 6)
                this.bNeedSwitch = true;
        }
        else if (this.intersectedObject?.userData.canBeMove && !this.objectInHand)
            this.objectInHand = this.intersectedObject;
        else
            this.#ShootBall();
    }

    Update()
    {
        this.#UpdateRotation();
        this.#UpdateHighlight();
        this.#UpdateHand();
        this.ball.Update();
    }

    #SetTileState(_x, _y)
    {
        for (let i = 0; i < this.map.tiles.length; i++)
        {
            const tile = this.map.tiles[i];

            if (tile.userData.x == _x && tile.userData.y == _y)
            {
                tile.userData.used = true;
                tile.userData.ship = this.objectInHand;
            }
        }
    }

    #PlaceHere()
    {
        const tile = this.objectInHand.userData.tile;
        const x = tile.userData.x;
        const y = tile.userData.y;
        let size = this.objectInHand.userData.size - 1;
        const front = size >= 3;

        if (size >= 3)
            size = 2;

        const angle = this.objectInHand.rotation.y % (Math.PI * 2);

        switch (angle)
        {
            case 0:
                for (let i = 0; i <= size; i++)
                    this.#SetTileState(x, y - i);
                if (front)
                    this.#SetTileState(x, y + 1);
                break;
            case Math.PI * 0.5:
                for (let i = 0; i <= size; i++)
                    this.#SetTileState(x - i, y);
                if (front)
                    this.#SetTileState(x + 1, y);
                break;
            case Math.PI:
                for (let i = 0; i <= size; i++)
                    this.#SetTileState(x, y + i);
                if (front)
                    this.#SetTileState(x, y - 1);
                break;
            case Math.PI * 1.5:
                for (let i = 0; i <= size; i++)
                    this.#SetTileState(x + i, y);
                if (front)
                    this.#SetTileState(x - 1, y);
                break;
        }
    }

    #CanPlace()
    {
        const tile = this.objectInHand.userData.tile;

        if (!tile)
            return false;

        if (!tile.userData.ground)
            return false;

        const x = tile.userData.x;
        const y = tile.userData.y;
        let size = this.objectInHand.userData.size - 1;
        const front = size >= 3;

        if (size >= 3)
            size = 2;

        const angle = this.objectInHand.rotation.y % (Math.PI * 2);

        switch (angle)
        {
            case 0:
                if (y - size < 0) // check top
                    return false;
                if (front && y + 1 >= this.map.width)
                    return false;
                for (let i = 0; i <= size; i++)
                    if (this.#GetTileStatus(x, y - i))
                        return false;
                if (front && this.#GetTileStatus(x, y + 1))
                    return false;
                break;
            case Math.PI * 0.5:
                if (x - size < 0) // check left
                    return false;
                if (front && x + 1 >= this.map.width)
                    return false;
                for (let i = 0; i <= size; i++)
                    if (this.#GetTileStatus(x - i, y))
                        return false;
                if (front && this.#GetTileStatus(x + 1, y))
                    return false;
                break;
            case Math.PI:
                if (y + size >= this.map.width) // check bottom
                    return false;
                if (front && y - 1 < 0 && this.#GetTileStatus())
                    return false;
                for (let i = 0; i <= size; i++)
                    if (this.#GetTileStatus(x, y + i))
                        return false;
                if (front && this.#GetTileStatus(x, y - 1))
                    return false;
                break;
            case Math.PI * 1.5:
                if (x + size >= this.map.width) // check right
                    return false;
                if (front && x - 1 < 0)
                    return false;
                for (let i = 0; i <= size; i++)
                    if (this.#GetTileStatus(x + i, y))
                        return false;
                if (front && this.#GetTileStatus(x - 1, y))
                    return false;
                break;
        }

        return true;
    }

    #UpdateHand()
    {
        if (!this.objectInHand || !this.intersectedObject)
            return;

        if (this.objectInHand == this.intersectedObject)
            return;

        if (!this.intersectedObject.userData.ground)
            return;

        const position = this.intersectedObject.position.clone();
        position.add(this.objectInHand.userData.offset);
        this.objectInHand.position.copy(position);
        this.objectInHand.userData.tile = this.intersectedObject;
    }

    #ShootBall()
    {
        if (this.placed != 6 || !this.turn)
            return;

        if (this.objectInHand || !this.intersectedObject)
            return;

        if (!this.intersectedObject.userData.hit)
            return;

        const shooted = this.ball.Shoot(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), this.intersectedObject.position, this.intersectedObject, this.#GetOtherTileStatus(this.intersectedObject.userData.x, this.intersectedObject.userData.y));
        
        if (!shooted)
            return;
        
        this.map.ShootHere(this.intersectedObject.userData.x, this.intersectedObject.userData.y);
        this.intersectedObject.userData.hit = false;
        this.intersectedObject.userData.canBeHighlight = false;
        this.shot++;

        if (this.shot == this.maxShot)
        {
            this.bNeedSwitch = true;
            this.shot = 0;
        }
    }

    #GetTileStatus(_x, _y)
    {
        for (let i = 0; i < this.map.tiles.length; i++)
        {
            const tile = this.map.tiles[i];

            if (tile.userData.x == _x && tile.userData.y == _y)
                return tile.userData.used;
        }

        return false;
    }

    #GetOtherTileStatus(_x, _y)
    {
        for (let i = 0; i < this.map.otherMap.tiles.length; i++)
        {
            const tile = this.map.otherMap.tiles[i];

            if (tile.userData.x == _x && tile.userData.y == _y)
                return tile.userData.used;
        }

        return false;
    }

    #UpdateRotation()
    {
        if (!this.mesh)
            return;

        const y = -this.mouse.x * Math.PI + Math.PI;
        this.mesh.rotation.y = Math.min(Math.PI * 1.3, Math.max(y, Math.PI * 0.7));
    }

    #NotOtherMap(_object)
    {
        for (let i = 0; i < this.map.otherMap.wall.length; i++)
        {
            if (this.map.otherMap.wall[i] == _object)
                return false;
        }
    
        return true;
    }

    #NotOtherShip(_object)
    {
        for (let i = 0; i < this.map.otherMap.ship.length; i++)
        {
            if (this.map.otherMap.ship[i] == _object)
                return false;
        }
    
        return true;
    }

    #UpdateHighlight()
    {
        this.raycaster.setFromCamera(this.mouse, this.camera.camera);
        const objectsToCheck = this.scene.children.filter(obj => {
            return obj !== this.objectInHand && !this.ball.particles.includes(obj) && this.#NotOtherMap(obj) && this.#NotOtherShip(obj);
        });
        const intersects = this.raycaster.intersectObjects(objectsToCheck, true);
    
        if (intersects.length > 0)
        {
            if (this.intersectedObject !== intersects[0].object)
            {
                if (this.intersectedObject)
                    this.intersectedObject.material.emissive.setHex(this.intersectedObject.currentHex);
    
                this.intersectedObject = intersects[0].object;

                if (!this.intersectedObject.userData.canBeHighlight && !this.intersectedObject.userData.canBeMove)
                    return;

                if (this.objectInHand)
                    return;

                this.intersectedObject.currentHex = this.intersectedObject.material.emissive.getHex();
                this.intersectedObject.material.emissive.setHex(0xffffff);
            }
        } 
        else
        {
            if (this.intersectedObject)
            {
                this.intersectedObject.material.emissive.setHex(this.intersectedObject.currentHex);
                this.intersectedObject = null;
            }
        }
    }

    #GeneratePhysics(_scene, _offset)
    {
        this.loader.load(`https://${document.location.host}/app/assets/models/Cannon.fbx`, (object) => {
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
                        }, 
                        undefined, 
                        function(err) {
                            console.error("Error loading texture", err);
                        }
                    );
                }
            });

            object.scale.set(0.003, 0.003, 0.003);
            object.position.set(0, 0, 6 + _offset);
            object.rotation.set(0, Math.PI, 0);
            _scene.add(object);
            this.mesh = object;
        });
        this.#GenerateBase(_scene, _offset);
        this.ball = new Ball(_scene, this.camera, false);
    }

    #GenerateBase(_scene, _offset)
    {
        this.textureLoader.load(`https://${document.location.host}/app/assets/img/halftone.jpg`, 
            texture => {
                texture.repeat.set(0.5, 0.5);
                const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1);
                const material = new THREE.MeshLambertMaterial({color: 0x9f8b84, map: texture});
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(0, -0.5, 6 + _offset);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                _scene.add(mesh);
                this.base = mesh;
            }, 
            undefined, 
            function(err) {
                console.error("Error loading texture", err);
            }
        );
    }

    #GenerateScore()
    {
        const list = document.getElementById("score-list");
        const elem = document.createElement("ul");
        const content = `${this.name} - ${this.score}`;
        elem.append(content);
        elem.setAttribute("data-id", this.name);
        elem.setAttribute("data-score", this.score);
        list.appendChild(elem);
    }

    #UpdateScore()
    {
        const list = document.getElementById("score-list");
        const elems = list.getElementsByTagName("ul");

        for (let i = 0; i < elems.length; i++)
        {
            const elem = elems[i];
            const id = elem.getAttribute("data-id");

            if (id != this.name)
                continue;

            if (this.score <= 0)
                elem.id = "invisible";

            elem.setAttribute("data-score", this.score);
            elem.textContent = `${this.name} - ${this.score}`;
            break;
        }

        this.#SortScore();
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

    // Button Rotation
    RotateButton()
    {
        if (!this.objectInHand)
            return;

        this.objectInHand.rotation.y += Math.PI / 2;

        if (this.objectInHand.rotation.y == Math.PI * 2)
            this.objectInHand.rotation.y = 0;

        this.#ModifiyOffset();
    }
}