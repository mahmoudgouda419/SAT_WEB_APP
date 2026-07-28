const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");
const deleteBtn = document.getElementById("deleteBtn");
const words = JSON.parse(localStorage.getItem("words")) || [];

words.forEach(renderWord);
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (!word) return;
  const loadingRow = document.createElement("tr");
  loadingRow.innerHTML = `
<td colspan="7">"${word}"...</td>
`;

  list.appendChild(loadingRow);

  const result = await getDefinition(word);
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
    <span class="type-badge">
        ${data.partOfSpeech}
    </span>
</td>

<td>${data.definition}</td>

<td>${data.example}</td>

<td>${synonyms}</td>

<td>${antonyms}</td>

<td>
    <button class="deleteBtn">
        Delete
    </button>
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
  });

  list.appendChild(row);
}

function saveWords() {
  localStorage.setItem("words", JSON.stringify(words));
}
deleteBtn.addEventListener("click", function () {
  if (words.length === 0) return;

  if (confirm("Are you sure you want to delete all saved words?")) {
    words.length = 0;
    saveWords();
    list.innerHTML = "";
  }
});

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
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an SAT English tutor. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: `Give information about the SAT word "${word}".
Return ONLY valid JSON in this format:
{
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
