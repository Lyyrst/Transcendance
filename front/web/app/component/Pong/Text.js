import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const DEG2RAD = Math.PI / 180;

export class Text
{
    loader;
    scene;
    mesh;
    color;

    constructor(_scene, _text, _position, _rotation, _size, _depth, _color)
    {
        this.scene = _scene;
        this.color = _color;
        this.loader = new FontLoader();
        this.loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.CreateText(font, _text, _position, _rotation, _size, _depth);
        });
    }

    CreateText(_font, _text, _position, _rotation, _size, _depth)
    {
        const textGeometry = new TextGeometry(_text, {
            font: _font,
            size: _size,
            depth: _depth,
            curveSegments: 12,
        });
        textGeometry.computeBoundingBox();
        const boundingBox = textGeometry.boundingBox;
        const textWidth = boundingBox.max.x - boundingBox.min.x;
        const textHeight = boundingBox.max.y - boundingBox.min.y;
        const textDepth = boundingBox.max.z - boundingBox.min.z;
        const offsetX = textWidth / 2;
        const offsetY = textHeight / 2;
        const offsetZ = textDepth / 2;
        textGeometry.translate(-offsetX, -offsetY, -offsetZ);
        const textMaterial = new THREE.MeshLambertMaterial({ color: this.color });
        textMaterial.emissive.set(this.color);
        textMaterial.emissiveIntensity = 1;
        this.mesh = new THREE.Mesh(textGeometry, textMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(_position);
        this.mesh.rotation.set(_rotation.x, _rotation.y, _rotation.z);
        this.scene.add(this.mesh);
    }

    SetVisibility(_toggle)
    {
        this.mesh.visible = _toggle;
    }
}