import * as THREE from "three"

export class Ball
{
    game;
    mesh;
    velocity;
    fInitialSpeed;
    fMaxSpeed;
    fSpeedStep = 15;
    fSpeed;
    fSpeedIncrement;
    fRadius = 0.2;
    fRespawnTime = 2000;
    leftRaycaster;
    middleRaycaster;
    rightRaycaster;
    numSegments;
    trailSpheres;
    currentIndex;
    explosionParticles = [];
    bCanRespawn = true;
    fRaycastDistance = this.fRadius * 1.2;
    color;

    constructor(_game, _scene, _color)
    {
        this.game = _game;
        this.color = _color;
        this.fInitialSpeed = this.game.fBallSpeed;
        this.fSpeed = this.fInitialSpeed;
        this.fMaxSpeed = this.fInitialSpeed * 2.5;
        this.fSpeedIncrement = (this.fMaxSpeed - this.fInitialSpeed) / this.fSpeedStep;
        this.velocity = new THREE.Vector3(Math.random() * 2 - 1, 0,  Math.random() * 2 - 1);
        this.#FixDirection();
        const geometry = new THREE.SphereGeometry(this.fRadius); 
        const material = new THREE.MeshLambertMaterial({color: this.color, transparent: true});
        material.emissive.set(this.color);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, this.fRadius, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        _scene.add(this.mesh);
        this.leftRaycaster = new THREE.Raycaster();
        this.middleRaycaster = new THREE.Raycaster();
        this.rightRaycaster = new THREE.Raycaster();
        this.#InitTrail(_scene, 50);
    }

    Update(_scene)
    {
        this.#UpdateExplosion(_scene);

        if (this.mesh.visible == false)
            this.#ResetTrail(this.mesh.position.clone());
        else
            this.#RaycastRebound(_scene);
    }

    SetNoRespawn()
    {
        this.mesh.visible = false;
        this.bCanRespawn = false;
    }

    #FixDirection()
    {
        const limit = 0.25;

        this.velocity.normalize();

        if (this.velocity.x > -limit && this.velocity.x <= 0)
            this.velocity.x = -limit;
        else if (this.velocity.x >= 0 && this.velocity.x < limit)
            this.velocity.x = limit;

        this.#UpdateSpeed();
    }

