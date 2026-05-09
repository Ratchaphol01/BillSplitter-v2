// Dark Mode Toggle Script
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Get saved mode from localStorage
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode === 'true';

    // Apply saved mode
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Create and add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.innerHTML = isDarkMode ? '☀️' : '🌙';
    toggleBtn.title = isDarkMode ? 'Light Mode' : 'Dark Mode';
    toggleBtn.type = 'button';

    document.body.appendChild(toggleBtn);

    // Toggle dark mode on button click
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isCurrentlyDark = document.body.classList.toggle('dark-mode');
      toggleBtn.innerHTML = isCurrentlyDark ? '☀️' : '🌙';
      toggleBtn.title = isCurrentlyDark ? 'Light Mode' : 'Dark Mode';
      localStorage.setItem('darkMode', isCurrentlyDark);
    });
  } catch (error) {
    console.error('Dark mode script error:', error);
  }
});

