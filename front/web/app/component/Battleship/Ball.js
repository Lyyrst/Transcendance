import * as THREE from "three"

export class Ball
{
    mesh;
    source;
    destination;
    final;
    bMove;
    start;
    scene;
    camera;
    duration = 0.5;
    explosionDuration = 0.5;
    explosionStart;
    particles = [];
    emptyTileColor = 0xFF0000;
    usedTileColor = 0x00FF00;
    emptyTileColorExplosion = 0xFF0000;
    usedTileColorExplosion = 0x00FF00;
    bMap = false;
    cannon;

    constructor(_scene, _camera, _map, _cannon)
    {
        this.scene = _scene;
        this.camera = _camera;
        this.#CreatePhysics();
        this.bMap = _map;
        this.cannon = _cannon;
    }

    #CreatePhysics()
    {
        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshLambertMaterial({color: 0x111111});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0);
        this.mesh.visible = false;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    Shoot(_source, _dest, _finalObject, _finalStatus)
    {
        if (this.bMove)
            return false;

        this.source = _source;
        this.mesh.position.copy(_source);
        this.destination = _dest;
        this.final = _finalObject;
        this.finalStatus = _finalStatus;
        this.bMove = true;
        this.mesh.visible = !this.bMap;
        this.start = new Date().getTime();
        return true;
    }

    Update()
    {
        this.#UpdateMovement();
        this.#UpdateExplosion();
    }

    #UpdateMovement()
    {
        if (!this.bMove)
            return;

        const elapsedTime = (new Date().getTime() - this.start) / 1000;
        const progress = Math.min(elapsedTime / this.duration, 1);
        this.mesh.position.lerpVectors(this.source, this.destination, progress);

        if (progress >= 1)
        {
            this.mesh.visible = false;
            this.bMove = false;
            this.final.material.emissive.setHex(this.final.currentHex);
            this.final.material.color.set(this.finalStatus ? this.usedTileColor : this.emptyTileColor);
            const explosionPosition = this.destination.clone();

            if (this.finalStatus && this.final.userData.ground && this.final.userData.size >= 1)
                explosionPosition.add(new THREE.Vector3(0, 1, 0));

            if (!this.bMap)
            {
                this.#CreateExplosion(explosionPosition, this.finalStatus ? this.usedTileColorExplosion : this.emptyTileColorExplosion);
                this.camera.Shake(0.1, this.explosionDuration);
            }

            if (!this.final.userData.ship)
                return;

            this.final.userData.ship.userData.size--;

            if (this.final.userData.ship.userData.size <= 0)
            {
                this.cannon.AddScore();
                this.final.userData.ship.visible = false;
            }
        }
    }

    #UpdateExplosion()
    {
        if (this.particles.length <= 0)
            return;

        const elapsedTime = (new Date().getTime() - this.explosionStart) / 1000;
        const progress = Math.min(elapsedTime / this.explosionDuration, 1);
    
        if (progress >= 1) 
        {
            this.particles.forEach((particle) => {
                this.scene.remove(particle);
            });
            return;
        }

        this.particles.forEach((particle) => {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.05));
            particle.userData.velocity.y -= 0.01;
            particle.material.opacity = 1 - progress;
            particle.scale.multiplyScalar(0.98);
        });
    }

    #CreateExplosion(_position, _color)
    {
        const particleCount = 50;
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: _color, emissive: _color, transparent: true });
        const positionOffset = 0.1;
        const speedOffset = new THREE.Vector3(0.5, 2, 0.5);

        for (let i = 0; i < particleCount; i++)
        {
            const particle = new THREE.Mesh(geometry, material);

            particle.position.set(
                _position.x + (Math.random() - 0.5) * positionOffset,
                _position.y + (Math.random() - 0.5) * positionOffset,
                _position.z + (Math.random() - 0.5) * positionOffset
            );

            if (this.final.userData.ground)
            {
                particle.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * speedOffset.x,
                    (Math.random()) * speedOffset.y,
                    (Math.random() - 0.5) * speedOffset.z
                );
            }
            else
            {
                particle.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * speedOffset.x,
                    (Math.random() - 0.5) * speedOffset.z,
                    (Math.random()) * speedOffset.y
                );
            }

            this.particles.push(particle);
            this.scene.add(particle);
        }

        this.explosionStart = new Date().getTime();
    }
}