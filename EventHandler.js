// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import BlockCompiler, { Block, Direction, Type, degrees_to_radians, radians_to_degrees } from "./Block.js";


console.log("Hello World!")
const screen = document.getElementById('screen'); // Get a reference to an element
const workspace_area = document.getElementById('workspace_area');
const editor_view_area = document.getElementById('editor_view');
if (screen == null){
    console.log("Could not find screen")
}
else{
    console.log("screen Identified")
}

const hammer = new Hammer(screen); // Create an instance of Hammer with the reference
const workspace_events = new Hammer(workspace_area);
// console.log("Hello World!")
hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
workspace_events.get('pan').set({ direction: Hammer.DIRECTION_ALL });
// const model = document.getElementById("model");

const base = document.getElementById("base").object3D;
let block_dictionary = {counter : 0};
const loader = new THREE.GLTFLoader();
let activeMap = undefined;
let model = undefined;
let compiler = undefined;
loader.load( './Models/Pyramid.glb', function ( gltf ) {

    //Model set up
    model = gltf.scene;
    model.name = "robot"
    model.scale.multiplyScalar(0.6);
    model.position.z += 1;
    model.rotation.x -= degrees_to_radians(90);
    //Base set up
    base.name = "base"
	base.add( model );
    //World set up
    loadWorld();
    //Block compiler configuration
    compiler = new BlockCompiler(model,document.getElementById("command_list"), activeMap);
    

}, undefined, function ( error ) {

	console.error( error );

} );

// const web_camera = document.getElementById("camera");


// const scene = screen.object3D

// console.log(scene)
const scene = document.getElementById("screen").object3D;
// console.log(scene)

function loadWorld() {
    //Creates new map
    activeMap = [   [ 0 , 0 , 0 , 0 , 0 ],
                    [ 1 , 1 , 1 , 1 , 0 ],
                    [ 0 , 0 , 0 , 1 , 0 ],
                    [ 0 , 1 , 1 , 1 , 0 ],
                    [ 0 , 0 , 0 , 0 , 0 ] 
                ]
    //Builds the wals for the map
    buildMap(activeMap, base)

    //Creates some basic geometry
    const icoSphere = new THREE.IcosahedronGeometry(1.0, 2);
    const cube = new THREE.BoxGeometry(2,2,2,2,2,2);
    //Creates some materials to use
    const mat = new THREE.MeshBasicMaterial({
        color: 0xccff
    })
    const wireMat = new THREE.MeshBasicMaterial({
        color : 0xffffff,
        wireframe: true
    })
    //Adds a wire "hitbox" to the model for visualization
    //(Wire hitbox doesn't really matter though, may be removed in the future)
    model.add(new THREE.Mesh(cube, wireMat));

    // const mesh = new THREE.Mesh(icoSphere, mat);
    // mesh.material = wireMat;

    //Creates a plane used as a base plate
    const planeGeo = new THREE.PlaneGeometry( 10, 10 , 5, 5);
    const material = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide, transparent : true, opacity : 0.5} );
    // const wallMat = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent : false, opacity: 0.5})
    const wireframe = new THREE.WireframeGeometry( planeGeo );
    const line = new THREE.LineSegments( wireframe );

    const plane = new THREE.Mesh( planeGeo, material );
    plane.add(line) //Adds wireframe lines to create a grid-like visualization that the user will be moving along
    plane.name = "plane" //Naming for reference
    base.add( plane ); //Adds plane to the actual world
    plane.position.z -= 1.05;//An extra 0.05 to prevent clipping

}


const rotationSpeed = 0.0001; // Adjust as needed
const gravity = 9.8 //meters per second
const doubleTapThreshold = 300; // Maximum time (in milliseconds) between taps for double tap
const max_x_rotation = degrees_to_radians(45); 
const x_offset = degrees_to_radians(-90);
let lastTapTime = 0;
let lastRotateTime = 0;

let currentScale = base.scale.x;

let last_clicked_block = undefined;
let pan_inprogress = false;
const drag_offset = 20;

