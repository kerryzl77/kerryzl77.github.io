document.addEventListener('keydown', function (event) {
  if (event.target.matches('#theme-toggle [role="button"]') && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault(); event.target.click();
  }
});
