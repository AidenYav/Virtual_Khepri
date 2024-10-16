//-------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------<World Building Functions>-------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------
export let activeMap = undefined;
export const unit_multiplier = 2;

let activeMapIndex = 0;
export let worldsCreated = new Array();
export default class MapBuilder{



    constructor(base, model){
        this.base = base;
        this.model = model;
        // loadWorld(base, model)
    }

    loadWorld() {

        this.clearMap();

        this.base.add(this.model);

        //Creates new map
        // activeMap = [   [ 0 , 0 , 0 , 0 , 0, 0, 0 ],
        //                 [ 1 , 1 , 1 , 1 , 0, 0, 0 ],
        //                 [ 0 , 0 , 0 , 1 , 0, 0, 0 ],
        //                 [ 0 , 1 , 1 , 1 , 2, 0, 0 ],
        //                 [ 0 , 0 , 0 , 0 , 0, 0, 0 ] 
        //             ]

        //Builds the wals for the map
        this.buildMap(activeMap, this.base, this.model)

        //Creates some basic geometry
        // const icoSphere = new THREE.IcosahedronGeometry(1.0, 2);
        const cube = new THREE.BoxGeometry(2,2,2,2,2,2);
        //Creates some materials to use
        // const mat = new THREE.MeshBasicMaterial({
        //     color: 0xccff
        // })
        const wireMat = new THREE.MeshBasicMaterial({
            color : 0x000000,
            wireframe: true
        })
        //Adds a wire "hitbox" to the model for visualization
        //(Wire hitbox doesn't really matter though, may be removed in the future)
        // model.add(new THREE.Mesh(cube, wireMat));

        // const mesh = new THREE.Mesh(icoSphere, mat);
        // mesh.material = wireMat;

        //Creates a plane used as a base plate
        // console.log(activeMap.length, activeMap[0].length);
        const planeGeo = new THREE.PlaneGeometry( activeMap[0].length*2, activeMap.length*2 , activeMap[0].length, activeMap.length);
        const material = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide, transparent : true, opacity : 0.5} );
        // const wallMat = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent : false, opacity: 0.5})
        const wireframe = new THREE.WireframeGeometry( planeGeo );
        const line = new THREE.LineSegments( wireframe );
        
        const plane = new THREE.Mesh( planeGeo, material );
        const wire = new THREE.Mesh( planeGeo, wireMat);
        plane.add(line) //Adds wireframe lines to create a grid-like visualization that the user will be moving along
        plane.name = "plane" //Naming for reference
        this.base.add(wire);
        this.base.add( plane ); //Adds plane to the actual world
        wire.position.z -= 1;
        plane.position.z -= 1.05;//An extra 0.05 to prevent clipping

    }

    buildMap(map, objectBase, model){
        
        const length = map.length;
        const width = map[0].length;
        const center_x = Math.round(width/2);
        const center_y = Math.round(length/2);

        // console.log(center)
        //Creates boarder
        this.boarderGenerator(map, objectBase)

        //Creates interior map
        for(let r = 0; r < length; r++){
            for(let c = 0; c < width; c++){
                //Walls
                if (map[r][c] == 1){
                    let wall = this.createWall();
                    wall.position.x = (c - center_x + 1) * unit_multiplier;
                    wall.position.y = (center_y - r - 1) * unit_multiplier;
                    // console.log(wall.position.x, wall.position.y)
                    objectBase.add(wall);
                }
                //Spawn
                else if (map[r][c] == 2){
                    model.position.x = (c - center_x + 1) * unit_multiplier;
                    model.position.y = (center_y - r - 1) * unit_multiplier;
                    // model_no_camera.position.x = (c - center_x + 1) * unit_multiplier;
                    // model_no_camera.position.y = (center_y - r - 1) * unit_multiplier;
                }
                //End point
                else if (map[r][c] == 3){
                    let endPoint = this.createEndPoint();
                    endPoint.position.x = (c - center_x + 1) * unit_multiplier;
                    endPoint.position.y = (center_y - r - 1) * unit_multiplier;
                    objectBase.add(endPoint);
                }
            }
        }
    }

    createWall(){
        const cube = new THREE.BoxGeometry(2,2,2,2,2,2);
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa, 
            transparent : false, 
            opacity: 0.5

        });
        const wireframe = new THREE.WireframeGeometry( cube );
        const line = new THREE.LineSegments( wireframe );
        
        const wall = new THREE.Mesh(cube, wallMat);
        wall.add(line);
        return wall;
    }

    createEndPoint(){
        const cube = new THREE.BoxGeometry(1,1,1,2,2,2);
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0x55aa55, 
            transparent : false, 
            opacity: 0.5
        });
        const wireframe = new THREE.WireframeGeometry( cube );
        const line = new THREE.LineSegments( wireframe );
        const endPoint = new THREE.Mesh(cube, wallMat);
        endPoint.add(line);
        return endPoint;
        
    }

    boarderGenerator(map, objectBase){
        const length = map.length;
        const width = map[0].length;
        const center_x = Math.round(width/2);
        const center_y = Math.round(length/2);
        for(let x=-1; x < width + 1; x++){
            let wall = this.createWall();
            wall.position.x = (x - center_x + 1) * unit_multiplier
            wall.position.y = center_y * unit_multiplier
            objectBase.add(wall);
            let wall2 = this.createWall();
            wall2.position.x = (x - center_x + 1) * unit_multiplier
            wall2.position.y = -center_y * unit_multiplier
            objectBase.add(wall2);
        }
        for(let y=0; y < length+1; y++ ){
            let wall = this.createWall();
            wall.position.x = center_x * unit_multiplier
            wall.position.y = (center_y - y) * unit_multiplier
            objectBase.add(wall);
            let wall2 = this.createWall();
            wall2.position.x = -center_x * unit_multiplier
            wall2.position.y = (center_y - y) * unit_multiplier
            objectBase.add(wall2);
        }
    }

    
    



    clearMap(){
        // console.log(this.base.children.length);
        let children = this.base.children;
        while(children.length > 0) {
            // Remove child from parent
            this.base.remove(children[0]);
          
            // Dispose of child's geometries and materials
            // child.geometry.dispose();
            // child.material.dispose();
          
            // Dispose of textures if any
            // if (child.material.map) child.material.map.dispose();
        };
        // console.log(this.base.children.length);
    }
}


function loadMap(index){
    if (index < MapData.length){
        // console.log("Loading Map",index);
        activeMap = MapData[index];
        reloadWorld();
        return true;
    }
    console.warn("Map index does not exist");
    return false;
}


function createMapButtons(){
    const parent = document.getElementById("levelMenu");
    MapData.forEach((item, index) => {
        // console.log("Item at index index:",index);
        // console.log(item);
        const button = document.createElement("button");
        button.className = "levelButton";
        button.textContent = index + 1;
        button.onclick = () =>{
            loadMap(index);
            parent.classList.toggle("hidden",true);
        };
        parent.append(button);
    });
}

function reloadWorld(){
    worldsCreated.forEach((world, index) => {
        // console.log(world);
        world.loadWorld();
    });
}

let MapData = undefined;
// Function to load JSON data
async function loadJSON() {
    try {
    const response = await fetch('maps.json');
    MapData = await response.json();
    // console.log(MapData);
    } catch (error) {
    console.error('Error loading JSON:', error);
    }
    createMapButtons();
    activeMap = loadMap(0);

}
window.onload = function(){

  // Call the function to load JSON data
  loadJSON();
  
}