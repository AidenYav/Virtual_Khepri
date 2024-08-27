//Enum Typings
export const Direction = {
    Forward: 'Forward',
    Left: 'Left',
    Clockwise : 'Clockwise'
};
export const Type = {
    Translation: 'Translation',
    Rotation: 'Rotation',
    Compiler: 'Compiler'
}

/* Program states currently have no effect, but may be implemented in the future...?
const State = {
    Idle: 'Idle',
    Running: 'Running',
    Crashed: 'Crashed',
}
let ProgramState = State.Idle;
*/

//Unit multiplier - MUST MATCH Event Handler unit multiplier.
const unit_multiplier = 2;

//-------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------<Block Compiler Class>-------------------------------------------------------------
//---------------------------------------------------------------<Unused>--------------------------------------------------------------------
/*Class object for a compiled version of blocks
//Unforunately, this entire class has been made obsolite by the recent update that makes
//Blocks compile on a Linked List system rather than using an array of all compiled blocks.

export class BlockCompiler{

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
            // console.log(ProgramState);
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
                // console.log("Finished Moving");
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
*/

//-------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------<Block Class>------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

//Class object for block commands 
export default class Block{
    
    /** Constructor for the Block object.
     * @param {String} direction A Direction Enum that determines the axis the object should be moved
     * @param {number} magnitude Typically an integer (mostly 1) that determines how many units the object should move.
     * @param {String} type      A Type Enum that describes the type of movement/animation that should be played (Technically obsolite) 
     * @param {Object} UI        The html element object related to this block code
     */
    constructor(direction, magnitude, type, UI) {
        this.direction = direction; // Direction to be moved
        this.magnitude = magnitude; // Distance to be moved
        this.type = type; //Type of movement
        this.element = UI; //UI Element related to the program block
        this.nextBlock = undefined; //This will work as a pointer to the next command block (Linked List Style)
    }

    /**Activates the premade block program to translate or rotate the object
     * @param {object3D} object                 A passed 3D object to move.
     * @param {boolean} [field_centric = true]  A boolean that determines if the object should move relative to it's own 
     *                                          orientation or from the camera's orientation. Defaults to true.
     * @param {Array[int][int]} map             A 2d array containing the "map" used to build obstacle.
     * @returns {undefined}                     Does not return anything.
     */
    ActivateBlock(object, field_centric = true, map){
        if (this.type === Type.Compiler && this.nextBlock != undefined){
            this.nextBlock.ActivateBlock(object, field_centric, map);
            return;
        }
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
            // console.log("Hit obsticle")
            requestAnimationFrame(anim_hitWall);
        }
        else{
            //The activation of the block will result in an animation, so default call here
            requestAnimationFrame(anim_translate);
        }