workspace_events.on("panleft panright panup pandown panend", function(ev){
    if (!pan_inprogress){
        // console.log(ev.center.x, ev.center.y);
        // console.log(ev.target.classList);
        // console.log(ev.center.y- window.screen.height*0.5);
        if(ev.target.classList.contains("spawner")){
            // console.log("Hi")
            last_clicked_block = create_draggable_block(ev.target);
            // ev.target.click();
        }
        if (ev.target.classList.contains("draggable")){
            last_clicked_block = ev.target;
            unsnap_detection(last_clicked_block);
        }
        pan_inprogress = true;
    }
    //Moves the draggable object as the mouse moves, giving the user a perception that they are actively moving the object.
    if(pan_inprogress && last_clicked_block != undefined){
        last_clicked_block.style.left = ev.center.x + 'px';
        last_clicked_block.style.top = ev.center.y - workspace_area.getBoundingClientRect().top + drag_offset + 'px';
    }
    if (ev.type == "panend"){
        /* Some data information checks
        // console.log(last_clicked_block);
        // console.log(ev.center.x, ev.center.y);
        // console.log("Pan ended");*/


        pan_inprogress = false;
        

        //After the draggable is placed, do connection checks
        //Snap check (chains together draggables)
        if (last_clicked_block != undefined){
            // console.log(last_clicked_block.dataset.identifier);
            delete_block_check(last_clicked_block); //Checks if the block should be deleted after being dragged to a delete zone
            snap_blocks(last_clicked_block);
        }
        
        last_clicked_block = undefined; //Clear only at the end
    }
});
const snapThreshold = 10; //20 pixels
function snap_blocks(original){
    //Retrieves all active draggable objects. This is a non-live list, so recheck this list every call.
    //Could be optimize to check only every new draggable creation but may get messy when reading between different events and functions
    const draggables = document.querySelectorAll('.draggable');
    
    for(let i=0; i<draggables.length; i++){
        let other = draggables[i];
        if (original !== other) {
            //Get the position of the 2 boxes this is going to snap to
            let originalRect = original.getBoundingClientRect();
            let otherRect = other.getBoundingClientRect();

            //Skips this loop if the compared boxes are not even in the same X area
            if(originalRect.left > otherRect.right + snapThreshold ||
                originalRect.right < otherRect.left - snapThreshold){
                // console.log(originalRect.left - otherRect.right,originalRect.right - otherRect.left)
            }
            //Snaps the block to the bottom of the other one
            //Snapping to the bottom takes priority
            else if (Math.abs(originalRect.top - otherRect.bottom) < snapThreshold) {
                original.style.top = otherRect.bottom - workspace_area.getBoundingClientRect().top  + drag_offset*1.5 +  'px';
                // console.log(otherRect.bottom, original.getBoundingClientRect().top)
                original.style.left = otherRect.left +'px';
                // console.log("Snap Bottom")
                //Sets the placed block to run after the other block
                // console.log(block_dictionary[other.dataset.identifier])
                block_dictionary[other.dataset.identifier].insertBlock(block_dictionary[original.dataset.identifier]);
                //Overlap check
                return;
            }
            //Snaps the block to the top of the other one
            else if (Math.abs(originalRect.bottom - otherRect.top) < snapThreshold) {
                original.style.top = otherRect.top - originalRect.height - workspace_area.getBoundingClientRect().top + drag_offset*1.3 + 'px';
                original.style.left = otherRect.left +'px';
                // console.log("Snap Top")
                //Sets the other block to run after the place block is activated
                block_dictionary[original.dataset.identifier].insertBlock(block_dictionary[other.dataset.identifier]);
                //Overlap check
                return;
            } 

        }
    }
}

function unsnap_detection(original){
    const draggables = document.querySelectorAll('.draggable');
    block_dictionary[original.dataset.identifier].clearNextBlock(); //Delete whatever child command was here previously since this block is being moved.
    for(let i=0; i<draggables.length; i++){
        let other = draggables[i];
        if (original !== other) {
            let originalRect = original.getBoundingClientRect();
            let otherRect = other.getBoundingClientRect();
            //Bottom unsnapping is the primary issue
            if (Math.abs(originalRect.top - otherRect.bottom) < snapThreshold && 
                originalRect.left == otherRect.left){
                //If this is true, then the other block must be the parent of this block, and it's child command needs to be deleted
                // console.log("Unsnapped from block", other.dataset.identifier);
                block_dictionary[other.dataset.identifier].clearNextBlock();
            }
        }
    }
}

function delete_block_check(block){
    let block_box = block.getBoundingClientRect();
    if (block_box.top < editor_view_area.getBoundingClientRect().top || 
        block_box.left < editor_view_area.getBoundingClientRect().left){

        //Checks that the block exists before running the delete command, although it should be guranteed that it does exist
        if (block.dataset.identifier in block_dictionary){
            delete block_dictionary[block.dataset.identifier] //Theoretically should release the memory space of the object
        }
        else{
            console.warn("Block data wasn't in the dictionay to delete...");
        }
        block.remove(); //Actually delete the object from the page
        
    }
}


