// Get all "navbar-burger" elements

const burger = document.getElementById('burger');
const burgerNavBar = document.getElementById('nav-links');

// Add a click event on the burger icon
burger.addEventListener('click', () => {
    burgerNavBar.classList.toggle('is-active');
});


const cardData = [
    {
        title: "Card 1",
        content: "This is the content of Card 1."
    },
    {
        title: "Card 2",
        content: "This is the content of Card 2."
    },
    {
        title: "Card 3",
        content: "This is the content of Card 3."
    },
    {
        title: "Card 4",
        content: "This is the content of Card 4."
    }
];

// Function to create and append cards
function createCard(title, content, image) {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <div class="card-content">
            <h2 class="title is-4">${title}</h2>
            <p>${content}</p>
            <button class="button is-info toggle-button" id="toggleButton">Toggle On</button>
        </div>
    `;

    return card;
}

// Insert cards into the card list
const cardList = document.getElementById('cardList');
cardData.forEach(data => {
    const cardElement = createCard(data.title, data.content);
    cardList.appendChild(cardElement);
});