        //Set a cooldown/timer to play the animations
        const self = this; //Since this function would not have access to the "this" keyword, use the variable "self" to reference the Block Object
        this.HighlightBlock(true); //Highlights the current block
        //This timeout function acts as a buffer so this block's animation can be completed before running the next block animation.
        setTimeout( function(){

            self.HighlightBlock(false); //Before activating the next block (or ending the sequence), deactivate the current block's highlight

            //If the next block exists, run that block's program/animation
            if(self.nextBlock != undefined){
                self.nextBlock.ActivateBlock(object, field_centric, map);
            }
            //If the next block in the sequence is "undefined", this means the sequence has come to an end
            // else{
            //     // ProgramState = State.Idle;
            //     // console.log("Finished Moving");
            // }
        }
        , animation_duration + animation_delay);
    }

    /** Determines of the passed position intersects with a wall.
     * @param {Object}         position    The position of the object, typically a Vector2 object is passed as the position parameter
     * @param {Array[int][int]} map         A 2d integer array of values used to build the active "map" that the user navigates through
     * @returns 
     */
    checkForWall(position, map){
        // console.log(position);
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
    /* Obsolite animation code
    TranslateBlock(object){
        if (this.direction === Direction.Forward){
            setUpAnimCache(object,"z", this.magnitude);
            
        }
        else if (this.direction === Direction.Left){
            setUpAnimCache(object,"x", this.magnitude);
        }
        else{
            console.warn("Tried to translate object in the " + this.direction + " direction!");
            return;
        }
        requestAnimationFrame(anim_translate);
    }


    RotateBlock(object) {
        if (this.direction === Direction.Clockwise){
            // object.rotation.y += degrees_to_radians(this.magnitude);
            setUpAnimCache(object, "y", this.magnitude);
        }
        else{
            console.warn("Tried to rotate object in the " + this.direction + " direction!")
        }
        requestAnimationFrame(anim_translate);
    }
    */
    

    /** Sets the next block that should be linked/activated after this block
     * @param {Block} new_block The Block object that will be the next
     * @returns {None} Returns nothing, simply returns to end the function early.
     */
    InsertBlock(new_block){
        if (new_block == undefined){
            return;
        }
        new_block.InsertBlock(this.new_block); //Inserts the previous next_block as the next_block for this new_block
        this.nextBlock = new_block; //Sets this new_block as the current next_block
    }
    
    /** Simply clears the nextBlock variable by setting it to undefined.
     */
    ClearNextBlock(){
        this.nextBlock = undefined;
    }

    /** Toggles the element's "selected" class, which creates a highlight effect on that block when active.
     * @param {Boolean} toggle To toggle the highlight element
     */
    HighlightBlock(toggle){
        this.element.classList.toggle("selected", toggle);
    }

    //A helper function to print out the data related to the block. It's not strictly 
    //needed since web-browsers are typically capable of printing objects into the console.
    toString(){
        return "[ Direction : " + this.direction + " , Magnitude: " + this.magnitude + " , Type : " + this.type + " ]";
    }
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------<Animation Code>-----------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

//Delay constants
const animation_duration = 500; //ms - Duration of each translation/rotation.
const animation_delay = 50; //ms - Delay between each block activating. Neccessary from having animations overlap and causing buggy animations
//Some variables used to track the progression of the program/animation
let start;
let anim_complete = false;

//Enums of different animation progression rates
const AnimationTypes = {
    Linear: "Linear",
    Parabolic: "Parabolic",
    Inverse_Parabolic : "I-Parabolic",
    Circle: "Circle",
    S_Circle: "S-Circle"
}

//Storage related to information about the animation requirements (since parameters cannot be used)
const anim_cache = {
    axis : 'z',
    distance : new THREE.Vector3(0,0,0),//{ "x" : 0 , "y" : 0 , "z": 0},
    model : undefined,
    field_centric : true,
    start_pos : new THREE.Vector3(0,0,0)//{ "x" : 0 , "y" : 0 , "z": 0}
}

/** A function for easily editing the animation cache
 * This was neccessary due to the inability to pass extra parameters when calling the requestAnimationFrame() built in function.
 * @param {Object}  model           The passed object that will be moved when the animation is played.
 * @param {String}  axis            The directional axis the object will move.
 * @param {number}  distance        The distance the robot will travel (Multiplied with unit multiplier to be in units visualized in the screen).
 * @param {boolean} field_centric   Whether or not the robot should take into account it's own rotation when moving.
 */
function setUpAnimCache(model, axis, distance, field_centric = true){
    // console.log(model, axis, distance);
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
/** This function will take the anim_cache information to create the animation effect in conjunction with requestAnimationFrame().
 * @param {number} timeStamp The time in miliseconds in which this function was called.
 */
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

/** A special animation played when colliding with a wall
 * @param {number} timeStamp The time in miliseconds in which this function was called.
 */
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


//-------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------<Math Functions>-----------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

/** Converts radian values into degrees
 * @param {number} radians 
 * @returns {number} The converted value in degrees
 */
export function radians_to_degrees(radians) {
    return radians * (180 / Math.PI) % 360;
}

/** Converts degrees into radian values
 * @param {number} degrees
 * @returns {number} The converted value in radians
 */
export function degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}