function create_draggable_block(source_block){
    const block = document.createElement("label");
    block.textContent = source_block.textContent;
    block.className = "draggable command selected";
    block.classList.toggle("selected", false);

    let newBlockData = undefined
    if (source_block.dataset.type == "Compiler"){
        //Only 1 "Compiler" should exist at any one time, at least for 1 specific object.
        if ("Compiler" in block_dictionary){
            block_dictionary["Compiler"].remove();
            delete block_dictionary["Compiler"];
        }
        newBlockData = new Block( 
            "Forward", 
            0, 
            source_block.dataset.type, 
            block);
        block.dataset.identifier = "Compiler";
        block.id = "start";
    }
    else{
        newBlockData = new Block( 
            source_block.dataset.direction, 
            source_block.dataset.magnitude * unit_multiplier, 
            source_block.dataset.type, 
            block);
        block.dataset.identifier = block_dictionary.counter;
        block_dictionary.counter++;
    }
    
    block_dictionary[block.dataset.identifier] = newBlockData;
    workspace_area.append(block);
    return block;
}

// listen to events...
hammer.get('pinch').set({ enable: true });
hammer.on("panleft panright panup pandown tap press pinch pinchend", function(ev) {
    //console.log(ev.type +" gesture detected.");
    if (ev.type == "pinch"){
        //Starts each pinch with a scale increase of 0
        //If ev.scale is < 1, then processed scale will be negative and will shrink the scale
        //If ev.scale is > 1, then processed scale will be positive and will grow the scale
        //Multiplied by an extra 0.5 to reduce the scale speed by half
        let processedScale = (ev.scale - 1) * 0.5; 
        //Adds the "relative scale" in which the value should be decreasing or increasing relative to.
        processedScale += currentScale;
        //At this point, processed scale can take in other constraints such as clamps
        processedScale = clamp(processedScale, 0.1, 5);
        base.scale.set(processedScale,  processedScale,  processedScale);
    }

    if (ev.type == "pinchend"){
        currentScale = base.scale.x;
        console.log(currentScale);
    }


    if (ev.type == "tap"){
        const currentTime = Date.now();
        if (currentTime - lastTapTime < doubleTapThreshold) {
            // Double tap detected
            //console.log('Double tap detected!');
            // model.position.y += gravity * 0.01
        } else {
            // Single tap detected
            // model.position.y -= gravity * 0.01
            //console.log('Single tap detected');
            console.log(checkForWall(model, activeMap));
            // console.log(radians_to_degrees(model.rotation.x) +"\n"+ radians_to_degrees(model.rotation.y) +"\n"+ radians_to_degrees(model.rotation.z))
        }
        // console.log(currentTime - lastTapTime)
        lastTapTime = currentTime;
        
   }

   

   hammer.on("swipe pan", (ev) =>{
    const currentTime = Date.now()
    if (currentTime - lastRotateTime < 10){
        
        switch(ev.direction){
            case Hammer.DIRECTION_LEFT:
                rotate_y_axis(1);
                break;
            case Hammer.DIRECTION_RIGHT:
                rotate_y_axis(-1);
                break;
            // Add more cases for up and down if desired
            case Hammer.DIRECTION_DOWN:
                // console.log("Down");
                rotate_x_axis(1);
                break;
            case Hammer.DIRECTION_UP:
                rotate_x_axis(-1);
                break;
            default:
                break;
        }
    }
    lastRotateTime = currentTime;
    })
    
    
});

function rotate_x_axis(factor) {
    let y_rotation = Math.abs(radians_to_degrees(model.rotation.y));
    // console.log(y_rotation % 180)
    factor *= y_rotation % 360 < 180 ?  1 : -1;
        
    model.rotation.x = clamp(model.rotation.x + rotationSpeed * factor, 
        x_offset - max_x_rotation, 
        x_offset + max_x_rotation)
}


