const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");

const words = [];

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (word === "") return;
  const definition = await getDefinition(word);
  const li = document.createElement("li");
  li.innerHTML = `
  <h3>${word}</h3>
  <p>${definition ?? "Definition not found."}</p>
  `;
  list.appendChild(li);
  input.value = "";
  input.focus();
});

async function getDefinition(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data[0].meanings[0].definitions[0].definition;
  } catch (error) {
    console.error(error);
    return null;
  }
}
