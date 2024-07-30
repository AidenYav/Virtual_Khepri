
//Enum Typings
export const Direction = {
    Forward: 'Forward',
    Left: 'Left',
    Clockwise : 'Clockwise'
};
export const Type = {
    Translation: 'Translation',
    Rotation: 'Rotation'
}

const State = {
    Idle: 'Idle',
    Running: 'Running',
    Crashed: 'Crashed',
}

const unit_multiplier = 2;
let ProgramState = State.Idle;

//Class object for a compiled version of blocks
export default class BlockCompiler{

    //------------------------------------------------------------Core functions for program-----------------------------------------------------------
    constructor(object, list, map){
        this.queue = [];
        this.object = object;
        this.command_list =  list;
        this.selectedIndex = 0; //This starts at 0, but
        this.activeMap = map;
        // console.log(this.object3D)
    }

    AddBlocks(direction, magnitude, type){
        //Adds the block command to the "queue" which is what actually runs the program
        this.queue.splice(this.selectedIndex, 0, new Block(direction, magnitude, type));

        //Adds UI elements for visualization of program.
        //This is isolated from the actual program running
        this.add_ui(this.block_text(direction,magnitude),this.command_list.children[this.selectedIndex]);

        //Increments the selected index counter and adds a visual effect to mark the current element
        this.highlightElement(this.selectedIndex + 1);
    }

    RemoveBlocks(){
        //Defensive check, index should not be less than 1
        if (this.selectedIndex < 1){return;}
        this.queue.splice(this.selectedIndex - 1, 1);
        this.command_list.children[this.selectedIndex].remove();
        this.highlightElement(this.selectedIndex  - 1);

    }
    
    CompileBlocks(field_centric = true){
        //If the program state is running or crashed, cannot run any other block code until the program is finished
        if (ProgramState != State.Idle) {
            console.log(ProgramState);
            return;
        }
        
        //Sets the program state to running
        ProgramState = State.Running;
        for(let i=0; i<this.queue.length; i++){
            //Necessary for scopes for some reason
            let self = this;
            //Schedules the execution order of blocks
            //Each block is set to be animated in sequential order
            setTimeout(
                function(){
                    self.highlightElement(i+1);
                    self.queue[i].ActivateBlock(self.object,field_centric, self.activeMap);
                }, 
            (animation_duration + animation_delay)*i);
        }
        setTimeout(
            function(){
                ProgramState = State.Idle;
                console.log("Finished Moving");
            },
            (animation_duration + animation_delay) * this.queue.length
        )
    }

    ClearBlocks(){
        //Clears block program
        this.queue = [];
        this.selectedIndex = 0;
        //Clears UI assoiated with blocks
        for(let i=1; i < this.command_list.children.length - 1; i++){
            this.command_list.children[i].remove();
            i--;
        }
    }

    ResetObject(){
        this.object.position.set(0,0,1);
        this.object.rotation.set(-Math.PI/2, 0 ,0);
    }

    SetMap(map){
        this.activeMap = map;
    }

    //--------------------------------------------Helper functions for effects and UI-----------------------------------------------------

    add_ui(text, referenceElement){
        //Creates a new label
        var newLabel = document.createElement("label");
        newLabel.className = "command selected";
        newLabel.textContent = text;
        newLabel.onclick = () => {
            this.highlightElement(this.find_element_index(this.command_list, newLabel));
        };
        
        //Wraps the label in a list object
        var newListItem = document.createElement("li");
        newListItem.appendChild(newLabel);
    
        //Place the element in the list
        referenceElement.insertAdjacentElement("afterend",newListItem);
        //Disables previous index's selected highlight
        // this.command_list.children[this.selectedIndex].firstChild.classList.toggle("selected", false);
    }

    find_element_index(parent, target){
        const list = parent.children;
        for(let i=1; i < list.length; i++){
            if (list[i].firstChild === target){
                return i;
            }
        }
        console.warn("Element could not be found!");
        return -1;
    }

    highlightElement(idx){
        //idx should not be less than 1 since index 1 is the start UI, which cannot/should not be changed and will not be highlighted.
        if (idx < 1){ return;}
        //Removes previous index highlight
        this.command_list.children[this.selectedIndex].firstChild.classList.toggle("selected", false);
        //Sets highlight to new element
        this.selectedIndex = idx;
        this.command_list.children[idx].firstChild.classList.toggle("selected", true);

        // console.log("Index at: " + idx);
    }

    block_text(direction,magnitude){
        let ui_text = "Unknown";
        switch (direction){
            case Direction.Forward:
                ui_text = magnitude > 0 ? "Forward" : "Backward";
                break;
            case Direction.Left:
                ui_text = magnitude < 0 ? "Left" : "Right";
                break;
            case Direction.Clockwise:
                ui_text = magnitude > 0 ? "Turn Right" : "Turn Left";
                break;
            default:
                break;
        }
        return ui_text;
    }

}



