function Populate() {
    var object = Loadjson();
    document.getElementById("input").innerHTML = object;
    alert("testing");
}

function Loadjson() {
    return random(2);
}

