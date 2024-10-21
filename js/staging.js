

const burger = document.getElementById('burger');
const burgerNavBar = document.getElementById('nav-links');

// Add a click event on the burger icon
burger.addEventListener('click', () => {
    burgerNavBar.classList.toggle('is-active');
});


const cardData = [
    {
        title: "MISP"
    },
    {
        title: "CrowdStrike"
    },
    {
        title: "Mandiant"
    }
];

// Function to create and append cards
function createCard(title) {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
    
        <header class="card-header">
         <div class="containerCheckBox">
            <p class="card-header-title">${title}</p>
            <label class="switch-label" for="toggleSwitch">
                <input type="checkbox" checked/>
                      
            </label>
             </div>
        </header>
   
    `;

    return card;
}

// Insert cards into the card list
const cardList = document.getElementById('cardList');
cardData.forEach(data => {
    const cardElement = createCard(data.title);
    cardList.appendChild(cardElement);
});


const menuServices = document.getElementById("menuServices");
const servicesView = document.getElementById("servicesView");
/* Menu Services */
menuServices.addEventListener("click", (e) => {
    e.preventDefault();
    // editUserEmail.value = application.user.email;
    // editUserKey.value = application.user.key;
    loginScreen.style.display = "none";
    mainSection.style.display = "none";
    profileView.style.display = "none";
    servicesView.style.display = "block";
    // updateUserButton.addEventListener("click", () => {
    //     application.setUserData(editUserEmail.value, editUserKey.value);
    //     checkUser();
    // });
});



