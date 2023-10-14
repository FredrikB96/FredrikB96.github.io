function Populate() {
    var object = Loadjson();
    document.getElementById("input").innerHTML = object;
    alert("testing");
}

function Loadjson() {
    var fs = require('fs'); 
  
// Use fs.readFile() method to read the file 
fs.readFile('words.json', 'utf8', function(err, data){ 
      return JSON.parse(data);
    // Display the file content 
    console.log(data); 
}); 
}

