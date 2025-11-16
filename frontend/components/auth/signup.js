document.addEventListener('DOMContentLoaded', () => {

  // Password toggle logic (DRY)
  document.querySelectorAll('.toggle-password').forEach(eye => {
    eye.addEventListener('click', function() {
      const input = document.getElementById(this.getAttribute('data-target'));
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        this.innerHTML = input.type === 'password'
          ? `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-eye'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'></path><circle cx='12' cy='12' r='3'></circle></svg>`
          : `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-eye-off'><path d='M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-7.94'></path><path d='M1 1l22 22'></path></svg>`;
      }
    });
  });

  // Signup form logic
  document.querySelector('.auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const [usernameInput, emailInput, passwordInput, confirmInput] = inputs;
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    if (password !== confirmPassword) return showPopup('Passwords do not match!');
    try {
      const res = await fetch('http://localhost:4000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) showPopup('Account created successfully!', () => window.location.href = '../../pages/home.html');
      else showPopup(data.error || 'Signup failed.');
    } catch {
      showPopup('Network error. Please try again.');
    }
  });

  // Popup function
  function showPopup(message, onClose) {
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    popup.innerHTML = `<div class="custom-popup-content">${message}<br><button class="custom-popup-btn">OK</button></div>`;
    document.body.appendChild(popup);
    popup.querySelector('.custom-popup-btn').onclick = () => {
      popup.remove();
      if (onClose) onClose();
    };
  }
});
