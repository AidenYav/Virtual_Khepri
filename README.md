Project Link: https://aidenyav.github.io/Virtual_Khepri/
Use this image below is the marker for the Augmented Reality system. Otherwise, switch to the non-camera mode.

![Diagram](https://github.com/AidenYav/Virtual_Khepri/blob/main/Markers/pattern-Triangle.png)

Virtual_Khepri is a prototype block code system designed for children to practice programming logic.
Originally this was intended as an alternative activity for Hazen "Scarab" Robotics to utilize at out reach events.
Note: This project no longer recieves updates despite many known bugs existing.

---

Written 10/28/2024

Recent Update(s):

    Level System Implemented:
        There is now an array of 5 maps (more will be added in future updates) that players can choose from.
        
    Improved UI/Visual Effects:
        UI is larger.
        Celebration effect added when winning.
        Bugs with UI scaling/going off screen have been resolved.
        Added new "Khepri" robot, based on Hazen "Scarabs" Robotics 2023-2024 FTC Center Stage Robot.
        User touch interface has been fixed, allowing users to scale and rotate the scene/world.
        
    New Features:
        Camera can now swap between different sources (tested 2, could not test more than 2 due to not owning more than 2 cameras on a single device)
        Level system (mentioned above)
        
    Backend Updates:
        Overhauled world building functions into a seperate file/class
        Revised loading structure to ensure all data loads properly (eliminated a previously unnoticed race condition between map data loading and world building)

Known Issues/bugs:

    "Blocks" can be stacked ontop of each other when snapping together. 
    This will hopefully be fixed by pushing all subseqent blocks down or the last dragged block to the bottom of the program chain.

    Camera switching feature only works properly on the _second_ button press.
    This is not a high priority issue, as it is a secondary feature.

    Level button scaling does not work for mobile tests.
    I do not know why this happens, as desktop screen scaling works perfectly fine.
    This is currently patched by simply scaling Level Buttons to be smaller, but it does not look as good as desired.
    This is also a non-priority issue, and will not be a feature that will be resolved unless I can set up wired mobile testing without having to commit to GitHub just to test.

Planned Updates:

    This project is nearing its end, as I am becoming more satisfied with the end product.
    It is unknown if this project will continue to be worked on for future updates, but here is a plan of what would be new:

    Implement local save system to browser. 
    This could track: 
        Levels users have completed.
        Blocks they used on each map/level.
        Number of blocks they used total to clear each map, encouraging them to try to use less.

    Implement a play next map screen.
    Following the completion of a map, users will be prompted their stats:
        Number of blocks used.
        If the number of blocks is optimal (What is the shortest path).
    Prompt user to either reset the puzzle or continue to the next puzzle.
    
    

---
Written 9/6/2024

Known Issues/bugs:
    
    "Blocks" can be stacked ontop of each other when snapping together. 
    This will hopefully be fixed by pushing all subseqent blocks down or the last dragged block to the bottom of the program chain.
  
    Mobile compatibility is still broken as dragging blocks are also misread for other mobile phone inputs. 
    This will likely be fixed by improving UI placement/layout
  
    Placement of the "workspace" is pushed off screen when using mobile devices.
    Currently unknown what causes this bug, however, a restructure of the html/css layout may prove to be a solution.


Planned Updates:
  
    Improved UI
      UI more intuitive/instructive
      UI made more colorful, readable, and unique
  
    Level system
      Level Selection
      Puzzle completion effect
      New "maps"/puzles to play
  
    Model replaced with a unique drivable "robot" (will be based on a real life model)
