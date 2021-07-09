import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";
import { gsap } from "gsap";

class VRTextPanel extends THREE.Object3D {

    constructor(Element, FontDef, FontTex, AppTextureLoader) {

        super();

        // constructor takes in div element and MSDF font data.

        const VRTextContainer = new ThreeMeshUI.Block({
            ref: "container",
            backgroundColor: new THREE.Color(0x000000),
            backgroundOpacity: 0.75,
            borderRadius: 0.0,
            padding: 0.025,
            height: 2,
            width: 1.25,
            contentDirection: "column",
            alignContent: "left",
            justifyContent: "start",
            
        });

        let TotalHeight;

        for (let node = 0; node < Element.childNodes.length; node++) {

            let NodeBlock;

            switch (Element.childNodes[node].nodeName) {

                case "H1":
                    NodeBlock = new ThreeMeshUI.Block({
                        height: 0.075,
                        width: 1.2,
                        margin: 0.0,
                        padding: 0.025,
                        backgroundOpacity: 0.75,
                        alignContent: "left",
                        justifyContent: "center",
                        fontFamily: FontDef,
                        fontTexture: FontTex,
                        fontSize: 0.05,
                    });
                
                    NodeBlock.add(new ThreeMeshUI.Text({
                        content: Element.childNodes[node].innerText,
                    }));
                
                    TotalHeight += 0.1;
                    break;

                case "H2":
                    NodeBlock = new ThreeMeshUI.Block({
                        height: 0.075,
                        width: 1.2,
                        margin: 0.0,
                        padding: 0.025,
                        backgroundOpacity: 0.75,
                        alignContent: "left",
                        justifyContent: "center",
                        fontFamily: FontDef,
                        fontTexture: FontTex,
                        fontSize: 0.05,
                    });
            
                    NodeBlock.add(new ThreeMeshUI.Text({
                        content: Element.childNodes[node].innerText,
                    }));
        
                    TotalHeight += 0.1;
                    break;
                
                    case "IMG":
                        NodeBlock = new ThreeMeshUI.Block({
                            height: 0.55,
                            width: 1.15,
                            margin: 0.025,
                            padding: 0.0,
                            backgroundOpacity: 1,
                            borderRadius: 0.0,
                            backgroundSize: "stretch",
                            alignContent: "left",
                            justifyContent: "center",
                        });
                        
                        let texloader;
                        if (!AppTextureLoader) texloader = new THREE.TextureLoader();
                        else texloader = AppTextureLoader;

                        texloader.load(Element.childNodes[node].currentSrc, function(texture) {
                            NodeBlock.set({backgroundTexture: texture});
                        });
                        
                        TotalHeight += 0.2;
                        break;

                    case "H3":
                        NodeBlock = new ThreeMeshUI.Block({
                            height: 0.05,
                            width: 1.2,
                            margin: 0.0,
                            padding: 0.025,
                            backgroundOpacity: 0,
                            alignContent: "left",
                            justifyContent: "center",
                            fontFamily: FontDef,
                            fontTexture: FontTex,
                            fontSize: 0.025,
                        });
                
                        NodeBlock.add(new ThreeMeshUI.Text({
                            content: Element.childNodes[node].innerText,
                        }));
            
                        TotalHeight += 0.05;
                        break;
                    
                    case "H4":
                        NodeBlock = new ThreeMeshUI.Block({
                            height: 0.05,
                            width: 1.2,
                            margin: 0.0,
                            padding: 0.025,
                            backgroundOpacity: 0,
                            alignContent: "left",
                            justifyContent: "center",
                            fontFamily: FontDef,
                            fontTexture: FontTex,
                            fontSize: 0.025,
                        });
                
                        NodeBlock.add(new ThreeMeshUI.Text({
                            content: Element.childNodes[node].innerText,
                        }));
            
                        TotalHeight += 0.05;
                        break;
                    
                    case "P":
                        let BlockHeight;
                        if (Element.childNodes[node].firstChild != null) {
                            BlockHeight = InfoPanel.childNodes[node].firstChild.length * 0.0004;
                        } else {
                            BlockHeight = 0.0125;
                        }
            
                        NodeBlock = new ThreeMeshUI.Block({
                            height: BlockHeight,
                            width: 1.2,
                            margin: 0.0,
                            padding: 0.025,
                            backgroundOpacity: 0,
                            alignContent: "left",
                            justifyContent: "center",
                            fontFamily: FontDef,
                            fontTexture: FontTex,
                            fontSize: 0.025,
                        });
            
                        NodeBlock.add(new ThreeMeshUI.Text({
                            content: Element.childNodes[node].innerText,
                        }));
            
                        TotalHeight += BlockHeight;
                        break;

                    case "UL":
                        let BlockHeight = Element.childNodes[node].childNodes.length * 0.03;

                        NodeBlock = new ThreeMeshUI.Block({
                            height: BlockHeight,
                            width: 1.2,
                            margin: 0.0,
                            padding: 0.05,
                            backgroundOpacity: 0,
                            alignContent: "left",
                            justifyContent: "center",
                            fontFamily: FontDef,
                            fontTexture: FontTex,
                            fontSize: 0.025,
                        });
                        NodeBlock.add(new ThreeMeshUI.Text({
                            content: Element.childNodes[node].innerText,
                        }));
            
                        TotalHeight += BlockHeight;
                        break;

            } // end switch
        } // end loop

        if (NodeBlock != undefined) VRTextContainer.add(NodeBlock);
        VRTextContainer.height = TotalHeight;

        this.add(VRTextContainer);
        this.visible = false;
        
    }

    open() {

        gsap.fromTo(this.scale,
            {y: 0.0},
            {y: 0.5,
            duration: 0.5}
        );

    }

    close() {

        gsap.to(this.scale,
            {y: 0.0,
            duration: 0.25}
        );

    }

    ScrollUp() {

        // todo

    }

    ScrollDown() {

        // todo

    }

}

export { VRTextPanel }