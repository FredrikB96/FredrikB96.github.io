function Populate() {
    var object = Loadjson();
    document.getElementById("input").innerHTML = object;
    alert("testing");
}

function Loadjson() {
const fs = require('fs');

let rawdata = fs.readFileSync('words.json');
let student = JSON.parse(rawdata);
console.log(student);
return "peter";
}

