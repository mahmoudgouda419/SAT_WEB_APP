const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");
const words = JSON.parse(localStorage.getItem("words")) || [];
const favorites = JSON.parse(localStorage.getItem("favorite")) || [];

words.forEach(renderWord);
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (!word) return;
  if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(word)) {
    alert("Please Write a Valid Word");
    return;
  }
  if (words.some((item) => item.word.toLowerCase() === word.toLowerCase())) {
    alert("this word is already exists.");
    return;
  }
  const loadingRow = document.createElement("tr");
  loadingRow.innerHTML = `
<td colspan="7">"${word}"...</td>
`;
  list.appendChild(loadingRow);
  const result = await getDefinition(word);

  if (!result || !result.isValid) {
    list.removeChild(loadingRow);
    alert("this is not valid English word");
    input.focus();
    return;
  }

  list.removeChild(loadingRow);
  const wordData = {
    word,
    ...result,
  };
  words.push(wordData);
  saveWords();
  renderWord(wordData);
  input.value = "";
  input.focus();
});

function renderWord(data) {
  const row = document.createElement("tr");
  const synonyms =
    Array.isArray(data.synonyms) && data.synonyms.length > 0
      ? data.synonyms.join(", ")
      : "-";
  const antonyms =
    Array.isArray(data.antonyms) && data.antonyms.length > 0
      ? data.antonyms.join(", ")
      : "-";
  row.innerHTML = `
<td>${data.word}</td>

<td>
  <span class="type-badge">${data.partOfSpeech}</span>
</td>

<td>${data.definition}</td>

<td>${data.example}</td>

<td>${synonyms}</td>

<td>${antonyms}</td>

<td class = "actiontd">
<button class="deleteBtn">Delete</button>
    <button class="favoriteBtn">☆</button>
</td>
`;
  const removeBtn = row.querySelector(".deleteBtn");
  removeBtn.addEventListener("click", function () {
    const index = words.findIndex((item) => item.word === data.word);
    if (index !== -1) {
      words.splice(index, 1);
      saveWords();
    }
    row.remove();

    const favIndex = favorites.findIndex((item) => item.word === data.word);

    if (favIndex !== -1) {
      favorites.splice(favIndex, 1);
      savefavorites();
    }
  });
  list.appendChild(row);

  const favoriteBtn = row.querySelector(".favoriteBtn");

  if (favorites.some((item) => item.word === data.word)) {
    favoriteBtn.textContent = "★";
  }
  favoriteBtn.addEventListener("click", function () {
    const index = favorites.findIndex((item) => item.word === data.word);
    if (index === -1) {
      favorites.push(data);
      favoriteBtn.textContent = "★";
    } else {
      favorites.splice(index, 1);
      favoriteBtn.textContent = "☆";
    }
    savefavorites();
  });
}

function saveWords() {
  localStorage.setItem("words", JSON.stringify(words));
}

async function getDefinition(word) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an SAT English tutor. Validate user input strictly and always respond in JSON format.",
            },
            {
              role: "user",
              content: `Analyze the input: "${word}".

              Check if "${word}" is a real, valid English word
              (it should NOT be Arabic, pure numbers,
              gibberish, symbols, or typos). 
              Return ONLY valid JSON in this format:
              {
                "isValid": true or false,
                "definition": "",
                "example": "",
                "synonyms": [],
                "antonyms": [],
                "partOfSpeech": ""
}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq API Error:", data);
      return null;
    }
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("Fetch Error:", err);
    return null;
  }
}

const placeholders = [
  "Enter Your New Word",
  "e.g. meticulous",
  "e.g. ambiguous",
  "e.g. foster",
  "Type SAT vocabulary...",
];
let textI = 0;
let charI = 0;
let deleting = false;
function animPlaceholder() {
  const current = placeholders[textI];
  if (!deleting) {
    input.placeholder = current.slice(0, charI++);
  } else {
    input.placeholder = current.slice(0, charI--);
  }
  let speed = deleting ? 40 : 80;
  if (!deleting && charI > current.length) {
    deleting = true;
    speed = 1500;
  }
  if (deleting && charI < 0) {
    deleting = false;
    textI = (textI + 1) % placeholders.length;
    charI = 0;
    speed = 300;
  }
  setTimeout(animPlaceholder, speed);
}
animPlaceholder();

function savefavorites() {
  localStorage.setItem("favorite", JSON.stringify(favorites));
}
