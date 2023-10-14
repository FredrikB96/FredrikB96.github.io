function Populate() {
    var object = (TestNode(Math.floor(Math.random() * 3)) == true ? TestNode(Math.floor(Math.random() * 3)) : Loadjson()); 
                    Loadjson();
    document.getElementById("input").innerHTML = object;
}

function Loadjson() {
    return random(Math.floor(Math.random() * 3));
}

function TestNode(num) {
    var success = false;

    const fs = require('fs');

    fs.readFile('words.json', (err, data) => {
        if (err) throw err;
        let student = JSON.parse(data);
        console.log(student);
        sucess = true;
    });
    return student[num].FirstName;
}

