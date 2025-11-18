
// Navbar component for HawkPark
function renderNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';

    // Logo
    const logo = document.createElement('a');
    logo.className = 'navbar-logo';
    logo.href = '/pages/home';
    logo.textContent = 'HawkPark';
    navbar.appendChild(logo);

    // Button container
    const btns = document.createElement('div');
    btns.className = 'navbar-btns';

    // View Map
    const mapBtn = document.createElement('a');
    mapBtn.className = 'navbar-btn';
    mapBtn.href = '/pages/home';
    mapBtn.textContent = 'View Map';
    btns.appendChild(mapBtn);

    // View Bookings
    const bookingsBtn = document.createElement('a');
    bookingsBtn.className = 'navbar-btn';
    bookingsBtn.href = '/pages/bookings';
    bookingsBtn.textContent = 'View Bookings';
    btns.appendChild(bookingsBtn);


    // My Profile
    const profileBtn = document.createElement('a');
    profileBtn.className = 'navbar-btn';
    profileBtn.href = '/pages/profile';
    profileBtn.textContent = 'My Profile';
    btns.appendChild(profileBtn);

    navbar.appendChild(btns);
    document.body.prepend(navbar);
}

window.addEventListener('DOMContentLoaded', renderNavbar);
