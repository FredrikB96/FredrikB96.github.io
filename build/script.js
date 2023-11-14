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

const axios = require('axios');
const cheerio = require('cheerio');

async function searchVerbTypeOnJisho(verb) {
  try {
    const response = await axios.get(`https://jisho.org/word/${verb}`);

    // Load the HTML content into Cheerio
    const $ = cheerio.load(response.data);

    // Find the element containing verb type information
    const verbTypeElement = $('.concept_light .concept_light-tag .concept_light-representation span.text').first();

    // Extract the text that contains the verb type
    const verbType = verbTypeElement.text();

    // Check if it's a godan or ichidan verb based on the retrieved data
    if (verbType.includes('Godan verb')) {
      console.log(`${verb} is a Godan (五段) verb.`);
    } else if (verbType.includes('Ichidan verb')) {
      console.log(`${verb} is an Ichidan (一段) verb.`);
    } else {
      console.log(`Unable to determine the verb type for ${verb}.`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage
searchVerbTypeOnJisho('食べる'); // Replace '食べる' with the verb you want to search
