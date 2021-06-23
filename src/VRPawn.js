import * as THREE from "three";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js"
import { fetchProfile, MotionController } from "@webxr-input-profiles/motion-controllers"

class VRPawn {

    constructor(app) {

        this.app = app;
        this.XRSession = app.renderer.xr.getSession();

        this.PawnRoot = new THREE.Object3D();
        this.PawnRoot.name = "Pawn Root Camera Rig";
        this.PawnRoot.add(app.ViewportCamera);

        this.MovementSpeed = 0;
        // this.SetupVRControllers();

        this.XRSession.addEventListener("inputsourceschange", OnInputSourcesChange.bind(this));

        this.MotionControllers = {};
        function OnInputSourcesChange(event) {
            event.added.forEach(this.CreateMotionController.bind(this));
        }
    }

    async CreateMotionController(xrInputSource) {

        const assetURI = "./profiles";

        const {profile, assetPath} = await fetchProfile(xrInputSource, assetURI);
        const motionController = new MotionController(xrInputSource, profile, assetPath);

        let ControllerIndex = 0;
        if (Object.keys(this.MotionControllers).length > 0) {
            ControllerIndex++;
        }
        motionController.xrController = this.app.renderer.xr.getController(ControllerIndex);
        motionController.xrIndex = ControllerIndex;
        
        if (motionController.layoutDescription.rootNodeName.includes("left")) {
            this.MotionControllers.Left = motionController;
            this.MotionControllers.Left.name = "Left Controller";
        } else {
            this.MotionControllers.Right = motionController;
            this.MotionControllers.Right.name = "Right Controller";
        }
        this.AddControllerToScene(motionController);
    
    }

    async AddControllerToScene(controller) {
        
        let pawn = this;

        const asset = await this.app.loaders.gltf.load(controller.assetUrl,
            function(model) {
                model.scene.children.forEach(function(child) {
                    if (child.children.length > 1) {
                        child.name = controller.name;
                        pawn.PawnRoot.add(child);
                    }
                })
            },
            function(xhr) {
                console.log(`Loading ${xhr.srcElement.responseURL}: ${xhr.loaded / xhr.total * 100}%`)
            },
            function(error) {
                console.log(error)
            }
        );

    }

    UpdateControllerModel(controller) {

        let controllerID = "Right Controller";
        if (controller.layoutDescription.rootNodeName.includes("left")) {
            controllerID = "Left Controller";
        }
        const ControllerRoot = this.PawnRoot.getObjectByName(controllerID);
        if (ControllerRoot === undefined || controller === undefined) {
            return;
        }

        Object.values(controller.components).forEach(
            function(component) {
                Object.values(component.visualResponses).forEach(
                    function(visualResponse) {
                        const valueNode = ControllerRoot.getObjectByName(visualResponse.valueNodeName);
                        if (visualResponse.valueNodeProperty === "visibility") {
                            valueNode.visible = visualResponse.value;
                        } else if (visualResponse.valueNodeProperty === "transform") {
                            const minNode = ControllerRoot.getObjectByName(visualResponse.minNodeName);
                            const maxNode = ControllerRoot.getObjectByName(visualResponse.maxNodeName);

                            if (valueNode === undefined) return;

                            valueNode.quaternion.slerpQuaternions(
                                minNode.quaternion,
                                maxNode.quaternion,
                                visualResponse.value
                            );

                            valueNode.position.lerpVectors(
                                minNode.position,
                                maxNode.position,
                                visualResponse.value
                            );
                        } // else if
                    } // foreach visual response callback
                );
            } // foreach component callback
        );
        
    }

    SetupVRControllers() {
        
        this.ControllerModelFactory = new XRControllerModelFactory();
    
        const LineGeo = new THREE.BufferGeometry().setFromPoints(
            [ new THREE.Vector3( 0,0,0 ), new THREE.Vector3( 0,0,-1 ) ]
        );
    
        const LineMat = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            linewidth: 2
        });
    
        const line = new THREE.Line(LineGeo, LineMat);
        line.scale.z = 10;

        let Rindex = 0;
        let Lindex = 1;

        if (navigator.platform.includes("Win")) {
            Rindex = 1;
            Lindex = 0;
        }

        this.RightController = this.BuildController(Rindex, line, this.ControllerModelFactory);
        this.LeftController = this.BuildController(Lindex, line, this.ControllerModelFactory);

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

    BuildController(index, line, modelFactory){
        
        // const controller = this.app.renderer.xr.getController(index);
        
        // controller.userData.selectPressed = false;
        // controller.userData.index = index;
        
        // if (line) controller.add(line.clone());
        
        // this.CameraDolly.add(controller);
        
        // let grip;
        
        // if ( modelFactory ){
        //     grip = this.app.renderer.xr.getControllerGrip( index );
        //     grip.add(this.ControllerModelFactory.createControllerModel( grip ));
        //     this.CameraDolly.add( grip );
        // }

        // const TracingMatrix = new THREE.Matrix4();
        // const raycaster = new THREE.Raycaster();
        // raycaster.layers.set(3);
        
        // return {controller, grip, TracingMatrix, raycaster};
    
    }

    TraceFromController(MotionController) {

        // MotionController.TracingMatrix.identity().extractRotation(MotionController.controller.matrixWorld);
    
        // MotionController.raycaster.ray.origin.setFromMatrixPosition(MotionController.controller.matrixWorld);
        // MotionController.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4(MotionController.TracingMatrix);
    
    }

}

export { VRPawn }