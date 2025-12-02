let jokes = [];
let answerRevealed = false;

// DOM elements
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const revealBtn = document.getElementById('reveal-btn');
const newJokeBtn = document.getElementById('new-joke-btn');

// Load jokes from JSON file
async function loadJokes() {
    try {
        const response = await fetch('jokes.json');
        jokes = await response.json();
        showNewJoke();
    } catch (error) {
        questionEl.textContent = 'Oops! Failed to load jokes. Please refresh the page.';
        console.error('Error loading jokes:', error);
    }
}

// Get a random joke
function getRandomJoke() {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
}

// Show a new joke
function showNewJoke() {
    const joke = getRandomJoke();
    questionEl.textContent = joke.question;
    answerEl.textContent = joke.answer;
    answerEl.classList.remove('show');
    answerRevealed = false;
    revealBtn.disabled = false;
}

// Reveal the answer
function revealAnswer() {
    if (!answerRevealed) {
        answerEl.classList.add('show');
        answerRevealed = true;
        revealBtn.disabled = true;
    }
}

// Event listeners
revealBtn.addEventListener('click', revealAnswer);
newJokeBtn.addEventListener('click', showNewJoke);

// Allow Enter key to reveal answer or get new joke
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (!answerRevealed) {
            revealAnswer();
        } else {
            showNewJoke();
        }
    }
});

// Initialize the app
loadJokes();