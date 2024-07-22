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

//Class object for a compiled version of blocks
export default class BlockCompiler{

    constructor(object){
        this.queue = [];
        this.object = object.object3D
        // console.log(this.object3D)
    }

    AddBlocks(direction, magnitude, type){
        this.queue.push(new Block(direction, magnitude, type));
    }

    RemoveBlocks(){
        this.queue.pop();
    }

    CompileBlocks(){
        let LastRunTime = Date.now();
        for(let i=0; i<this.queue.length; i++){
            //Necessary for scopes for some reason
            let block = this.queue[i];
            let object = this.object
            //Schedules the execution order of blocks
            //Each block is set to be animated in sequential order
            setTimeout(
                function(){
                    block.ActivateBlock(object);
                }, 
            animation_duration*i + 10);
        }
    }
}



//Class object for block commands 
class Block{
    

    constructor(direction, magnitude, type) {
        this.direction = direction; // Direction to be moved
        this.magnitude = magnitude; // Distance to be moved
        this.type = type; //Type of movement
    }

    ActivateBlock(object){
        //Forward drive set up
        if (this.direction === Direction.Forward){
            setUpAnimCache(object,"z", this.magnitude);
        }

        //Strafe set up
        else if (this.direction === Direction.Left){
            setUpAnimCache(object,"x", this.magnitude);
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
}



const animation_duration = 1000; //ms
let start;
let anim_complete = false;


//Storage related to information about the animation requirements (since parameters cannot be used)
const anim_cache = {
    axis : 'z',
    distance : 1,
    model : undefined,
    start_pos : 0
}

//A function for easily editing the animation cache
function setUpAnimCache(model, axis, distance){
    anim_cache.model = model;
    anim_cache.axis = axis;
    anim_cache.distance = distance;
    
    //Automatically configure the starting point used by the animator
    if (axis == "x"){
        anim_cache.start_pos = model.position.x;
    }
    else if (axis == "y"){
        anim_cache.start_pos = model.rotation.y;
    }
    else if (axis == "z"){
        anim_cache.start_pos = model.position.z;
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
    
    //For Left and Right Translation
    if (anim_cache.axis == "x"){
        anim_cache.model.position.x = anim_cache.start_pos + anim_cache.distance * completion_rate;
    }
    //For Left and Right Rotation
    else if (anim_cache.axis == "y"){
        anim_cache.model.rotation.y = anim_cache.start_pos + degrees_to_radians(anim_cache.distance) * completion_rate;
    }
    //For Forward and Backward Translation
    else if (anim_cache.axis == "z"){
        anim_cache.model.position.z = anim_cache.start_pos + anim_cache.distance * completion_rate;
    }
    
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