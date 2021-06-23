import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRButton } from "./VRButton.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { VRPawn } from "./VRPawn.js";

class WebXRApp {

    constructor() {
        
        this.CanvasElement = document.querySelector("canvas.webgl");
        
        this.WindowSizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        this.InitThreeScene();
        this.InitLoaders();
        this.AddVRButton();
        this.DrawBasicTestScene();
        
        window.addEventListener("resize", this.Resize.bind(this));
        this.renderer.xr.addEventListener("sessionstart", this.StartXRSession.bind(this));

	}
	
    Resize() {
        this.ViewportCamera.aspect = window.innerWidth / window.innerHeight;
        this.ViewportCamera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }

    InitThreeScene() {

        this.scene = new THREE.Scene();

        this.ViewportCamera = new THREE.PerspectiveCamera(
            45,
            this.WindowSizes.width / this.WindowSizes.height,
            0.1,
            100
        );
        this.ViewportCamera.name = "Viewport Camera";
        this.ViewportCamera.position.set(3,3,3);

        this.scene.add(this.ViewportCamera);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.CanvasElement,
            antialias: true
        });

        this.renderer.setSize(this.WindowSizes.width, this.WindowSizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.setClearColor("rgb(80, 80, 80)");
        this.renderer.setAnimationLoop(this.RenderLoop.bind(this));

        this.OrbitControlSystem = new OrbitControls(this.ViewportCamera, this.CanvasElement);

    }
        
    RenderLoop() {
        
        this.renderer.render(this.scene, this.ViewportCamera);
        this.OrbitControlSystem.update();

        let pawn = this.VRPawn;
        
        if (this.VRPawn != null && this.renderer.xr.isPresenting) {
            Object.values(pawn.MotionControllers).forEach(
                function(controller) {
                    controller.updateFromGamepad();
                    pawn.UpdateControllerModel(controller);
                    let model = pawn.PawnRoot.getObjectByName(controller.name);
                    if (model != undefined) {
                        model.setRotationFromEuler(controller.xrController.rotation);
                        model.position.set(controller.xrController.position.x, controller.xrController.position.y, controller.xrController.position.z);
                    }
                }
            );
        }

        // if (this.renderer.xr.isPresenting) {
            
        //     this.VRPawn.TraceFromController(this.VRPawn.RightController);
        //     this.VRPawn.TraceFromController(this.VRPawn.LeftController);

        //     let NavIntersects = this.VRPawn.LeftController.raycaster.intersectObject(this.scene, true);
        //     if (NavIntersects.length > 0) {
        //         this.VRPawn.MoveTarget.position.set(NavIntersects[0].point.x,NavIntersects[0].point.y, NavIntersects[0].point.z);
        //         this.VRPawn.MoveTarget.visible = true;
        //     } else {
        //         this.VRPawn.MoveTarget.visible = false;
        //     }
        // }
        
    }

    InitLoaders() {

        this.loaders = {};
        this.loaders.manager = new THREE.LoadingManager(
            function LoadingComplete() {
                console.log("All assets loaded");
            },
            function LoadingInProgress(AssetURL, NumLoaded, NumTotal) {
                const ProgressRatio = NumLoaded / NumTotal;
            },
            function LoadingError(AssetURL) {
                console.log(`Error loading ${AssetURL}`);
            }
        );

        this.loaders.cubemap = new THREE.CubeTextureLoader(this.loaders.manager);
        this.loaders.texture = new THREE.TextureLoader(this.loaders.manager);
        this.loaders.gltf = new GLTFLoader(this.loaders.manager);
        this.loaders.font = new THREE.FontLoader(this.loaders.manager);

    }

    AddVRButton() {

        this.EnterVRButton = VRButton.createButton(this.renderer);
        document.body.appendChild(this.EnterVRButton);

    }

    StartXRSession() {

        this.VRPawn = new VRPawn(this);
        this.scene.add(this.VRPawn.PawnRoot);

    }
    
    DrawBasicTestScene() {

        const AxisHelper = new THREE.AxesHelper(1);

        const ambientLight = new THREE.AmbientLight(0xffffff, 3);

        const GroundPlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10,10,1,1),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(50, 50, 50)")
            })
        );

        const BigCube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(1,1,1,1,1,1),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(200, 50, 50)")
            })
        );

        GroundPlane.rotation.set(-Math.PI * 0.5,0,0);
        BigCube.position.set(0, 0.5, -2);
        BigCube.layers.enable(3);
        GroundPlane.layers.enable(3);

        this.scene.add(AxisHelper, GroundPlane, BigCube, ambientLight);
    }

}

export { WebXRApp };