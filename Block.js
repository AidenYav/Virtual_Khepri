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

//Class object for a compiled version of blocks
export default class BlockCompiler{

    //------------------------------------------------------------Core functions for program-----------------------------------------------------------
    constructor(object, list){
        this.queue = [];
        this.object = object;
        this.command_list =  list;
        this.selectedIndex = 0; //This starts at 0, but
        
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

        for(let i=0; i<this.queue.length; i++){
            //Necessary for scopes for some reason
            let self = this;
            //Schedules the execution order of blocks
            //Each block is set to be animated in sequential order
            setTimeout(
                function(){
                    self.highlightElement(i+1);
                    self.queue[i].ActivateBlock(self.object,field_centric);
                }, 
            (animation_duration + 50)*i);
        }
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
        this.object.position.set(0,0,0);
        this.object.rotation.set(-Math.PI/2, 0 ,0);
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
        console.warn("Element could not be found!")
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
        let ui_text = "Unknown"
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
     * @returns {undefined}                     Does not return anything.
     */
    ActivateBlock(object, field_centric = true){
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

        //The activation of the block will result in an animation, so default call here
        requestAnimationFrame(anim_translate);
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
    distance : { "x" : 0 , "y" : 0 , "z": 0},
    model : undefined,
    field_centric : true,
    start_pos : { "x" : 0 , "y" : 0 , "z": 0}
    
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
    //This completion rate can be manipulated in the future to mimic de/acceleration
    //Currently this is a linear rate
    const completion_rate = Math.min(elapsed / animation_duration, 1); 
    
    // if (!field_centric){}
    //For Left and Right Translation
    if (anim_cache.axis == "x" || anim_cache.axis == "z"){
        anim_cache.model.position.x = anim_cache.start_pos["x"] + anim_cache.distance["x"] * completion_rate;
        anim_cache.model.position.y = anim_cache.start_pos["z"] + anim_cache.distance["z"] * completion_rate;
    }
    //For Left and Right Rotation
    else if (anim_cache.axis == "y"){
        anim_cache.model.rotation.y = anim_cache.start_pos["y"] + degrees_to_radians(anim_cache.distance["y"]) * completion_rate;
    }
    // //For Forward and Backward Translation
    // else if (anim_cache.axis == "z"){
    //     anim_cache.model.position.z = anim_cache.start_pos["z"] + anim_cache.distance * completion_rate;
    // }
    
    //Should the elapsed time go over the animation duration, end the sequence
    if (elapsed < animation_duration && !anim_complete){
        requestAnimationFrame(anim_translate);
    }
    else{
        start = undefined;
    }

}



export function radians_to_degrees(radians) {
    return radians * (180 / Math.PI) % 360;
}

export function degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}