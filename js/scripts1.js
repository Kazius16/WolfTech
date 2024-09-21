// Agregamos un evento de mouseover y mouseout a cada sección
document.querySelectorAll('.seccion').forEach(seccion => {
  seccion.addEventListener('mouseover', () => {
      seccion.classList.add('animacion');
  });
  seccion.addEventListener('mouseout', () => {
      seccion.classList.remove('animacion');
  });
});