document.addEventListener("DOMContentLoaded", function() {
    // Your code here
    alert("The DOM has loaded!");
});

document.getElementById("checkButton").addEventListener("click", function() {
    const firstName = document.getElementById("firstNameDisplay").textContent.trim();
    const lastNameInput = document.getElementById("lastNameInput");
    const lastName = lastNameInput.value.trim();

    if (lastName) {
        checkEmployeeName(firstName, lastName, lastNameInput);
    }
});

function checkEmployeeName(firstName, lastName, lastNameInput) {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            const matchingEmployee = data.Employees.find(employee => {
                // Compare first name while ignoring case
                return employee.firstName.toLowerCase() === firstName.toLowerCase();
            });

            if (matchingEmployee) {
                const correctLastName = matchingEmployee.lastName;
                highlightLastName(lastNameInput, correctLastName);
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
