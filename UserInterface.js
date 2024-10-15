let bar = null;
let icon = null;
let buttons = null;
let workspace_area = null;

window.addEventListener('load', function() {
    bar = document.getElementById("bottom_bar");
    workspace_area = document.getElementById("workspace_area");
    // bar_internals = Array.from(document.getElementsByClassName("hidden"));
    icon = document.getElementById("icon");
    buttons = document.getElementById("button_container");
})

function toggleBar(){
    if (icon.textContent == "V"){
        closeBar();
    }
    else{
        openBar();
    }
}


function openBar(){
    bar.style.height = '50%';
    icon.textContent = "V"
    // bar_internals.forEach((element) => {
    //     element.classList.toggle("hidden")
    // });
    workspace_area.classList.toggle("hidden");
}

function closeBar(){
    bar.style.height = '10%';
    icon.textContent = "^"
    // bar_internals.forEach((element) => {
    //     element.classList.toggle("hidden")
    // });
    workspace_area.classList.toggle("hidden");
}

function toggleLevelMenu(){
    const levelMenu = document.getElementById("levelMenu");
    //Currently off
    if (levelMenu.classList.contains("hidden")){
        levelMenu.classList.toggle("hidden", false);
    }
    //Currently on
    else{
        levelMenu.classList.toggle("hidden", true);
    }
}