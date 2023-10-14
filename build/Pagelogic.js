// Pagelogic.js
document.getElementById("populateButton").addEventListener("click", function() {
    Populate();
});

function Populate() {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            document.getElementById("input").textContent = JSON.stringify(data);
            alert("Data loaded successfully");
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}
