const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");

const words = [];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (word === "") return;
  words.push(word);
  getDefinition(word);
  const li = document.createElement("li");
  li.textContent = word;
  list.appendChild(li);
  console.log(words);
  input.value = "";
  input.focus();
});

async function getDefinition(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
