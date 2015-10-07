declare var Office: any;
declare var utils;

class Tracker {

    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
    public canvas: HTMLCanvasElement;
    public accelerate = 1;

    private _freeCamera: BABYLON.FreeCamera;
    private _tableBinding: any;
    private _animations = [];
    

    public playDatas() {
        /// <signature>
        ///   <summary>Get the datas from the workbook sheet and plays them in the 3D BabylonJS scene</summary>
        /// </signature>

        // Check if TableBinding already exists
        if (!this._tableBinding) {
            return;
        }

        var dateMin = undefined;
        var dateMax = undefined;
        var gapSec = undefined;

        // Get datas
        this._tableBinding.getDataAsync(
            {
                // Options : We can get filtered or not datas
                filterType: Office.FilterType.OnlyVisible,
                // Options : To be able to work with those datas, no format will help, later
                valueFormat: Office.ValueFormat.Unformatted
            },
            (result) => {
                if (result.status === "succeeded") {

                    // Rows !
                    var rows = result.value.rows;

                    //  Get Min and max
                    var delta = utils.getMinMax(rows, 4);

                    // Get timestamp interval
                    if (delta != undefined && delta.min != undefined && delta.max != undefined) {
                        dateMin = utils.fromOaDate(delta.min);
                        dateMax = utils.fromOaDate(delta.max);

                        gapSec = utils.substract(dateMax, dateMin, "s");
                    }

                    // grouping list
                    var lstGrp = utils.groupBy(rows, (item) => {
                        return [item[0]];
                    });

                    // Create the animations tab
                    this._animations = [];
                    // each group
                    for (var i = 0; i < lstGrp.length; i++) {
                        var sphTab = lstGrp[i];

                        // Every sphere must have a uniquename
                        var sphereName = "d_" + sphTab[0][0] + "sphere";
                        // Create the sphere
                        var sphere = BABYLON.Mesh.CreateSphere(sphereName + "_sphere", 8, 4, this.scene);

                        // Create a yellow texture
                        var m = new BABYLON.StandardMaterial("texture2", this.scene);
                        m.diffuseColor = new BABYLON.Color3(1, 1, 0); // yellow
                        sphere.material = m;
                        sphere.isPickable = true;

                        // Create an animation path
                        var animationPath = new BABYLON.Animation(sphereName + "_animation", "position", (30 * this.accelerate),
                            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

                        this._animations.push(animationPath);

                        // Create all the frames for each sphere
                        var keys = [];
                        var maxFrame = 0;
                        // in each group, each pos
                        for (var j = 0; j < sphTab.length; j++) {

                            var currentFrame;

                            var posData = sphTab[j];

                            var posX = +posData[1];
                            var posY = +posData[2];
                            var posZ = +posData[3];
                            var date = utils.fromOaDate(posData[4]);

                            // if there is no date, the coefficient is the number of action (One per sec)
                            // otherwise it's the delta time
                            var coef = j;

                            currentFrame = coef * 30;

                            var pos = new BABYLON.Vector3(posX, posY, posZ);
                            maxFrame = Math.max(maxFrame, currentFrame);

                            keys.push({ frame: currentFrame, value: pos });

                        }
                        animationPath.setKeys(keys);
                        sphere.animations.push(animationPath);

                        // Launch the animation for this sphere
                        this.scene.beginAnimation(sphere, 0, maxFrame, true);

                    }

                } else {
                    throw new Error(result.error.message);
                }
            });
    }

    private _setTableBinding() {
        /// <signature>
        ///   <summary>Create a binding to later gate the datas</summary>
        /// </signature>

        Office.context.document.bindings.addFromNamedItemAsync("Sheet1!Table1",
            Office.BindingType.Table, { id: "positions" },
            (asyncResult: any) => {
                if (asyncResult.status === "failed") {
                    console.log("Error: " + asyncResult.error.message);
                } else {
                    try {
                        this._tableBinding = asyncResult.value;
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
    }

    private _setFreeCameraPosition() {
        /// <signature>
        ///   <summary>Starting position of the free camera</summary>
        /// </signature>

        this._freeCamera.position.x = 135;
        this._freeCamera.position.y = 45
        this._freeCamera.position.z = -18;
        this._freeCamera.rotation.x = 0.55;
        this._freeCamera.rotation.y = 5;
        this._freeCamera.rotation.z = 0;

        // Vertical freeCamera debug style
        // Useful for having a better view on the scene

        //this.freeCamera.position.x = 56.7;
        //this.freeCamera.position.y = 73.05;
        //this.freeCamera.position.z = -3.5;
        //this.freeCamera.rotation.x = 1.49;
        //this.freeCamera.rotation.y = 4.67;
        //this.freeCamera.rotation.z = 0;

    }

    private _createScene() {
        /// <signature>
        ///   <summary>Creating the scene (see BabylonJS documentation) </summary>
        /// </signature>

        this.scene = new BABYLON.Scene(this.engine);

        this._freeCamera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 0, 5), this.scene);
        this._freeCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);

        this.scene.activeCamera = this._freeCamera;
        this._freeCamera.attachControl(this.canvas, true);

        var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);

        // Resizing the add in
        window.addEventListener("resize", () => { this.engine.resize(); });


        // The first parameter can be used to specify which mesh to import. Here we import all meshes
        BABYLON.SceneLoader.ImportMesh("", "/Assets/", "Welcome.babylon",
            this.scene, (newMeshes: BABYLON.AbstractMesh[]) => {

                // Remove some undesired assets
                var mesh = this.scene.getMeshByName("Cube Rouge");
                var indexMesh = this.scene.meshes.indexOf(mesh);
                if (indexMesh > -1) this.scene.meshes.splice(indexMesh, 1);

                mesh = this.scene.getMeshByName("Cube Bleu");
                indexMesh = this.scene.meshes.indexOf(mesh);
                if (indexMesh > -1) this.scene.meshes.splice(indexMesh, 1);

                // position Camera
                this._setFreeCameraPosition();

                //bind to existing datas
                this._setTableBinding();
            });

        return this.scene;
    }

    public launchScene() {
        /// <signature>
        ///   <summary>Launch the scene </summary>
        /// </signature>

        try {

            // Check if BabylonJS is supported
            if (!BABYLON.Engine.isSupported()) {
                return;
            }

            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }

            this.canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
            this.engine = new BABYLON.Engine(this.canvas, true);
            this.scene = this._createScene();

            // Here we go ! RENDERING BABY !
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });


        } catch (e) {
            console.log(e.message);
        }
    }

    public resetDatas() {
         /// <signature>
        ///   <summary>Stop the scene and reset all positions</summary>
        /// </signature>
      
        var lst = [];
        var i;
        var mesh;
        for (i = 0; i < this.scene.meshes.length; i++) {
            mesh = this.scene.meshes[i];
            if (mesh.name.indexOf("d_") === 0) {
                lst.push(mesh.name);
            }
        }

        if (lst.length === 0)
            return;

        for (i = 0; i < lst.length; i++) {
            mesh = this.scene.getMeshByName(lst[i]);

            var anima = this.scene.getAnimatableByTarget(mesh);
            if (anima != undefined)
                anima.stop();

            var indexMesh = this.scene.meshes.indexOf(mesh);
            if (indexMesh > -1) this.scene.meshes.splice(indexMesh, 1);
        }




    }
    

} 