function buildMap(map, objectBase){
    let size = map.length;
    let center = Math.round(size/2);
    console.log(center)
    //Creates boarder
    boarderGenerator(size, objectBase)

    //Creates interior map
    for(let r = 0; r < size; r++){
        for(let c = 0; c < size; c++){
            if (map[r][c] != 0){
                let wall = createWall();
                wall.position.x = (c - center + 1) * unit_multiplier
                wall.position.y = (center - r - 1) * unit_multiplier
                // console.log(wall.position.x, wall.position.y)
                objectBase.add(wall);
            }
        }
    }
}

function createWall(){
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
    return wall
}

function boarderGenerator(size, objectBase){
    const center = Math.round(size/2);
    for(let x=-1; x < size + 1; x++){
        let wall = createWall();
        wall.position.x = (x - center + 1) * unit_multiplier
        wall.position.y = center * unit_multiplier
        objectBase.add(wall);
        let wall2 = createWall();
        wall2.position.x = (x - center + 1) * unit_multiplier
        wall2.position.y = -center * unit_multiplier
        objectBase.add(wall2);
    }
    for(let y=0; y < size+1; y++ ){
        let wall = createWall();
        wall.position.x = center * unit_multiplier
        wall.position.y = (center - y) * unit_multiplier
        objectBase.add(wall);
        let wall2 = createWall();
        wall2.position.x = -center * unit_multiplier
        wall2.position.y = (center - y) * unit_multiplier
        objectBase.add(wall2);
    }
}


function checkForWall(object, map){
    console.log(object.position)
    let size = map.length;
    let center = Math.round(size/2);
    let pos_x = center - 1 + Math.round(object.position.x / unit_multiplier); //Equal to the "column"
    let pos_y = size - center + Math.round(-object.position.y / unit_multiplier); //Equal to the "row"
    
    //This checks if the object is outside of the "map"
    if (pos_y < 0 || 
        pos_x < 0 || 
        pos_y > size-1 ||
        pos_x > size -1 
    )
    {return true;}
    //Returns True if a wall is present
    //Returns False if there is no wall
    return map[pos_y][pos_x] == 1;
}

//Button Functions
const unit_multiplier = 2;

//These functions have been made obsolite with the new dragging system which should be more interactive for users.
window.move_forward = function(distance){
    distance *= unit_multiplier;
    compiler.AddBlocks(Direction.Forward, distance, Type.Translation);
    // let text = distance < 0 ? "Forward" : "Backward";
    // add_command(text,current_command);
};
window.move_strafe = function(distance){
    distance *= unit_multiplier
    compiler.AddBlocks(Direction.Left, distance, Type.Translation);
};
window.move_rotate = function(degrees){
    compiler.AddBlocks(Direction.Clockwise, degrees, Type.Rotation)
}

//These functions can still prove useful
window.compile = function(){
    // compiler.CompileBlocks(document.getElementById("FC_checkbox").checked);
    // console.log(block_dictionary["Compiler"]);
    if (block_dictionary["Compiler"] != undefined){
        block_dictionary["Compiler"].ActivateBlock(model, document.getElementById("FC_checkbox").checked, activeMap);
    }
};
//Delete block is obsolite, as drag and drop can now delete blocks.
// window.deleteBlock = function(){
//     compiler.RemoveBlocks();
// };
window.clearBlocks = function(){
    // compiler.ClearBlocks();//Obsolite method

    //Retrieve a full list of keys to loop through
    const keys = Object.keys(block_dictionary);
    for(let i=0; i < keys.length; i++){
        //Ensures that the key is a valid key of the dictionary (which should be guranteed but this is an extra check)
        if (keys[i] in block_dictionary){
            //Deletes the visualized block object from the screen
            if (block_dictionary[keys[i]].element != undefined){
                block_dictionary[keys[i]].element.remove();
            }
            //Deletes the block object from the internal system that manages all blocks
            delete block_dictionary[keys[i]];
        }
        else{
            console.warn("Tried to delete a key that didn't exist?\nKey:", keys[i]);
        }
    }
    //The counter will be deleted by the previous code, so reassign the counter key-value at the end.
    block_dictionary["counter"] = 0;
}
window.resetObject = function(){
    // compiler.ResetObject();
    model.position.set(0,0,1);
    model.rotation.set(-Math.PI/2, 0 ,0);
}


function rotate_y_axis(factor) {
    let rotation = model.rotation.y;
    rotation += rotationSpeed * factor
    rotation %= Math.PI * 2
    // base.scale.addScalar(rotation);
    // console.log(typeof(base.scale.x));
    // console.log(Number(base.scale.x));
    // model.rotation.y = rotation
}


//Clamp function
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
