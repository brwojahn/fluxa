document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('h1');

  if (title) {
    title.textContent = 'Fluxa';
  }

  console.log('Fluxa: interface inicial carregada.');
});