//Class object for block commands 
class Block{
    

    constructor(direction, magnitude, type, UI) {
        this.direction = direction; // Direction to be moved
        this.magnitude = magnitude; // Distance to be moved
        this.type = type; //Type of movement
        this.element = UI; //UI Element related to the program block
    }

    /**
     * Activates the premade block program to translate or rotate the object
     * @param {object3D} object                 A passed 3D object to move.
     * @param {boolean} [field_centric = true]  A boolean that determines if the object should move relative to it's own 
     *                                          orientation or from the camera's orientation. Defaults to true.
     * @param {Array[int][int]} map             A 2d array containing the "map" used to build obstacle.
     * @returns {undefined}                     Does not return anything.
     */
    ActivateBlock(object, field_centric = true, map){
        //Forward drive set up
        if (this.direction === Direction.Forward){
            setUpAnimCache(object,"z", this.magnitude, field_centric);
        }

        //Strafe set up
        else if (this.direction === Direction.Left){
            setUpAnimCache(object,"x", this.magnitude, field_centric);
        }

        //Rotation set up
        else if (this.direction === Direction.Clockwise){
            // object.rotation.y += degrees_to_radians(this.magnitude);
            setUpAnimCache(object, "y", this.magnitude);
        }

        //Default warning should the block be improperly initialized
        else{
            console.warn("Tried to activate block of " + this.type + " type!");
            return;
        }
        
        //Checks if the robot would collide with a "wall"
        if (this.checkForWall( object.position.clone().add(new THREE.Vector3(anim_cache.distance.x, anim_cache.distance.z, 0)) ,map)){
            console.log("Hit obsticle")
            requestAnimationFrame(anim_hitWall);
        }
        else{
            //The activation of the block will result in an animation, so default call here
            requestAnimationFrame(anim_translate);
        }
    }

