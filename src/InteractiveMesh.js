import * as THREE from "three";

class InteractiveMesh extends THREE.Object3D() {

    constructor(app, TexturePath, ModelPath, StdMat = false) {

        super();

        const NewTexture = app.loaders.texture.load(TexturePath);

        if (StdMat === true) {
            this.NewMaterial = new THREE.MeshStandardMaterial({
                map: NewTexture,
            });
        } else {
            this.NewMaterial = new THREE.MeshBasicMaterial({
                map: NewTexture,
            });
        }

        if (this.NewMaterial != undefined) {
            this.NewMaterial.map.flipY = false;
            this.NewMaterial.map.encoding = THREE.sRGBEncoding;
        }

        app.loaders.gltf.load(ModelPath,
            function(model) {
                model.scene.children[0].material = this.NewMaterial;
                this.add(model.scene.children[0]);
            }
        );

    }

}