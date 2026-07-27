const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");

const words = [];

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

  words.push(word);
  const li = document.createElement("li");
  li.innerHTML = li.innerHTML = `
    <h2>${word}</h2>
    <p><strong>Part of Speech:</strong> ${result.partOfSpeech}</p>
    <p><strong>Definition:</strong> ${result.definition}</p>
    <p><strong>Example:</strong> ${result.example}</p>
    <p><strong>Synonyms:</strong> ${result.synonyms.join(", ")}</p>
    <p><strong>Antonyms:</strong> ${result.antonyms.join(", ")}</p>
`;

  list.appendChild(li);
  input.value = "";
  input.focus();
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
              content: `
You are an SAT English tutor.
For the SAT vocabulary word "${word}", return ONLY valid JSON in this format:
{
  "definition": "",
  "example": "",
  "synonyms": [],
  "antonyms": [],
  "partOfSpeech": ""
}
Rules:
- Definition should be SAT-level, not dictionary-style.
- easyMeaning should be easy English.
- whyItMatters explains when this word appears on the SAT.
- satExample should sound like a real SAT sentence.
- difficulty is from 1 to 5.
- mnemonic should help memorize the word.
`,
            },
            {
              role: "user",
              content: `Give information about the SAT word "${word}".
Return ONLY valid JSON in this format:
{
  "definition": "",
  "easyMeaning": "",
  "example": "",
  "synonyms": [],
  "antonyms": [],
  "partOfSpeech": ""
}
The partOfSpeech must be one of:
- Noun
- Verb
- Adjective
- Adverb
- Pronoun
- Preposition
- Conjunction
- Interjection
- Determiner
`,
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
