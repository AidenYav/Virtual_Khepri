//Import of the custom Block Object
import Block from "./Block.js";
import radians_to_degrees, { degrees_to_radians, clamp } from "./MathFunctions.js";
import MapBuilder , {activeMap, unit_multiplier, worldsCreated, loadMap, activeMapIndex} from "./MapBuilder.js";


console.log("Hello World!");
//Initialize elements that will serve as a base for all event listeners.
const screen = document.getElementById('screen'); // Get a reference to an element
const workspace_area = document.getElementById('workspace_area');
const editor_view_area = document.getElementById('editor_view');
/*if (screen == null){
    console.warn("Could not find screen");
}
else{
    console.log("screen Identified");
}*/

// Create an instance of Hammer with the reference(s)
const hammer = new Hammer(screen); 
const workspace_events = new Hammer(workspace_area);

//Set up the hammer event listeners to enable specific event detections
hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
hammer.get('pinch').set({ enable: true });
workspace_events.get('pan').set({ direction: Hammer.DIRECTION_ALL });

//Objects/constants necessary to build/load the scene
const base = document.getElementById("base").object3D;
const base_no_camera = document.getElementById("base_no_camera").object3D;
const loader = new THREE.GLTFLoader();

//Variables used to track/record the active map and current object model
let no_camera_mode_active = false;
// let activeMap = undefined;
let model = undefined;
let model_no_camera = undefined;
//A dictionary container that will be used to control all blocks currently on screen
let block_dictionary = {counter : 0};

//Loads the saved 3d model used to move.
loader.load( 
    './Models/Pyramid.glb', 

    function ( gltf ) {

        //Model set up
        model = gltf.scene;
        model.name = "robot";
        model.scale.multiplyScalar(0.6);
        model.position.z += 1;
        model.rotation.x -= degrees_to_radians(90);
        model_no_camera = model.clone();
        //Base set up
        base.name = "base";
        // base.add( model );
        base_no_camera.name = "base_no_camera";
        // base_no_camera.add(model_no_camera);
        //World set up
        worldsCreated.push(new MapBuilder(base, model));
        worldsCreated.push(new MapBuilder(base_no_camera, model_no_camera));
        
        // console.log(base_no_camera)
        base_no_camera.visible =  false;
        
    },

    undefined, 

    function ( error ) {
	    console.error( error );
    } 
);

// const web_camera = document.getElementById("camera");


// const scene = screen.object3D

// console.log(scene)
// const scene = document.getElementById("screen").object3D;
// console.log(scene)

//-------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------<Block Dragging Related Code>-----------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

//Initailization of necessary constants
const drag_offset = 20;

const snapThreshold = 10; //in pixels
//Initialization of variables used to temporarily store program states
let last_clicked_block = undefined;
let pan_inprogress = false;
//Event listener loop
workspace_events.on("panleft panright panup pandown panend", function(ev){
    if (!pan_inprogress){

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
        pan_inprogress = false; //Panning is no-longer in progress
        
        //After the draggable is placed, do connection checks
        //Snap check (chains together draggables)
        if (last_clicked_block != undefined){
            // console.log(last_clicked_block.dataset.identifier);
            delete_block_check(last_clicked_block); //Checks if the block should be deleted after being dragged to a delete zone
            snap_blocks(last_clicked_block);
        }

        //After the block is no longer being moved and all final checks are completed, the last_block_data is no longer needed, 
        //so reset it to default to avoid errors or unintended triggers.
        last_clicked_block = undefined; //Clear only at the end
    }
});

/**Checks if the block most recently moved is within range of another block to snap to and chain it together as a program.
 * @param {Object} original The (most recent) block that was moved by the user
 */
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
                block_dictionary[other.dataset.identifier].InsertBlock(block_dictionary[original.dataset.identifier]);
                //Overlap check
                break;
            }
            //Snaps the block to the top of the other one
            else if (Math.abs(originalRect.bottom - otherRect.top) < snapThreshold) {
                original.style.top = otherRect.top - originalRect.height - workspace_area.getBoundingClientRect().top + drag_offset*1.3 + 'px';
                original.style.left = otherRect.left +'px';
                // console.log("Snap Top")
                //Sets the other block to run after the place block is activated
                block_dictionary[original.dataset.identifier].InsertBlock(block_dictionary[other.dataset.identifier]);
                //Overlap check
                break;
            } 

        }
    }
}