    checkForWall(position, map){
        console.log(position);
        let size = map.length;
        let center = Math.round(size/2);
        let pos_x = center - 1 + Math.round(position.x / unit_multiplier); //Equal to the "column"
        let pos_y = size - center + Math.round(-position.y / unit_multiplier); //Equal to the "row"
        
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

    // TranslateBlock(object){
    //     if (this.direction === Direction.Forward){
    //         setUpAnimCache(object,"z", this.magnitude);
            
    //     }
    //     else if (this.direction === Direction.Left){
    //         setUpAnimCache(object,"x", this.magnitude);
    //     }
    //     else{
    //         console.warn("Tried to translate object in the " + this.direction + " direction!");
    //         return;
    //     }
    //     requestAnimationFrame(anim_translate);
    // }


    // RotateBlock(object) {
    //     if (this.direction === Direction.Clockwise){
    //         // object.rotation.y += degrees_to_radians(this.magnitude);
    //         setUpAnimCache(object, "y", this.magnitude);
    //     }
    //     else{
    //         console.warn("Tried to rotate object in the " + this.direction + " direction!")
    //     }
    //     requestAnimationFrame(anim_translate);
    // }
}



const animation_duration = 500; //ms - Duration of each translation/rotation.
const animation_delay = 50; //ms - Delay between each block activating. Neccessary from having animations overlap and causing buggy animations
let start;
let anim_complete = false;


//Storage related to information about the animation requirements (since parameters cannot be used)
const anim_cache = {
    axis : 'z',
    distance : new THREE.Vector3(0,0,0),//{ "x" : 0 , "y" : 0 , "z": 0},
    model : undefined,
    field_centric : true,
    start_pos : new THREE.Vector3(0,0,0)//{ "x" : 0 , "y" : 0 , "z": 0}
    
}

//A function for easily editing the animation cache
function setUpAnimCache(model, axis, distance, field_centric = true){
    anim_cache.model = model;
    anim_cache.axis = axis;
    anim_cache.field_centric = field_centric;

    
    //Manipulate distance into x and z components if field centric
    // console.log(!field_centric,axis != "y");

   //This math is only necesary for translation movements while field_centric is turned off
    if (!field_centric && axis != "y"){
        let rotation_offset = 0;
        //This just sets "otherAxis" to the opposing axis. [axis = x, otherAxis = z] or [axis = z, otherAxis = x]
        let otherAxis = axis == "x" ? "z" : "x";
        //When strafing, the directions are inverted. To avoid conflict with FC code, simply invert the direction here
        let strafe = axis == "x" ? -1 : 1;

        //Calculate the distance for the primary axis
        anim_cache.distance[axis] = distance * Math.cos(model.rotation.y + rotation_offset);
        //Calculate the opposite axis
        anim_cache.distance[otherAxis] = strafe * distance * Math.sin(model.rotation.y  + rotation_offset);


        // console.log(axis, anim_cache.distance[axis], otherAxis, anim_cache.distance[otherAxis]);
    }
    else{
        anim_cache.distance["x"] = 0;
        anim_cache.distance["z"] = 0;
        anim_cache.distance[axis] = distance;
    }
    
    
    //Automatically configure the starting point used by the animator
    if (axis == "x" || axis == "z"){
        anim_cache.start_pos["x"] = model.position.x;
        anim_cache.start_pos["z"] = model.position.y;
        
    }
    else if (axis == "y"){
        anim_cache.start_pos["y"] = model.rotation.y;
    }
    else{
        console.warn("Invalid axis definition as: " + axis);
    }
}

//Function for the animation related to object translation
function anim_translate(timeStamp){
    //This is the first call of the wrapper?
    if (start === undefined) {
        start = timeStamp;
    }

    //Calculate progress on animation based on time passed
    const elapsed = timeStamp - start;
    //This completion rate can be manipulated to mimic de/acceleration
    const completion_rate = animation_rates(AnimationTypes.S_Circle, elapsed/animation_duration);
    //For movement Translation (Forward, Backward, Left, and Right)
    if (anim_cache.axis == "x" || anim_cache.axis == "z"){
        anim_cache.model.position.x = anim_cache.start_pos["x"] + anim_cache.distance["x"] * completion_rate;
        anim_cache.model.position.y = anim_cache.start_pos["z"] + anim_cache.distance["z"] * completion_rate;
    }
    //For Left and Right Rotation
    else if (anim_cache.axis == "y"){
        anim_cache.model.rotation.y = anim_cache.start_pos["y"] + degrees_to_radians(anim_cache.distance["y"]) * completion_rate;
    }
    
    //Should the elapsed time go over the animation duration, end the sequence
    if (elapsed < animation_duration && !anim_complete){
        requestAnimationFrame(anim_translate);
    }
    else{
        start = undefined;
    }
}

function anim_hitWall(timeStamp){
    //This is the first call of the wrapper?
    if (start === undefined) {
        start = timeStamp;
    }

    //Calculate progress on animation based on time passed
    const elapsed = (timeStamp - start);
    //This completion rate can be manipulated in the future to mimic de/acceleration
    let amplitude = 0.1; //Modifier to mimic hitting a wall
    //Sine type rate
    const completion_rate = Math.min( -amplitude * Math.sin(2 * Math.PI * (elapsed/animation_duration) + Math.PI/2)  + amplitude, 1);

    //For Left and Right Translation
    if (anim_cache.axis == "x" || anim_cache.axis == "z"){
        anim_cache.model.position.x = anim_cache.start_pos["x"] + anim_cache.distance["x"] * completion_rate;
        anim_cache.model.position.y = anim_cache.start_pos["z"] + anim_cache.distance["z"] * completion_rate;
    }

    //Should the elapsed time go over the animation duration, end the sequence
    if (elapsed < animation_duration && !anim_complete){
        requestAnimationFrame(anim_hitWall);
        
    }
    else{
        
        start = undefined;
    }
}

const AnimationTypes = {
    Linear: "Linear",
    Parabolic: "Parabolic",
    Inverse_Parabolic : "I-Parabolic",
    Circle: "Circle",
    S_Circle: "S-Circle"
}
/** Manipulates the inputted animation completion rate and returns
 * a corresponding multiplier for the desired animation.
 * @param {AnimationType} type   A Pre-defined type of animation. 
 *                                  In math terms, this is f() in f(x).
 * @param {float} rate           A value between [0,1] representing how close the animation should be close to completion 
 *                                  In math terms, this is x in f(x).
 * @returns {float}              Returns the manipulated multiplier
 *                                  In math terms, this is f(x) or y.
 */
function animation_rates(type, rate){
    let val = rate;
    switch(type){
        //Simple linear rate 
        case (AnimationTypes.Linear): //(organizational placeholder)
            //Default is the linear rate, so nothing needs to happen
            break;
        //Uses a quadratic
        case (AnimationTypes.Parabolic):
            val =  Math.pow(rate , 2 ); 
            break;
        //Uses a negative quadratic
        case (AnimationTypes.Inverse_Parabolic):
            val = -(elapsed / animation_duration) * (rate - 2); 
            break;
        //Uses a semi-circle (top half) 
        case (AnimationTypes.Circle):
            val = Math.sqrt(1 - Math.pow(rate - 1 , 2 ));
            break;
        //Sort of a piece-wise function using the upper and lower half of a circle
        case (AnimationTypes.S_Circle):
            //Lower semi-circle
            if (rate < 0.5){
                val = -Math.sqrt(0.25 - Math.pow(rate, 2)) + 0.5;
            }
            //Upper semi-circle
            else{
                val = Math.sqrt(0.25 - Math.pow(rate - 1, 2)) + 0.5;
            }
            break;
        //Default is already set
        default:
            console.warn(type,"Animation type was not found. Please check that you are using the AnimationTypes Enum or spelling the types correctly.");
            break;
    }

    return Math.max(Math.min(val, 1), 0);

}



export function radians_to_degrees(radians) {
    return radians * (180 / Math.PI) % 360;
}

export function degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}