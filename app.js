let jokes = [];
let currentJoke = null;
let answerRevealed = false;
let ratings = {};

// DOM elements
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const revealBtn = document.getElementById('reveal-btn');
const newJokeBtn = document.getElementById('new-joke-btn');
const jokeCard = document.getElementById('joke-card');
const buttonContainer = document.getElementById('button-container');
const ratingSection = document.getElementById('rating-section');
const thumbsUpBtn = document.getElementById('thumbs-up');
const thumbsDownBtn = document.getElementById('thumbs-down');

// Load jokes from JSON file
async function loadJokes() {
    try {
        const response = await fetch('jokes.json');
        jokes = await response.json();
        loadRatings();
        showNewJoke();
    } catch (error) {
        questionEl.textContent = 'Oops! Failed to load jokes. Please refresh the page.';
        console.error('Error loading jokes:', error);
    }
}

// Load ratings from localStorage
function loadRatings() {
    const saved = localStorage.getItem('dadJokeRatings');
    if (saved) {
        ratings = JSON.parse(saved);
    }
}

// Save ratings to localStorage
function saveRatings() {
    localStorage.setItem('dadJokeRatings', JSON.stringify(ratings));
}

// Create a unique key for each joke
function getJokeKey(joke) {
    return `${joke.question}|${joke.answer}`;
}

// Get a random joke
function getRandomJoke() {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
}

// Show a new joke
function showNewJoke() {
    currentJoke = getRandomJoke();
    questionEl.textContent = currentJoke.question;
    answerEl.textContent = currentJoke.answer;
    answerEl.classList.remove('show');
    ratingSection.classList.remove('show');
    answerRevealed = false;
    revealBtn.disabled = false;

    // Clear rating selection
    thumbsUpBtn.classList.remove('selected');
    thumbsDownBtn.classList.remove('selected');
}

// Reveal the answer
function revealAnswer() {
    if (!answerRevealed) {
        answerEl.classList.add('show');
        ratingSection.classList.add('show');
        answerRevealed = true;
        revealBtn.disabled = true;

        // Show existing rating if available
        const jokeKey = getJokeKey(currentJoke);
        if (ratings[jokeKey] === 'up') {
            thumbsUpBtn.classList.add('selected');
        } else if (ratings[jokeKey] === 'down') {
            thumbsDownBtn.classList.add('selected');
        }
    }
}

// Rate joke
function rateJoke(rating) {
    if (!currentJoke || !answerRevealed) return;

    const jokeKey = getJokeKey(currentJoke);

    // Toggle rating
    if (ratings[jokeKey] === rating) {
        delete ratings[jokeKey];
        thumbsUpBtn.classList.remove('selected');
        thumbsDownBtn.classList.remove('selected');
    } else {
        ratings[jokeKey] = rating;
        thumbsUpBtn.classList.remove('selected');
        thumbsDownBtn.classList.remove('selected');

        if (rating === 'up') {
            thumbsUpBtn.classList.add('selected');
        } else {
            thumbsDownBtn.classList.add('selected');
        }
    }

    saveRatings();
}

// Hover tilt effect
function addTilt() {
    jokeCard.classList.add('tilted');
}

function removeTilt() {
    jokeCard.classList.remove('tilted');
}

// Event listeners
revealBtn.addEventListener('click', revealAnswer);
newJokeBtn.addEventListener('click', showNewJoke);
thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
thumbsDownBtn.addEventListener('click', () => rateJoke('down'));

// Hover events for tilt
jokeCard.addEventListener('mouseenter', addTilt);
jokeCard.addEventListener('mouseleave', removeTilt);
buttonContainer.addEventListener('mouseenter', addTilt);
buttonContainer.addEventListener('mouseleave', removeTilt);

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