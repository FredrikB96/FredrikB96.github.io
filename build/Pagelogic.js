document.addEventListener("DOMContentLoaded", function() {
    // Code that runs when the DOM is fully loaded
	 fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.Employees.length);
            const randomFirstName = data.Employees[3].firstName;
            document.getElementById("firstNameDisplay").textContent = randomFirstName;
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
	
    alert("The DOM has fully loaded!");
});

document.getElementById("lastNameInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        document.getElementById("checkButton").click();
    }
});


document.getElementById("checkButton").addEventListener("click", function() {
    const firstName = document.getElementById("firstNameDisplay").textContent.trim().toLowerCase();
    const lastName = document.getElementById("lastNameInput").value.trim().toLowerCase();
	document.getElementById("lastNameInput").value = "";
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
                 const correctLastName = matchingEmployee.lastName.toLowerCase();
				 document.getElementById("paragraph").textContent = "✅ Last name has been checked!";
				 console.log("calling Highlight, with: "+lastNameInput+ " and "+correctLastName);
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
	console.log("Highlight function called, with: "+lastNameInput.value+ " and "+correctLastName);

    for (let i = 0; i < lastName.length; i++) {
        if (lastName[i] === correctLastName[i]) {
			console.log("correct");
            resultHtml += `<span class="highlight-correct">${lastName[i]}</span>`;
        } else {
            resultHtml += `<span class="highlight-incorrect">${lastName[i]}</span>`;
			console.log("incorrect");

        }
    }

	console.log("result is:"+resultHtml);

	document.getElementById("input").innerHTML = resultHtml;
    inputElement.innerHTML = resultHtml;
}
