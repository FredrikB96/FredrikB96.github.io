// Get the input field
var input = document.getElementById("text-field");

// Execute a function when the user presses a key on the keyboard
input.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("submit-button").click();
  }
});

document.getElementById("submit-button").addEventListener("click", function() {
    CheckVerbGroup(document.getElementById("text-field").value);
	
	
	alert('done!');
});

var FirstGroupVerbs 	= 	"あ,い,う,え,お";
var FirstGroupRuVerbs 	= 	['え','け','せ','て','ね','へ','め','れ','べ','げ','ぜ','で','い','き','ぎ','し','じ','ち','に','ひ','び','み','り'];
var IrregularVerbs		=	['くる','する'];
var SecondGroupVerb = 'る';


function CheckVerbGroup(word){

	var word_splitted = word.split("");
	word_splitted.forEach((element) => console.log(typeof(element),element));
	console.log(typeof(SecondGroupVerb),SecondGroupVerb);
	console.log(FirstGroupRuVerbs.includes(word_splitted[word_splitted.length-2]));
	if(word_splitted[word_splitted.length-1]　=== 'る'　&& word_splitted[word_splitted.length-2] === 'す')
		{
			alert('irregural');
		}
	
	else if((SecondGroupVerb === word_splitted[word_splitted.length-1]) && (!FirstGroupRuVerbs.includes(word_splitted[word_splitted.length-2]))){
		alert('ru verb');
	}	else{
		alert('normal verb');
	}
	
}

async function searchVerbTypeOnJisho(verb) {
  try {
    const response = await fetch(`https://jisho.org/word/${verb}`);

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    const html = await response.text();

    // Create a DOM element from the HTML response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the element containing verb type information
    const verbTypeElement = doc.querySelector('.concept_light .concept_light-tag .concept_light-representation span.text');

    if (verbTypeElement) {
      // Extract the text that contains the verb type
      const verbType = verbTypeElement.textContent.trim();

      // Check if it's a godan or ichidan verb based on the retrieved data
      if (verbType.includes('Godan verb')) {
        console.log(`${verb} is a Godan (五段) verb.`);
      } else if (verbType.includes('Ichidan verb')) {
        console.log(`${verb} is an Ichidan (一段) verb.`);
      } else {
        console.log(`Unable to determine the verb type for ${verb}.`);
      }
    } else {
      console.log(`Unable to find information for ${verb}.`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage
searchVerbTypeOnJisho('食べる'); // Replace '食べる' with the verb you want to search
