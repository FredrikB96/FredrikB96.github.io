// Pagelogic.js
document.getElementById("populateButton").addEventListener("click", function() {
    Populate();
});

function Populate() {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
			var test = JSON.parse(data).Employees[1].firstName;
            document.getElementById("input").textContent = test;
            
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}