/**Checks if the block being moved was previously connected to another block. 
 * @param {Object} original The (most recent) block that was moved by the user
 */
function unsnap_detection(original){
    const draggables = document.querySelectorAll('.draggable');
    block_dictionary[original.dataset.identifier].ClearNextBlock(); //Delete whatever child command was here previously since this block is being moved.
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
                block_dictionary[other.dataset.identifier].ClearNextBlock();
            }
        }
    }
}

/**Deletes blocks that are dragged "out of bounds" of the desired area. If it is inside the outside area, it will be deleted.
 * @param {Object} block The block that was most recently moved, and will be checked if it is "out of bounds".
 */
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

/**Creates a UI object to be dragged.
 * @param {Object} source_block This is a custom html element with specific parameters. Seen on the index.html page and denoted with the "spawner" class
 */
function create_draggable_block(source_block){
    const block = document.createElement("label");
    block.textContent = source_block.textContent;
    block.className = "draggable command selected";
    block.classList.toggle("selected", false);

    let newBlockData = undefined
    if (source_block.dataset.type == "Compiler"){
        //Only 1 "Compiler" should exist at any one time, at least for 1 specific object.
        if ("Compiler" in block_dictionary){
            block_dictionary["Compiler"].element.remove();
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


//-------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------<Interactive Scene Code>-------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------
//This code was mostly to learn/test the capabilities of hammer.js
//However, it does have the function of pinch zooming to increase/decrease the size of the scene (mobile only)

//Initialization of constant values
const rotationSpeed = 0.05; // Adjust as needed
const doubleTapThreshold = 300; // Maximum time (in milliseconds) between taps for double tap
const max_x_rotation = degrees_to_radians(45); //Maximum rotation on the x-axis relative to it's initial start rotation/x_offset
const x_offset = degrees_to_radians(0); //The starting rotation of the object
//Initialization of variables used to record and track program states
let lastTapTime = 0;
let lastRotateTime = 0;
let currentScale = base.scale.x;
//Event loop
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
        if (no_camera_mode_active){
            base_no_camera.scale.set(processedScale, processedScale, processedScale);
        }
        else{
            base.scale.set(processedScale,  processedScale,  processedScale);
        }
    }

    if (ev.type == "pinchend"){
        currentScale = base.scale.x;
        console.log(currentScale);
    }


//     if (ev.type == "tap"){
//         const currentTime = Date.now();
//         if (currentTime - lastTapTime < doubleTapThreshold) {
//             // Double tap detected
//             //console.log('Double tap detected!');
//             // model.position.y += gravity * 0.01
//         } else {
//             // Single tap detected
//             // model.position.y -= gravity * 0.01
//             //console.log('Single tap detected');
//             // console.log(checkForWall(model, activeMap));
//             // console.log(radians_to_degrees(model.rotation.x) +"\n"+ radians_to_degrees(model.rotation.y) +"\n"+ radians_to_degrees(model.rotation.z))
//         }
//         // console.log(currentTime - lastTapTime)
//         lastTapTime = currentTime;
//    }

    if (ev.type == "tap"){
        console.log(radians_to_degrees(base_no_camera.rotation.y));
    }
    
    if ((ev.type == "swipe" || ev.type.startsWith("pan"))){
        // const currentTime = Date.now()
        // if (currentTime - lastRotateTime < 10){
            
            switch(ev.direction){
                case Hammer.DIRECTION_LEFT:
                    rotate_y_axis(-1);
                    break;
                case Hammer.DIRECTION_RIGHT:
                    rotate_y_axis(1);
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
        // }
        // lastRotateTime = currentTime;
    }
    
    
});

function rotate_x_axis(factor) {
    // let y_rotation = Math.abs(radians_to_degrees(model.rotation.y));
    // console.log(y_rotation % 180)
    // factor *= y_rotation % 360 < 180 ?  1 : -1;
        
    if (no_camera_mode_active){
        base_no_camera.rotation.x = clamp(base_no_camera.rotation.x + rotationSpeed * factor, 
            x_offset - max_x_rotation, 
            x_offset + max_x_rotation)
    }
    else{
        base.rotation.x += rotationSpeed * factor;
    }
    
}

function rotate_y_axis(factor) {
    let rotation = model.rotation.y;
    rotation += rotationSpeed * factor;
    // rotation %= Math.PI * 2
    // base.scale.addScalar(rotation);
    // console.log(typeof(base.scale.x));
    // console.log(Number(base.scale.x));
    if (no_camera_mode_active){
        base_no_camera.rotation.y += rotationSpeed * factor;
    }
    else{
        base.rotation.z += rotationSpeed * factor;
    }
}




/*Moved/integrated into Block.js
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
*/


/*These functions have been made obsolite
//with the new dragging system which should be more interactive for users.

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
//Delete block is obsolite, as drag and drop can now delete blocks.
window.deleteBlock = function(){
    compiler.RemoveBlocks();
};
*/


//-------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------<HTML Button Functions>--------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------
//Simply runs the program when clicked.
//These functions can still prove useful
window.compile = function(){
    // compiler.CompileBlocks(document.getElementById("FC_checkbox").checked);
    // console.log(block_dictionary["Compiler"]);
    if (block_dictionary["Compiler"] != undefined){
        block_dictionary["Compiler"].ActivateBlock(model, document.getElementById("FC_checkbox").checked, activeMap);
        block_dictionary["Compiler"].ActivateBlock(model_no_camera, document.getElementById("FC_checkbox").checked, activeMap);
    }
};
//Clears all blocks from the workspace and from the 
//internal system that controls all the blocks
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
//Resets both objects
window.resetObject = function(){
    // compiler.ResetObject();
    loadMap(activeMapIndex)
    
    // model.position.set(0,0,1);
    // model.rotation.set(-Math.PI/2, 0 ,0);

    // model_no_camera.position.set(0,0,1);
    // model_no_camera.rotation.set(-Math.PI/2, 0 ,0);
}
// window.toggleCamera = function(){
//     const video = document.querySelector('video');

//     if (video.srcObject) {
//         // Stop all video tracks
//         video.srcObject.getTracks().forEach(track => track.stop());
//         video.srcObject = null;
//         no_camera_mode_active = true;

//         base_no_camera.visible = true;
//         base.visible = false;
        

//       } else {
//         // Restart the camera
//         navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
//           video.srcObject = stream;
//           no_camera_mode_active = false;
            
//           base_no_camera.visible = false;
//           base.visible = true;

//         });
//     }
// }
// window.switchCamera = function(){
//     const devices = navigator.mediaDevices.enumerateDevices();
//     const videoDevices = devices.filter(device => device.kind === 'videoinput');
//     if (videoDevices.length < 2) {
//         return;
//     }   

//     const newDeviceId = videoDevices.find(device => device.deviceId !== currentDeviceId)?.deviceId;
//     if (newDeviceId) {
//         startCamera(newDeviceId);
//     }
// }

//Create some global variables for the camera

let video = null;
let currentStream = null;
let currentDeviceId = null;

// Function to start the camera
async function startCamera(deviceId) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  
  const constraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  currentStream = stream;
  currentDeviceId = deviceId;
  no_camera_mode_active = false;
  base_no_camera.visible = false;
  base.visible = true;
}

// Function to stop the camera
function stopCamera(newCurrentStream) {
  if (newCurrentStream) {
    newCurrentStream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    currentStream = null;
    currentDeviceId = null;
    no_camera_mode_active = true;
    base_no_camera.visible = true;
    base.visible = false;
  }
}

// Function to toggle between available cameras
async function switchCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  
  if (videoDevices.length < 2) {
    return;
  }

  const newDeviceId = videoDevices.find(device => device.deviceId !== currentDeviceId)?.deviceId;
  if (newDeviceId) {
    await startCamera(newDeviceId);
    }
}

window.toggleCamera = function(){
    video = document.querySelector('video');
    let newCurrentStream = currentStream == null ? video.srcObject : currentStream;
    if (video.srcObject != null){
        stopCamera(newCurrentStream);
        console.log("stop");
    }
    else{
        startCamera();
        console.log("start");
    }
}

window.switchCam = function(){
    video = document.querySelector('video');
    switchCamera();
}

// window.zoom = function(scalar){

//     if (no_camera_mode_active){
        
//     }
//     else{

//     }
// }