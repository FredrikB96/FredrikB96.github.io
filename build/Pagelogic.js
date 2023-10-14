// Pagelogic.js
document.getElementById("populateButton").addEventListener("click", function() {
    Populate();
});

function Populate() {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
			let test = JSON.parse(data);
			const firstEmployee = data.Employees[0];
            document.getElementById("input").textContent = firstEmployee.firstName;
            
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}
