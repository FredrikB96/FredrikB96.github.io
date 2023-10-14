function Populate() {
    var object = TestNode(Math.floor(Math.random() * 3));
    document.getElementById("input").innerHTML = object;
}

function Loadjson() {
    return random(Math.floor(Math.random() * 3));
}

function TestNode(num) {
const fs = require("fs");

fs.readFile("./words.json", "utf8", (error, data) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log(JSON.parse(data));
  var words = JSON.parse(data);
  
  return words.employees[num].firstName;
  
});
	
}

