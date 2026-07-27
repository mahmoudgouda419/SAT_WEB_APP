const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");

const words = [];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (word === "") return;
  words.push(word);
  console.log(words);
  input.value = "";
  input.focus();
});
