const form = document.getElementById("vocabform");
const input = document.getElementById("vocabinput");
const list = document.getElementById("wordlist");
const words = JSON.parse(localStorage.getItem("words")) || [];
const favorites = JSON.parse(localStorage.getItem("favorite")) || [];

words.forEach(renderWord);

const allBtn = document.getElementById("all")
const favoriteFillterBtn = document.getElementById("favoriteFillter")
let currentFillter = "all";

allBtn.addEventListener("click", function () {
  currentFillter = "all";
  allBtn.classList.add("active");
  favoriteFillterBtn.classList.remove("active");
  list.innerHTML = "";
  words.forEach(renderWord);
});

favoriteFillterBtn.addEventListener("click", function () {
  currentFillter = "favorites";
  favoriteFillterBtn.classList.add("active");
  allBtn.classList.remove("active");
  list.innerHTML = "";
  favorites.forEach(renderWord);
});

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
      if (currentFillter === "favorites") {
        row.remove();
      }
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


const generateQuestionsBtn = document.getElementById("generateQuestions");
const quizContainer = document.getElementById("quizContainer");

const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

let currentQuiz = [];
let currentQuestionIndex = 0;
let score = 0;

generateQuestionsBtn.addEventListener("click", async function () {

  if (favorites.length === 0) {
    alert("No favourite words found.");
    return;
  }
  const selectedWords = [...favorites];

  generateQuestionsBtn.disabled = true;
  quizContainer.innerHTML = `<p class="quiz-loading">Generating questions...</p>`;

  const quiz = await generateQuestions(selectedWords);
  generateQuestionsBtn.disabled = false;

  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    quizContainer.innerHTML = `<p class="quiz-error">Failed to generate, try again later.</p>`;
    return;
  }

  currentQuiz = quiz.questions;
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
})

function renderQuestion() {
  const total = currentQuiz.length;
  const q = currentQuiz[currentQuestionIndex];

  quizContainer.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-header">
        <span class="quiz-counter">Question ${currentQuestionIndex + 1} of ${total}</span>
      </div>
      <div class="question-text">${q.question}</div>
      <div class="answer"></div>
      <div class="quiz-explanation" style="display:none;"></div>
      <button id="nextQuestion" class="next-btn" style="display:none;">Next</button>
    </div>
  `;

  const answerContainer = quizContainer.querySelector(".answer");
  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = choice;
    btn.addEventListener("click", function () {
      selectAnswer(index, btn);
    });
    answerContainer.appendChild(btn);
  });
}

function selectAnswer(selectedIndex, btnEl) {
  const q = currentQuiz[currentQuestionIndex];
  const buttons = quizContainer.querySelectorAll(".answer-btn");
  buttons.forEach((btn) => (btn.disabled = true));

  if (selectedIndex === q.correct) {
    btnEl.classList.add("correct");
    score++;
  } else {
    btnEl.classList.add("wrong");
    buttons[q.correct].classList.add("correct");
  }
  const explanationEl = quizContainer.querySelector(".quiz-explanation");
  explanationEl.textContent = q.explanation;
  explanationEl.style.display = "block";

  const nextBtn = quizContainer.querySelector("#nextQuestion");
  nextBtn.textContent =
      currentQuestionIndex < currentQuiz.length - 1 ? "Next" : "Finish";
  nextBtn.style.display = "inline-block";
  nextBtn.addEventListener("click", goToNext);
}

function goToNext() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuiz.length) {
    renderQuestion();
  } else {
    renderResults();
  }
}

function renderResults() {
  const total = currentQuiz.length;
  quizContainer.innerHTML = `
  <div class="quiz-card quiz-results">
  <h3>Quiz Complete :></h3>
  <p>You scored ${score} out of ${total}</p>
      <button id="restartQuiz" class="next-btn">Generate New Questions</button>
  </div>`;
  document.getElementById("restartQuiz").addEventListener("click", function () {
    generateQuestionsBtn.click();
  });
}

async function generateQuestions(words) {
  try {
    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are an expert SAT English tutor. Always respond in valid JSON format.",
              },
              {
                role: "user",
                content: `Your task is  to create SAT "Word in context" questions that test whether the student understand the vocabulary or not,
                You are given a list of vocabulary words that the student has studied ${words.map((w) => w.word).join(", ")}
                
                Follow These Rules:
                1. Use the provided vocab as the target concepts being tested.
                2. Do NOT simply place the target word directly into every question.
                3. The Word in the list may be the correct answer or not.
                4. Avoid patterns in the correct-answer positions.
                5. Do not make the correct answer consistently the longest or most detailed choice.
                6. Prefer questions that require contextual interpretation.
                7. Randomize the position of the correct answer across questions. Do not always use index 0.
                8. It will be better if the question from an official test-bank and mention it in the end of the question itself.
                
                For every target word, generate one question.
                
                Return Only valid JSON in exactly this structure:
                {
                  "questions": [
                    {
                      "word": "",
                      "question": "",
                      "choices": ["", "", "", ""],
                      "correct": 0,
                      "explanation": ""
                    }
                  ]
                }
                The "word" field must contain the vocabulary word being tested.
                The "correct" field must contain the zero-based index of the correct answer.
                The "explanation" must briefly explain why the correct answer fits the context and why the student needs to understand the vocabulary to answer it.
                
                Before returning the JSON, internally verify that:
                1. Every provided vocabulary word is tested exactly once.
                2. The questions are meaningfully different from one another.
                3. The target word is not unnecessarily revealed in every question.
                4. Each question has exactly four choices.
                5. There is exactly one correct answer.
                6. The questions genuinely test vocabulary understanding in context.
                7. It will be better if the question from an official test-bank and mention it in the end of the question itself.


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
    console.error(err);
      return null;
  }
}


function validateQuestion(question) {
  if (
      !question.word ||
      !Array.isArray(question.choices) ||
      question.choices.length !== 4 ||
      typeof question.correct !== "number" ||
      question.correct < 0 ||
      question.correct >= question.choices.length
  ) {
    return false;
  }
  return true;
}

const rawGenerateQuestions = generateQuestions;
generateQuestions = async function (words) {
  const result = await rawGenerateQuestions(words);
  if (result && Array.isArray(result.questions)) {
    result.questions = result.questions.filter(validateQuestion);
  }
  return result;
}

document.addEventListener("keydown", function (e) {
  if (!["1","2","3","4"].includes(e.key)) return;
  const buttons = document.querySelectorAll(
      "#quizContainer .answer-btn:not(:disabled)",
  );
  const index = Number(e.key) - 1;
  if (buttons[index]) {
     buttons[index].click();
  }
});