    #Respawn(_scene)
    {
        this.mesh.visible = false;
        this.#InitExplosion(_scene, this.mesh.position.clone());

        setTimeout(() => this.#RespawnBehavior(), this.fRespawnTime);
    }

    #RespawnBehavior()
    {
        if (!this.bCanRespawn)
            return;

        this.mesh.position.set(0, this.fRadius, 0);
        this.fSpeed = this.fInitialSpeed;
        this.velocity = new THREE.Vector3(Math.random() * 2 - 1, 0,  Math.random() * 2 - 1);
        this.#FixDirection();
        this.mesh.visible = true;
    }

    #RaycastRebound(_scene)
    {
        const previousPosition = this.mesh.position.clone();
        const left = new THREE.Vector3().crossVectors(this.velocity.clone().normalize(), new THREE.Vector3(0, 1, 0)).normalize();
        const previousPositionLeft = previousPosition.clone().add(left.clone().multiplyScalar(this.fRadius));
        const previousPositionRight = previousPosition.clone().add(left.clone().multiplyScalar(-this.fRadius));
        const objectsToExclude = [
            this.mesh,
            ...this.trailSpheres
        ];
        const objectsToCheck = _scene.children.filter(child => !objectsToExclude.includes(child));

        if (!this.#Raycast(this.middleRaycaster, _scene, previousPosition, objectsToCheck))
            if (!this.#Raycast(this.rightRaycaster, _scene, previousPositionRight, objectsToCheck))
                this.#Raycast(this.leftRaycaster, _scene, previousPositionLeft, objectsToCheck);

        this.#UpdateTrail(this.mesh.position.clone());
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.z += this.velocity.z;
    }

    #Raycast(_raycaster, _scene, _position, _objectsToCheck)
    {
        _raycaster.ray.origin.copy(_position);
        _raycaster.ray.direction.copy(this.velocity.clone().normalize());
        
        const intersects = _raycaster.intersectObjects(_objectsToCheck, false);

        if (intersects.length <= 0)
            return false;

        const intersection = intersects[0];

        if (intersection.distance > this.fRaycastDistance)
            return false;

        if (intersection.object.userData.isKillZone)
        {
            intersection.object.userData.playerData?.TakeDamage();
            this.game.cameraManager.Shake(0.2 * this.fSpeed, 50);
            this.#Respawn(_scene);
            return true;
        }

        if (intersection.object.userData.isPlayer)
            this.game.cameraManager.Shake(0.1 * this.fSpeed, 20);

        this.#ManualCollision(intersection.object);
        // this.#CalculatedCollision(intersection);
        return true;
    }

    #ManualCollision(_object)
    {
        if (_object.userData.isPlayer)
            this.velocity.x = -this.velocity.x;
        else
            this.velocity.z = -this.velocity.z;

        this.#FixDirection();
        this.fSpeed = Math.min(this.fSpeed + this.fSpeedIncrement, this.fMaxSpeed);
    }

    #CalculatedCollision(_intersection)
    {
        const collisionNormal = _intersection.face.normal.clone().applyMatrix4(_intersection.object.matrixWorld).normalize();
        this.velocity.reflect(collisionNormal);
        this.velocity.y = 0;
        this.#FixDirection();
        this.fSpeed = Math.min(this.fSpeed + this.fSpeedIncrement, this.fMaxSpeed);
    }

    #UpdateSpeed()
    {
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        const scalingFactor = this.fSpeed / currentSpeed;
        this.velocity.x *= scalingFactor;
        this.velocity.z *= scalingFactor;
    }

    #ResetTrail(position)
    {
        const mult = 0.94;
        const cap = 0.3;
        const trailSphere = this.trailSpheres[this.currentIndex];
        trailSphere.position.copy(position);
        this.currentIndex = (this.currentIndex + 1) % this.numSegments;

        for (let i = 0; i < this.numSegments; i++)
        {
            const sphere = this.trailSpheres[i];

            if (sphere.visible)
            {
                sphere.scale.multiplyScalar(mult);
                sphere.material.opacity *= mult;

                if (sphere.material.opacity < cap)
                    sphere.visible = false;
            }
        }
    }

    #InitTrail(_scene, _numSegments)
    {
        this.numSegments = _numSegments;
        this.trailSpheres = [];
        this.currentIndex = 0;

        for (let i = 0; i < _numSegments; i++)
        {
            const geometry = new THREE.SphereGeometry(this.fRadius, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color: this.color, transparent: true, opacity: 1 });
            material.emissive.set(this.color);
            const sphere = new THREE.Mesh(geometry, material);
            sphere.visible = false;
            this.trailSpheres.push(sphere);
            _scene.add(sphere);
        }
    }

    #UpdateTrail(position)
    {
        const mult = 0.94;
        const cap = 0.3;
        const trailSphere = this.trailSpheres[this.currentIndex];
        trailSphere.position.copy(position);
        trailSphere.scale.set(1, 1, 1);
        trailSphere.material.opacity = 1;
        trailSphere.visible = true;
        this.currentIndex = (this.currentIndex + 1) % this.numSegments;

        for (let i = 0; i < this.numSegments; i++)
        {
            const sphere = this.trailSpheres[i];

            if (sphere.visible)
            {
                sphere.scale.multiplyScalar(mult);
                sphere.material.opacity *= mult;

                if (sphere.material.opacity < cap)
                    sphere.visible = false;
            }
        }
    }

    #InitExplosion(_scene, _position)
    {
        const numParticles = 100;

        for (let i = 0; i < numParticles; i++)
        {
            const geometry = new THREE.SphereGeometry(this.fRadius * 0.1, 8, 8);
            const material = new THREE.MeshLambertMaterial({ color: this.color});
            material.emissive.set(this.color);
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(_position);
            _scene.add(particle);
            this.explosionParticles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2 
                ).normalize().multiplyScalar(Math.random() * 0.05)
            });
        }
    }

    #UpdateExplosion(_scene)
    {
        this.explosionParticles.forEach(particle => {
            particle.mesh.position.add(particle.velocity);
            particle.velocity.multiplyScalar(0.95);
            particle.mesh.material.opacity -= 0.02;
            particle.mesh.material.transparent = true;

            if (particle.mesh.material.opacity <= 0) {
                _scene.remove(particle.mesh);
            }
        });
    }
}