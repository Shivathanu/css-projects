const btnNav = document.querySelector('.nav__menu');
const mobileNav = document.querySelector('.mobile');

btnNav.addEventListener('click', function() {
    btnNav.classList.toggle('opacity-50');
    mobileNav.classList.toggle('hidden');
    document.querySelector('body').style.overflowY = "visible";

    if (!mobileNav.classList.contains("hidden")) {
      document.querySelector("body").style.overflowY = "hidden";
    }
});



