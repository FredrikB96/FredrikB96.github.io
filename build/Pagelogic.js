document.addEventListener("DOMContentLoaded", function() {
    // Code that runs when the DOM is fully loaded
    alert("The DOM has fully loaded!");
});

document.getElementById("checkButton").addEventListener("click", function() {
    const firstName = document.getElementById("firstNameDisplay").textContent.trim().toLowerCase();
    const lastName = document.getElementById("lastNameInput").value.trim().toLowerCase();

    if (lastName) {
        checkEmployeeName(firstName, lastName);
    }
});

function checkEmployeeName(firstName, lastName) {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            const matchingEmployee = data.Employees.find(employee => {
                // Compare first name while ignoring case
                return employee.firstName.toLowerCase() === firstName;
            });

            if (matchingEmployee) {
                if (matchingEmployee.lastName.toLowerCase() === lastName) {
                    document.getElementById("input").textContent = "✅ Last name is correct!";
                } else {
                    document.getElementById("input").textContent = `❌ Last name should be "${matchingEmployee.lastName}"`;
                }
            } else {
                document.getElementById("input").textContent = "❌ First name not found";
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}
