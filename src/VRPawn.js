import * as THREE from "three";
import { XRControllerModelFactory } from "./XRControllerModelFactory.js"
import { fetchProfile, MotionController } from "@webxr-input-profiles/motion-controllers"

class VRPawn {

    constructor(app) {

        this.app = app;
        this.XRSession = app.renderer.xr.getSession();

        this.PawnRoot = new THREE.Object3D();
        this.PawnRoot.name = "Pawn Root Camera Rig";
        this.PawnRoot.add(app.ViewportCamera);
        
        this.Controllers = [];
        this.RIndex = 0;
        this.LIndex = 1;
        this.SetupVRControllers();
        
        this.MovementSpeed = 0;
        
        this.XRSession.addEventListener("inputsourceschange", OnInputSourcesChange.bind(this));
        function OnInputSourcesChange(event) {
            for (let index = 0; index < this.XRSession.inputSources.length; index++) {
                if (index === 0 && this.XRSession.inputSources[index].handedness === "left") {
                    this.RIndex = 1;
                    this.LIndex = 0;
                }
            }
            this.RightController = this.Controllers[this.RIndex];
            this.LeftController = this.Controllers[this.LIndex];
        }

    }

    SetupVRControllers() {
        
        this.ControllerModelFactory = new XRControllerModelFactory(this.app.loaders.gltf);
    
        const LineGeo = new THREE.BufferGeometry().setFromPoints(
            [ new THREE.Vector3( 0,0,0 ), new THREE.Vector3( 0,0,-1 ) ]
        );
    
        const LineMat = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            linewidth: 2
        });
    
        const line = new THREE.Line(LineGeo, LineMat);
        line.scale.z = 10;

        this.Controllers.push(this.BuildController(0, line), this.BuildController(1, line));

        // this.RightController = Controllers[this.RIndex];
        // this.LeftController = Controllers[this.LIndex];

        const MoveTargetGeo =  new THREE.TorusBufferGeometry(0.5, 0.1, 3, 32);
        MoveTargetGeo.rotateX(-Math.PI * 0.5);
        MoveTargetGeo.translate(0, 0.1, 0);
        MoveTargetGeo.scale(1, 0.25, 1);

        this.MoveTarget = new THREE.Mesh(
            MoveTargetGeo,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(0, 128, 255)")
            })
        );
        this.MoveTarget.name = "Teleport movement target";
        this.MoveTarget.visible = false;
        this.PawnRoot.add(this.MoveTarget);

    }

    BuildController(index, line){
        
        const controller = this.app.renderer.xr.getController(index);
        
        controller.userData.selectPressed = false;
        controller.userData.index = index;
        
        if (line) controller.add(line.clone());
        
        this.PawnRoot.add(controller);
        
        let grip;
        
        if ( this.ControllerModelFactory ){
            grip = this.app.renderer.xr.getControllerGrip(index);
            grip.add(this.ControllerModelFactory.createControllerModel(grip));
            this.PawnRoot.add(grip);
        }

        const TracingMatrix = new THREE.Matrix4();
        const raycaster = new THREE.Raycaster();
        raycaster.layers.set(3);

        return {controller, grip, TracingMatrix, raycaster};
    
    }

    TraceFromController(MotionController) {

        MotionController.TracingMatrix.identity().extractRotation(MotionController.controller.matrixWorld);
    
        MotionController.raycaster.ray.origin.setFromMatrixPosition(MotionController.controller.matrixWorld);
        MotionController.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4(MotionController.TracingMatrix);
    
    }

}

export { VRPawn }