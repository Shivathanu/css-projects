const btnOpenNav = document.querySelector('.nav--open');
const btnCloseNav = document.querySelector(".nav--close");
const navMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.overlay');

const menubar = function () {
    navMenu.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
    document.querySelector("body").classList.toggle("overflow-y-hidden");
}

btnOpenNav.addEventListener('click', menubar);
btnCloseNav.addEventListener('click', menubar);
overlay.addEventListener('click', menubar);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !navMenu.classList.contains("hidden") && !overlay.classList.contains("hidden")) menubar();
});