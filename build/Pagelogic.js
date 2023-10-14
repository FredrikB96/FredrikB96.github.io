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
                 const correctLastName = matchingEmployee.lastName;
				 document.getElementById("paragraph").textContent = "✅ Last name has been checked!";
                highlightLastName(lastNameInput, correctLastName);
            } else {
                document.getElementById("input").textContent = "❌ First name not found";
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}


function highlightLastName(inputElement, correctLastName) {
    const lastName = inputElement.value;
    let resultHtml = '';

    for (let i = 0; i < lastName.length; i++) {
        if (lastName[i] === correctLastName[i]) {
            resultHtml += `<span class="highlight-correct">${lastName[i]}</span>`;
        } else {
            resultHtml += `<span class="highlight-incorrect">${lastName[i]}</span>`;
        }
    }

    inputElement.innerHTML = resultHtml;
}