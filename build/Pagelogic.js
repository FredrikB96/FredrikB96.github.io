document.addEventListener("DOMContentLoaded", function() {
    // Code that runs when the DOM is fully loaded
	 fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.Words.length);
            const randomFirstName = data.Words[randomIndex].Japanese;
            document.getElementById("JapaneseDisplay").textContent = randomFirstName;
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
	
    alert("The DOM has fully loaded!");
});

document.getElementById("EnglishInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        document.getElementById("checkButton").click();
    }
});


document.getElementById("checkButton").addEventListener("click", function() {
    const Japanese = document.getElementById("JapaneseDisplay").textContent.trim().toLowerCase();
    const English = document.getElementById("EnglishInput").value.trim().toLowerCase();
    if (English) {
        checkEmployeeName(Japanese, English);
    }
});

function checkEmployeeName(Japanese, English) {
    fetch('words.json')  // Change the URL to your JSON file or API endpoint
        .then(response => response.json())
        .then(data => {
            const matchingEmployee = data.Words.find(employee => {
                // Compare first name while ignoring case
                return employee.Japanese.toLowerCase() === Japanese;
            });

            if (matchingEmployee) {
                 const correctLastName = matchingEmployee.English.toLowerCase();
				 document.getElementById("paragraph").textContent = "✅ Last name has been checked!";
				 console.log("calling Highlight, with: "+EnglishInput+ " and "+correctLastName);
                highlightLastName(EnglishInput, correctLastName);
            } else {
                document.getElementById("input").textContent = "❌ First name not found";
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
		//document.getElementById("EnglishInput").value = "";
}


function highlightLastName(inputElement, correctLastName) {
    const English = inputElement.value;
    let resultHtml = '';
	console.log("Highlight function called, with: "+EnglishInput.value+ " and "+correctLastName);

    for (let i = 0; i < English.length; i++) {
        if (English[i] === correctLastName[i]) {
			console.log("correct");
            resultHtml += `<span class="highlight-correct">${English[i]}</span>`;
        } else {
            resultHtml += `<span class="highlight-incorrect">${English[i]}</span>`;
			console.log("incorrect");

        }
    }

	console.log("result is:"+resultHtml);
	document.getElementById("EnglishInput").value = "";
	document.getElementById("input").innerHTML = resultHtml;
	document.getElementById("Answer").innerHTML = correctLastName;
    inputElement.innerHTML = resultHtml;
}
