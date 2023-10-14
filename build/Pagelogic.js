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

    const fs = require('fs');

    fs.readFile('words.json', (err, data) => {
        if (err) throw err;
        let student = JSON.parse(data);
        console.log(student);
        sucess = true;
    });
    return success;
}

