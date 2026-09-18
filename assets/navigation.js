// Shared navigation fixes — delegated, single set of handlers, no inline leftovers.
(function () {
    'use strict';

    function init() {
        var toggle = document.querySelector('.mobile-toggle');
        var nav = document.querySelector('.nav-links');
        if (!toggle || !nav) return;

        if (!nav.id) nav.id = 'nav-links';
        if (!toggle.hasAttribute('aria-controls')) toggle.setAttribute('aria-controls', nav.id);
        if (!toggle.hasAttribute('aria-label')) toggle.setAttribute('aria-label', 'Toggle navigation menu');
        if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');

        var isMobile = function () {
            return window.matchMedia('(max-width: 992px)').matches;
        };

        var dropdowns = function () {
            return nav.querySelectorAll('.dropdown');
        };

        var dropdownLinks = function () {
            return nav.querySelectorAll('.dropdown > a');
        };

        function fitMenu() {
            if (isMobile() && nav.classList.contains('active')) {
                nav.style.maxHeight = Math.max(120, window.innerHeight - nav.getBoundingClientRect().top - 12) + 'px';
            } else {
                nav.style.removeProperty('max-height');
            }
        }

        function closeMenu() {
            nav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            dropdowns().forEach(function (d) {
                d.classList.remove('open');
                d.classList.remove('active');
            });
            dropdownLinks().forEach(function (a) {
                if (isMobile()) a.setAttribute('aria-expanded', 'false');
                else a.removeAttribute('aria-expanded');
            });
        }

        function closeDropdowns() {
            dropdowns().forEach(function (d) {
                d.classList.remove('open');
                d.classList.remove('active');
            });
            dropdownLinks().forEach(function (a) {
                if (isMobile()) a.setAttribute('aria-expanded', 'false');
                else a.removeAttribute('aria-expanded');
            });
        }

        closeMenu();

        // Toggle button: opens/closes the mobile nav.
        toggle.addEventListener('click', function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var open = nav.classList.toggle('active');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (!open) {
                closeDropdowns();
            }
            fitMenu();
        }, true);

        // Nav delegation: dropdown branch only, capture phase, owns mobile dropdown clicks.
        nav.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;
            var li = a.parentElement;
            var isDropdown = li && li.classList && li.classList.contains('dropdown') && a === li.querySelector(':scope > a');

            if (isDropdown && isMobile()) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var wasOpen = li.classList.contains('active');
                closeDropdowns();
                if (!wasOpen) {
                    li.classList.add('open');
                    li.classList.add('active');
                    a.setAttribute('aria-expanded', 'true');
                }
                return;
            }

            // Any real navigation link closes the mobile menu.
            closeMenu();
        }, true);

        // Space on a focused dropdown link toggles it on mobile.
        nav.addEventListener('keydown', function (e) {
            if (e.key !== ' ' && e.key !== 'Spacebar') return;
            var a = e.target.closest('a');
            if (!a) return;
            var li = a.parentElement;
            var isDropdown = li && li.classList && li.classList.contains('dropdown') && a === li.querySelector(':scope > a');
            if (!isDropdown || !isMobile()) return;
            e.preventDefault();
            a.click();
        }, true);

        // Escape: close menu + dropdowns.
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (isMobile() && nav.classList.contains('active')) {
                closeMenu();
                toggle.focus();
                return;
            }
            var openLi = nav.querySelector('.dropdown.active, .dropdown.open');
            if (openLi) {
                var anchor = openLi.querySelector(':scope > a');
                closeDropdowns();
                if (anchor) anchor.focus();
            }
        });

        // Resize: leaving mobile resets state; entering mobile clears hover/aria leftovers.
        window.addEventListener('resize', function () {
            if (!isMobile()) {
                closeMenu();
            }
            fitMenu();
        });
        window.addEventListener('scroll', function () {
            window.requestAnimationFrame(fitMenu);
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
