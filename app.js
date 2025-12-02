let jokes = [];
let currentJoke = null;
let answerRevealed = false;
let currentTiltDirection = 1; // 1 for right, -1 for left

// DOM elements
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const mainBtn = document.getElementById('main-btn');
const jokeCard = document.getElementById('joke-card');
const buttonContainer = document.getElementById('button-container');
const ratingSection = document.getElementById('rating-section');
const thumbsUpBtn = document.getElementById('thumbs-up');
const thumbsDownBtn = document.getElementById('thumbs-down');

// API URL - works both locally and on Cloudflare Pages
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : '';

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

// Create a unique key for each joke
function getJokeKey(joke) {
    return `${joke.question}|${joke.answer}`;
}

// Get a random joke
function getRandomJoke() {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
}

// Fetch rating from API
async function fetchRating(jokeKey) {
    try {
        const response = await fetch(`${API_BASE}/api/rating?joke_key=${encodeURIComponent(jokeKey)}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error fetching rating:', error);
    }
    return { thumbs_up: 0, thumbs_down: 0, user_rating: null };
}

// Submit rating to API
async function submitRating(jokeKey, rating) {
    try {
        const response = await fetch(`${API_BASE}/api/rating?joke_key=${encodeURIComponent(jokeKey)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
    }
    return null;
}

// Show a new joke
async function showNewJoke() {
    currentJoke = getRandomJoke();
    questionEl.textContent = currentJoke.question;
    answerEl.textContent = currentJoke.answer;
    answerEl.classList.remove('show');
    ratingSection.classList.remove('show');
    answerRevealed = false;
    mainBtn.textContent = 'Show Answer';

    // Clear rating selection
    thumbsUpBtn.classList.remove('selected');
    thumbsDownBtn.classList.remove('selected');

    // Set random tilt direction for next hover
    currentTiltDirection = Math.random() < 0.5 ? -1 : 1;
    jokeCard.style.setProperty('--tilt-direction', currentTiltDirection);
}

// Reveal the answer
async function revealAnswer() {
    if (!answerRevealed) {
        answerEl.classList.add('show');
        ratingSection.classList.add('show');
        answerRevealed = true;
        mainBtn.textContent = 'Next Joke';

        // Fetch and show existing rating if available
        const jokeKey = getJokeKey(currentJoke);
        const ratingData = await fetchRating(jokeKey);

        if (ratingData.user_rating === 'up') {
            thumbsUpBtn.classList.add('selected');
        } else if (ratingData.user_rating === 'down') {
            thumbsDownBtn.classList.add('selected');
        }
    }
}

// Main button handler
function handleMainButton() {
    if (!answerRevealed) {
        revealAnswer();
    } else {
        showNewJoke();
    }
}

// Rate joke
async function rateJoke(rating) {
    if (!currentJoke || !answerRevealed) return;

    const jokeKey = getJokeKey(currentJoke);

    // Determine if we're toggling off
    const currentlySelected =
        (rating === 'up' && thumbsUpBtn.classList.contains('selected')) ||
        (rating === 'down' && thumbsDownBtn.classList.contains('selected'));

    // Submit to API
    const result = await submitRating(jokeKey, currentlySelected ? null : rating);

    if (result) {
        // Update UI based on result
        thumbsUpBtn.classList.remove('selected');
        thumbsDownBtn.classList.remove('selected');

        if (result.user_rating === 'up') {
            thumbsUpBtn.classList.add('selected');
        } else if (result.user_rating === 'down') {
            thumbsDownBtn.classList.add('selected');
        }
    }
}

// Hover tilt effect
function addTilt() {
    jokeCard.classList.add('tilted');
}

function removeTilt() {
    jokeCard.classList.remove('tilted');
}

// Event listeners
mainBtn.addEventListener('click', handleMainButton);
thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
thumbsDownBtn.addEventListener('click', () => rateJoke('down'));

// Hover events for tilt
jokeCard.addEventListener('mouseenter', addTilt);
jokeCard.addEventListener('mouseleave', removeTilt);
buttonContainer.addEventListener('mouseenter', addTilt);
buttonContainer.addEventListener('mouseleave', removeTilt);

// Allow Enter or Space key to progress
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent space from scrolling
        handleMainButton();
    }
});

// Initialize the app
loadJokes();
