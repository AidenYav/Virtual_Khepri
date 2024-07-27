// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import BlockCompiler, { Direction, Type, degrees_to_radians, radians_to_degrees } from "./Block.js";


console.log("Hello World!")
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

// const model = document.getElementById("model");

const base = document.getElementById("base").object3D;

const loader = new THREE.GLTFLoader();
let activeMap = undefined;
let model = undefined;
let compiler = undefined;
loader.load( './Models/Pyramid.glb', function ( gltf ) {

    model = gltf.scene;
    model.name = "robot"
    model.scale.multiplyScalar(0.6);
    model.position.z += 1;
    base.name = "base"
	base.add( model );
    model.rotation.x -= degrees_to_radians(90);
    compiler = new BlockCompiler(model,document.getElementById("command_list"));
    temp();

}, undefined, function ( error ) {

	console.error( error );

} );

// const web_camera = document.getElementById("camera");


// const scene = screen.object3D

// console.log(scene)
const scene = document.getElementById("screen").object3D;
// console.log(scene)

function temp() {
    activeMap = [   [ 0 , 0 , 0 , 0 , 0 ],
                    [ 1 , 1 , 1 , 1 , 0 ],
                    [ 0 , 0 , 0 , 1 , 0 ],
                    [ 0 , 1 , 1 , 1 , 0 ],
                    [ 0 , 0 , 0 , 0 , 0 ] 
                ]
    buildMap(activeMap, base)
    const geo = new THREE.IcosahedronGeometry(1.0, 2);
    const cube = new THREE.BoxGeometry(2,2,2,2,2,2);

    const mat = new THREE.MeshBasicMaterial({
        color: 0xccff
    })
    const wireMat = new THREE.MeshBasicMaterial({
        color : 0xffffff,
        wireframe: true
    })
    model.add(new THREE.Mesh(cube, wireMat));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.material = wireMat

    const planeGeo = new THREE.PlaneGeometry( 10, 10 , 5, 5);
    const material = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide, transparent : true, opacity : 0.5} );
    // const wallMat = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent : false, opacity: 0.5})
    const wireframe = new THREE.WireframeGeometry( planeGeo );
    const line = new THREE.LineSegments( wireframe );

    const plane = new THREE.Mesh( planeGeo, material );
    plane.add(line)
    plane.name = "plane"
    base.add( plane );
    plane.position.z -= 1;
    
    // const wall = new THREE.Mesh(cube, wallMat)
    // wall.name = "wall"
    // base.add(wall);
    // wall.position.x += 4


    var hitbox1 = new THREE.Box3().setFromObject(model);
    var hitbox2 = new THREE.Box3().setFromObject(plane);
    console.log(hitbox1.intersectsBox(hitbox2));
    console.log(hitbox1, hitbox2)

    // Calculate dimensions of the bounding box
    const dimensions = new THREE.Vector3().subVectors(hitbox1.max, hitbox1.min);
    
    console.log(dimensions);
    const hitboxVisual = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
    const hit = new THREE.Mesh(hitboxVisual, material);
    model.add(hit);

    console.log(base);
}


const rotationSpeed = 0.0001; // Adjust as needed
const gravity = 9.8 //meters per second
const doubleTapThreshold = 300; // Maximum time (in milliseconds) between taps for double tap
const max_x_rotation = degrees_to_radians(45); 
const x_offset = degrees_to_radians(-90);
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
    let rotation = model.rotation.y;
    rotation += rotationSpeed * factor
    rotation %= Math.PI * 2
    // model.rotation.y = rotation
}


//Clamp function
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
