function Populate() {
    var object = (TestNode() == true ? TestNode() : Loadjson()); 
                    Loadjson();
    document.getElementById("input").innerHTML = object;
    alert("testing");
}

function Loadjson() {
    return random(Math.floor(Math.random() * 3));
}

function TestNode() {
    var success = false;
    return success;
}

