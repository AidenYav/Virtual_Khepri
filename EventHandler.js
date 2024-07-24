import BlockCompiler, { Direction, Type, degrees_to_radians, radians_to_degrees } from "./Block.js";

console.log("Hello World!")
// import * as Hammer from './node_modules/hammerjs/hammer.js';
const screen = document.getElementById('screen'); // Get a reference to an element
if (screen == null){
    console.log("Could not find screen")
}
else{
    console.log("screen Identified")
}
const hammer = new Hammer(screen); // Create an instance of Hammer with the reference
// console.log("Hello World!")
hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

const model = document.getElementById("model")
const rotationSpeed = 0.0001; // Adjust as needed
const gravity = 9.8 //meters per second
const doubleTapThreshold = 300; // Maximum time (in milliseconds) between taps for double tap
const max_x_rotation = degrees_to_radians(45); 
const x_offset = 0 //degrees_to_radians(-90);
let lastTapTime = 0;
let lastRotateTime = 0;

// listen to events...
hammer.on("panleft panright panup pandown tap press", function(ev) {
    //console.log(ev.type +" gesture detected.");

    if (ev.type == "tap"){
        const currentTime = Date.now();
        if (currentTime - lastTapTime < doubleTapThreshold) {
            // Double tap detected
            //console.log('Double tap detected!');
            // model.object3D.position.y += gravity * 0.01
        } else {
            // Single tap detected
            // model.object3D.position.y -= gravity * 0.01
            //console.log('Single tap detected!');
            console.log(radians_to_degrees(model.object3D.rotation.x) +"\n"+ radians_to_degrees(model.object3D.rotation.y) +"\n"+ radians_to_degrees(model.object3D.rotation.z))
        }
        // console.log(currentTime - lastTapTime)
        lastTapTime = currentTime;
        
   }

   

   hammer.on("swipe pan", (ev) =>{
    const currentTime = Date.now()
    if (currentTime - lastRotateTime < 10){
        
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
    }
    lastRotateTime = currentTime;
    })
    
    
});

function rotate_x_axis(factor) {
    let y_rotation = Math.abs(radians_to_degrees(model.object3D.rotation.y));
    // console.log(y_rotation % 180)
    factor *= y_rotation % 360 < 180 ?  1 : -1;
        
    model.object3D.rotation.x = clamp(model.object3D.rotation.x + rotationSpeed * factor, 
        x_offset - max_x_rotation, 
        x_offset + max_x_rotation)
}


const compiler = new BlockCompiler(model,document.getElementById("command_list"));

const unit_multiplier = 0.3
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


window.compile = function(){
    compiler.CompileBlocks(document.getElementById("FC_checkbox").checked);
};
window.deleteBlock = function(){
    compiler.RemoveBlocks();
};

window.clearBlocks = function(){
    compiler.ClearBlocks();
}
window.resetObject = function(){
    compiler.ResetObject();
}


// const command_list = document.getElementById("command_list");
// let current_command = document.getElementById("start").parentNode;
// function add_command(text, referenceElement){
    
//     //Creates a new label
//     var newLabel = document.createElement("label");
//     newLabel.className = "command selected";
//     newLabel.textContent = text;
    
//     //Wraps the label in a list object
//     var newListItem = document.createElement("li");
//     newListItem.appendChild(newLabel);

//     //Place the element in the list
//     referenceElement.insertAdjacentElement("afterend",newListItem);

//     current_command.firstChild.classList.toggle("selected", false);
//     console.log(current_command.firstChild.classList)
//     current_command = newListItem;
    
    
//     console.log(command_list.childElementCount);

// }



function rotate_y_axis(factor) {
    let rotation = model.object3D.rotation.y;
    rotation += rotationSpeed * factor
    rotation %= Math.PI * 2
    model.object3D.rotation.y = rotation
}


//Clamp function
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
