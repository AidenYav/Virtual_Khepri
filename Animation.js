import radians_to_degrees, { degrees_to_radians } from "./MathFunctions.js";
//-------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------<Animation Code>-----------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

//Delay constants
export const animation_duration = 500; //ms - Duration of each translation/rotation.
export const animation_delay = 50; //ms - Delay between each block activating. Neccessary from having animations overlap and causing buggy animations
//Some variables used to track the progression of the program/animation

const AnimationTypes = {
    Linear: "Linear",
    Parabolic: "Parabolic",
    Inverse_Parabolic : "I-Parabolic",
    Circle: "Circle",
    S_Circle: "S-Circle"
}
export default class Animation{

    constructor(){
        this.start = undefined;
        // const anim_cache = {
        this.axis = 'z',
        this.distance = new THREE.Vector3(0,0,0),//{ "x" : 0 , "y" : 0 , "z": 0},
        this.model = undefined,
        this.field_centric = true,
        this.start_pos = new THREE.Vector3(0,0,0)//{ "x" : 0 , "y" : 0 , "z": 0}
        // }

        this.anim_translate = this.anim_translate.bind(this);
        this.anim_hitWall = this.anim_hitWall.bind(this);
    }
    
    ActivateAnimation(hitwall = false){
        if (hitwall){
            requestAnimationFrame(this.anim_hitWall);
        }
        else{
            requestAnimationFrame(this.anim_translate);
        }
    }

    GetTranslationVector(){
        return new THREE.Vector3(this.distance.x, this.distance.z, 0);
    }

    //Enums of different animation progression rates


    //Storage related to information about the animation requirements (since parameters cannot be used)


    /** A function for easily editing the animation cache
     * This was neccessary due to the inability to pass extra parameters when calling the requestAnimationFrame() built in function.
     * @param {Object}  model           The passed object that will be moved when the animation is played.
     * @param {String}  axis            The directional axis the object will move.
     * @param {number}  distance        The distance the robot will travel (Multiplied with unit multiplier to be in units visualized in the screen).
     * @param {boolean} field_centric   Whether or not the robot should take into account it's own rotation when moving.
     */
    SetUpAnimCache(model, axis, distance, field_centric = true){
        // console.log(model, axis, distance);
        this.model = model;
        this.axis = axis;
        this.field_centric = field_centric;

        
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
            this.distance[axis] = distance * Math.cos(model.rotation.y + rotation_offset);
            //Calculate the opposite axis
            this.distance[otherAxis] = strafe * distance * Math.sin(model.rotation.y  + rotation_offset);


            // console.log(axis, anim_cache.distance[axis], otherAxis, anim_cache.distance[otherAxis]);
        }
        else{
            this.distance["x"] = 0;
            this.distance["z"] = 0;
            this.distance[axis] = distance;
        }
        
        
        //Automatically configure the starting point used by the animator
        if (axis == "x" || axis == "z"){
            this.start_pos["x"] = model.position.x;
            this.start_pos["z"] = model.position.y;
            
        }
        else if (axis == "y"){
            this.start_pos["y"] = model.rotation.y;
        }
        else{
            console.warn("Invalid axis definition as: " + axis);
        }
    }

    //Function for the animation related to object translation
    /** This function will take the anim_cache information to create the animation effect in conjunction with requestAnimationFrame().
     * @param {number} timeStamp The time in miliseconds in which this function was called.
     */
    anim_translate(timeStamp){
        //This is the first call of the wrapper?
        if (this.start === undefined) {
            this.start = timeStamp;
        }

        //Calculate progress on animation based on time passed
        const elapsed = timeStamp - this.start;
        //This completion rate can be manipulated to mimic de/acceleration
        const completion_rate = this.animation_rates(AnimationTypes.S_Circle, elapsed/animation_duration);
        //For movement Translation (Forward, Backward, Left, and Right)
        if (this.axis == "x" || this.axis == "z"){
            this.model.position.x = this.start_pos["x"] + this.distance["x"] * completion_rate;
            this.model.position.y = this.start_pos["z"] + this.distance["z"] * completion_rate;
        }
        //For Left and Right Rotation
        else if (this.axis == "y"){
            this.model.rotation.y = this.start_pos["y"] + degrees_to_radians(this.distance["y"]) * completion_rate;
        }
        
        //Should the elapsed time go over the animation duration, end the sequence
        if (elapsed < animation_duration){
            requestAnimationFrame(this.anim_translate);
        }
        else{
            this.start = undefined;
        }
    }

    /** A special animation played when colliding with a wall
     * @param {number} timeStamp The time in miliseconds in which this function was called.
     */
    anim_hitWall(timeStamp){
        //This is the first call of the wrapper?
        if (this.start === undefined) {
            this.start = timeStamp;
        }

        //Calculate progress on animation based on time passed
        const elapsed = (timeStamp - this.start);
        //This completion rate can be manipulated in the future to mimic de/acceleration
        let amplitude = 0.1; //Modifier to mimic hitting a wall
        //Sine type rate
        const completion_rate = Math.min( -amplitude * Math.sin(2 * Math.PI * (elapsed/animation_duration) + Math.PI/2)  + amplitude, 1);

        //For Left and Right Translation
        if (this.axis == "x" || this.axis == "z"){
            this.model.position.x = this.start_pos["x"] + this.distance["x"] * completion_rate;
            this.model.position.y = this.start_pos["z"] + this.distance["z"] * completion_rate;
        }

        //Should the elapsed time go over the animation duration, end the sequence
        if (elapsed < animation_duration){
            requestAnimationFrame(this.anim_hitWall);
            
        }
        else{
            
            this.start = undefined;
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
    animation_rates(type, rate){
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
}


// import JSConfetti from './'

const jsConfetti = new JSConfetti()
// window.throwConfetti = function() {
//     jsConfetti.addConfetti();
// }

export function throwConfetti(){
    jsConfetti.addConfetti();
}