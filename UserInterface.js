let bar = null;
let icon = null;
let buttons = null;
window.onload = function(){
    bar = document.getElementById("bottom_bar");
    icon = document.getElementById("icon");
    buttons = document.getElementById("button_container")
}
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
    buttons.classList.toggle("hidden")
}

function closeBar(){
    bar.style.height = '10%';
    icon.textContent = "^"
    buttons.classList.toggle("hidden")
}