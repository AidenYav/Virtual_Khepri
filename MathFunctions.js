//-------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------<Math Functions>-----------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------

/** Converts radian values into degrees
 * @param {number} radians 
 * @returns {number} The converted value in degrees
 */
export default function radians_to_degrees(radians) {
    return radians * (180 / Math.PI) % 360;
}

/** Converts degrees into radian values
 * @param {number} degrees
 * @returns {number} The converted value in radians
 */
export function degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}