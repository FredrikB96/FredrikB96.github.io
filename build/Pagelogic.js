function Populate() {
    var object = Loadjson();
    document.getElementById("input").innerHTML = object;
}

function Loadjson() {
    return random(Math.floor(Math.random() * 3));
}

function TestNode(num) {
return false;
}

