const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");
const words = JSON.parse(localStorage.getItem("words")) || [];

words.forEach(renderWord);
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const word = input.value.trim();
  if (!word) return;
  const loadingLi = document.createElement("li");
  loadingLi.textContent = `Fetching definition for "${word}"...`;
  list.appendChild(loadingLi);
  const result = await getDefinition(word);
  list.removeChild(loadingLi);
  if (!result) {
    alert("Failed to fetch definition. Check your API key or browser console.");
    return;
  }
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
  const li = document.createElement("li");

  const synonyms = Array.isArray(data.synonyms)
    ? data.synonyms.join(", ")
    : "-";
  const antonyms = Array.isArray(data.antonyms)
    ? data.antonyms.join(", ")
    : "-";
  li.innerHTML = `
    <h2>${data.word}</h2>
    <p><strong>Part of Speech:</strong> ${data.partOfSpeech || "-"}</p>
    <p><strong>Definition:</strong> ${data.definition || "-"}</p>
    <p><strong>Example:</strong> ${data.example || "-"}</p>
    <p><strong>Synonyms:</strong> ${synonyms}</p>
    <p><strong>Antonyms:</strong> ${antonyms}</p>
  `;
  list.appendChild(li);
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
