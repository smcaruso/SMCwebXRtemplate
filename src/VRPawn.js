import * as THREE from "three";
import { XRControllerModelFactory } from "./XRControllerModelFactory.js"

class VRPawn {

    constructor(app) {

        this.app = app;
        this.XRSession = app.renderer.xr.getSession();

        this.PawnRoot = new THREE.Object3D();
        this.PawnRoot.name = "Pawn Root Camera Rig";

        app.ViewportCamera.add(new THREE.Object3D());

        // this.PawnRoot.translateX(app.ViewportCamera.children[0].position.x);
        // this.PawnRoot.translateZ(app.ViewportCamera.children[0].position.z);
        this.PawnRoot.position.copy(app.ViewportCamera.children[0].position);
        this.PawnRoot.add(app.ViewportCamera);

        this.Controllers = [];
        this.ControllerMap = {};
        this.RIndex = 0;
        this.LIndex = 1;

        this.GamepadValues = {
            A: false,
            ATouch: false,
            B: false,
            BTouch: false,
            X: false,
            XTouch: false,
            Y: false,
            YTouch: false,
            RTrigger: false, 
            RTriggerAxis: 0.0, 
            RGrip: false, 
            RGripAxis: 0.0,
            RStick: false,
            RStickTouch: false,
            RStickXAxis: 0.0, 
            RStickYAxis: 0.0,
            LTrigger: false, 
            LTriggerAxis: 0.0, 
            LGrip: false, 
            LGripAxis: 0.0,
            LStick: false,
            LStickTouch: false,
            LStickXAxis: 0.0, 
            LStickYAxis: 0.0,
        };

        this.GamepadDefaults = {};
        let key;
        for (key in this.GamepadValues) this.GamepadDefaults[key] = this.GamepadValues[key];

        this.InputCache = [];

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
        
        this.ControllerModelFactory = new XRControllerModelFactory(this);
    
        const LineGeo = new THREE.BufferGeometry().setFromPoints(
            [ new THREE.Vector3( 0,0,0 ), new THREE.Vector3( 0,-0.5, -1 ) ]
        );
    
        const LineMat = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            linewidth: 2
        });
    
        const line = new THREE.Line(LineGeo, LineMat);
        line.scale.z = 1;

        this.Controllers.push(this.BuildController(0, line), this.BuildController(1, line));

        const MoveTargetGeo =  new THREE.TorusBufferGeometry(0.35, 0.05, 3, 32);
        MoveTargetGeo.rotateX(-Math.PI * 0.5);
        MoveTargetGeo.translate(0, 0.1, 0);
        MoveTargetGeo.scale(1, 0.25, 1);

        this.MoveTarget = new THREE.Mesh(
            MoveTargetGeo,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(0, 192, 255)"),
                transparent: true,
                opacity: 0.5
            })
        );
        this.MoveTarget.material.blending = THREE.AdditiveBlending;
        this.MoveTarget.name = "Teleport movement target";
        this.MoveTarget.visible = false;
        this.app.scene.add(this.MoveTarget);

    }

    BuildController(index, line, sphere){
        
        const controller = this.app.renderer.xr.getController(index);
        
        controller.userData.selectPressed = false;
        controller.userData.index = index;

        const SelectionSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.125, 16, 16),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(0, 192, 255)"),
                transparent: true,
                opacity: 0.0
            })
        );
        SelectionSphere.material.blending = THREE.AdditiveBlending;
        SelectionSphere.name = "Selection Radius";
        
        if (line) controller.add(line.clone());
        controller.add(SelectionSphere);
                
        this.PawnRoot.attach(controller);
        
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

        let LinePos = new THREE.Vector3();
        // this.PawnRoot.localToWorld(LinePos)
        LinePos.y -= 0.5;
        LinePos.z -= 1;
    
        MotionController.raycaster.ray.origin.setFromMatrixPosition(MotionController.controller.matrixWorld);
        MotionController.raycaster.ray.direction.set(0, -0.5, -1).applyMatrix4(MotionController.TracingMatrix);
    }

    CheckControllerInputs() {

        let InputSources = this.XRSession.inputSources;
        let RightMapKeys = Object.keys(this.ControllerMap.right);
        let RightMapValues = Object.values(this.ControllerMap.right);

        let LeftMapKeys, LeftMapValues;
        if (this.ControllerMap.left) {
            LeftMapKeys = Object.keys(this.ControllerMap.left);
            LeftMapValues = Object.values(this.ControllerMap.left);
        }

        for (let index = 0; index < RightMapKeys.length; index++) { // RIGHT LOOP BEGIN

            if (RightMapKeys[index].includes("trigger")) {
                this.GamepadValues.RTrigger = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].pressed;
                this.GamepadValues.RTriggerAxis = parseFloat(InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].value.toFixed(2));
            }
            if (RightMapKeys[index].includes("squeeze")) {
                this.GamepadValues.RGrip = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].pressed;
                this.GamepadValues.RGripAxis = parseFloat(InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].value.toFixed(2));
            }
            if (RightMapKeys[index].includes("a_button")) {
                this.GamepadValues.A = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].pressed;
                this.GamepadValues.ATouch = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].touched;
            }
            if (RightMapKeys[index].includes("b_button")) {
                this.GamepadValues.B = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].pressed;
                this.GamepadValues.BTouch = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].touched;
            }
            if (RightMapKeys[index].includes("thumbstick") && RightMapKeys[index].includes("axis") === false ) {
                this.GamepadValues.RStick = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].pressed;
                this.GamepadValues.RStickTouch = InputSources[this.RIndex].gamepad.buttons[RightMapValues[index]].touched;
            }
            if (RightMapKeys[index].includes("xAxis")) {
                this.GamepadValues.RStickXAxis = InputSources[this.RIndex].gamepad.axes[RightMapValues[index]];
            }
            if (RightMapKeys[index].includes("yAxis")) {
                this.GamepadValues.RStickYAxis = InputSources[this.RIndex].gamepad.axes[RightMapValues[index]] * -1;
            }

        } // RIGHT LOOP END

        if (LeftMapKeys) { // nullptr protection
            for (let index = 0; index < LeftMapKeys.length; index++) { // LEFT LOOP BEGIN
    
                if (LeftMapKeys[index].includes("trigger")) {
                    this.GamepadValues.LTrigger = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].pressed;
                    this.GamepadValues.LTriggerAxis = parseFloat(InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].value.toFixed(2));
                }
                if (LeftMapKeys[index].includes("squeeze")) {
                    this.GamepadValues.LGrip = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].pressed;
                    this.GamepadValues.LGripAxis = parseFloat(InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].value.toFixed(2));
                }
                if (LeftMapKeys[index].includes("x_button")) {
                    this.GamepadValues.X = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].pressed;
                    this.GamepadValues.XTouch = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].touched;
                }
                if (LeftMapKeys[index].includes("y_button")) {
                    this.GamepadValues.Y = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].pressed;
                    this.GamepadValues.YTouch = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].touched;
                }
                if (LeftMapKeys[index].includes("thumbstick") && LeftMapKeys[index].includes("axis") === false ) {
                    this.GamepadValues.LStick = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].pressed;
                    this.GamepadValues.LStickTouch = InputSources[this.LIndex].gamepad.buttons[LeftMapValues[index]].touched;
                }
                if (LeftMapKeys[index].includes("xAxis")) {
                    this.GamepadValues.LStickXAxis = InputSources[this.LIndex].gamepad.axes[LeftMapValues[index]];
                }
                if (LeftMapKeys[index].includes("yAxis")) {
                    this.GamepadValues.LStickYAxis = InputSources[this.LIndex].gamepad.axes[LeftMapValues[index]] * -1;
                }
    
            } // LEFT LOOP END
        } // END IF

        let NewInputCache = {};
        let key;
        for (key in this.GamepadValues) NewInputCache[key] = this.GamepadValues[key];

        this.InputCache.unshift(NewInputCache);
        if (this.InputCache.length > 2) this.InputCache.pop();

        return this.InputCache;

    }

    PressButton(input) {

        switch (input) {

            case "A":
                // console.log("A pressed");
                break;

            case "ATouch":
                // console.log("A touched");
                break;

            case "B":
                // console.log("B pressed");
                break;

            case "BTouch":
                // console.log("B touched");
                break;

            case "X":
                // console.log("X pressed");
                break;

            case "XTouch":
                // console.log("X touched");
                break;

            case "Y":
                // console.log("Y pressed");
                break;

            case "YTouch":
                // console.log("Y touched");
                break;

            case "RTrigger":
                // console.log("Right trigger pressed");
                break;

            case "RGrip":
                // console.log("Right grip pressed");
                break;

            case "RStick":
                // console.log("Right stick pressed");
                break;

            case "RStickTouch":
                // console.log("Right stick touched");
                break;

            case "LTrigger":
                // console.log("Left trigger pressed");
                break;

            case "LGrip":
                // console.log("Left grip pressed");
                break;

            case "LStick":
                // console.log("Left stick pressed");
                break;

            case "LStickTouch":
                // console.log("Left stick touched");
                break;

        }

    }

    ReleaseButton(input) {

        switch (input) {

            case "A":
                // console.log("A released");
                break;

            case "ATouch":
                // console.log("A untouched");
                break;

            case "B":
                // console.log("B released");
                break;

            case "BTouch":
                // console.log("B untouched");
                break;

            case "X":
                // console.log("X released");
                break;

            case "XTouch":
                // console.log("X untouched");
                break;

            case "Y":
                // console.log("Y released");
                break;

            case "YTouch":
                // console.log("Y untouched");
                break;

            case "RTrigger":
                // console.log("Right trigger released");
                break;

            case "RGrip":
                this.RightController.controller.children[1].material.opacity = 0;
                break;

            case "RStick":
                // console.log("Right stick released");
                break;

            case "RStickTouch":
                // console.log("Right stick untouched");
                break;

            case "LTrigger":
                // console.log("Left trigger released");
                break;

            case "LGrip":
                this.LeftController.controller.children[1].material.opacity = 0;
                break;

            case "LStick":
                // console.log("Left stick released");
                break;

            case "LStickTouch":

                break;

        }

    }

    AxisChange(input, InputCache) {

        switch (input) {

            case "RTriggerAxis":
                break;

            case "RGripAxis":

                if (this.GamepadValues.RGripAxis > InputCache[1][input]) {
                    this.RightController.controller.children[1].material.opacity =
                    0.25 - (this.GamepadValues.RGripAxis * 0.25);
                }

                break;

            case "RStickXAxis": // Snap rotation

                if (this.GamepadValues.RStickXAxis > 0.9 && InputCache[1][input] < 0.9) {
                    this.PawnRoot.rotateY(-Math.PI * 0.25);
                } else if (this.GamepadValues.RStickXAxis < -0.9 && InputCache[1][input] > -0.9) {
                    this.PawnRoot.rotateY(Math.PI * 0.25);
                } else break;

            case "RStickYAxis":
                break;

            case "LTriggerAxis":
                break;

            case "LGripAxis":

                if (this.GamepadValues.LGripAxis > InputCache[1][input]) {
                    this.LeftController.controller.children[1].material.opacity =
                        0.25 - (this.GamepadValues.LGripAxis * 0.25);
                }

                break;

            case "LStickXAxis": 
                break;

            case "LStickYAxis": // Teleportation

                if (this.GamepadValues.LStickYAxis > 0) {
                    this.LeftController.controller.children[0].scale.x = this.GamepadValues.LStickYAxis;
                    this.LeftController.controller.children[0].scale.y = this.GamepadValues.LStickYAxis;
                    this.LeftController.controller.children[0].scale.z = this.GamepadValues.LStickYAxis;
                } else {
                    this.LeftController.controller.children[0].scale.x = 0;
                    this.LeftController.controller.children[0].scale.y = 0;
                    this.LeftController.controller.children[0].scale.z = 0;
                }

                if (this.GamepadValues.LStickYAxis === 0 && !this.GamepadValues.LStickTouch) {
                    this.PawnRoot.position.set(
                        this.MoveTarget.position.x,
                        this.MoveTarget.position.y,
                        this.MoveTarget.position.z
                    );
                }

                break;

        }

    }

}

export { VRPawn }