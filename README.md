# WebXR Project Template
_This is my template for WebXR-enabled Three.js projects. It's still a work in progress, though if you have any questions about the implementation please get in touch!_

[Steven M. Caruso Design Studio](https://www.smcaruso.com/) // [smcaruso](mailto:ize@smcaruso.com)

## webXRapp.js ##
Exports the main class of the application, which handles the core Three.js renderer and the animation loop. In this instance, it also instantiates a basic scene with a ground plane and cube. In non-template use, it would also create the full scene.

## VRPawn.js ##
Exports a pawn class, which is the player's representation in the VR world. Manages movement around the scene and interaction with objects through motion controllers.

## XRControllerModelFactory.js ##
Modification of the Three.js WebXR example classes, which includes a function to parse the VR controller profiles into simple objects.

## VRButton.js ##
Modification of the Three.js WebXR example class with CSS adjustments.

## ./static/profiles/ ##
Local copy of WebXR controller profiles and models pulled from Immersive Web.
