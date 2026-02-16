document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // VARIABLES GLOBALES
    // =========================
    const introParagraph = document.querySelector('.intro p');
    const DURATION_MS = 1200;
    const TOP_TOLERANCE = 2;
    const ZONE_TOLERANCE = 40;   // necesario para que el scroll “normal” no se quede atascado y no se active los eventos
    const OFFSET_Y = 0;
    const SCROLL_KEYS_DOWN = new Set(['ArrowDown', 'PageDown', ' ']);
    const SCROLL_KEYS_UP = new Set(['ArrowUp', 'PageUp', 'Home']);

    // =========================
    // PRIMITIVAS DE POSICIÓN
    // =========================
    const isAtTop = () => window.scrollY <= TOP_TOLERANCE; // Necesario porque is "top" no te deja en 0 puede no activarse el evento

    function getIntroTargetY() {
        // Altura del parrafo intro p
        return introParagraph.getBoundingClientRect().top + window.scrollY - OFFSET_Y;
    }

    function isNear(y, tol = ZONE_TOLERANCE) {
        //Esto hace de que en vez de que sea una altura exacta sea una zona alrededor para activar el evento, necesario por si el scroll es muy rápido
        return Math.abs(window.scrollY - y) <= tol;
    }

    // =========================
    // ANIMATION 1: SMOOTH SCROLL DESDE DONDE SEA HASTA DONDE SEA(necesario para bajar a intro p y subir a top)
    // =========================
    let isAnimating = false; // para bloquear eventos durante la animación

    function smoothScrollTo(targetY, duration = DURATION_MS, onDone) {
        isAnimating = true;
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();
        // Esto genera la velocidad respecto al tiempo en la animación, usando funciones conocidas para generar
        // el estilo "ease in out" el el cual hace que la v sea una funcion tal que :
        //f(t) = 2t²    si t < 0.5
        //f(t) = 1 - (-2t + 2)² / 2  si t >= 0.5
        const easeInOut = (t) =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            window.scrollTo(0, startY + distance * easeInOut(t));

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                isAnimating = false;
                if (typeof onDone === 'function') onDone();
            }
        }

        requestAnimationFrame(step);
    }

    // =========================
    // BLOQUES “CLAROS”
    // =========================
    function bajarDelHeader() {
        const introY = getIntroTargetY();
        smoothScrollTo(introY, DURATION_MS, () => {
            // al terminar, sincronizamos trackers
            lastY = window.scrollY;
        });
    }

    function subirAlHeader() {
        smoothScrollTo(0, DURATION_MS, () => {
            lastY = window.scrollY;
        });
    }

    // =========================
    // TRACKING
    // =========================
    let lastY = window.scrollY;

    // =========================
    // INPUT HANDLERS
    // =========================
    function onWheel(e) {
        if (isAnimating) {
            // durante animación no dejamos que el usuario meta scroll “normal”
            e.preventDefault();
            return;
        }

        const introY = getIntroTargetY();
        const goingDown = e.deltaY > 0;
        const goingUp = e.deltaY < 0;

        // TOP -> INTRO
        if (isAtTop() && goingDown) {
            e.preventDefault();
            bajarDelHeader();
            return;
        }

        // SNAP (justo donde te deja) -> TOP
        // Esto arregla tu caso: “nada más bajar, si intento subir, ahora sí funciona”
        if (isNear(introY) && goingUp) {
            e.preventDefault();
            subirAlHeader();
            return;
        }

        // Desde abajo: al subir y CRUZAR la zona snap -> TOP (sigue funcionando)
        if (goingUp) {
            const wasBelowSnap = lastY > (introY + ZONE_TOLERANCE);
            const nowInOrAboveSnap = window.scrollY <= (introY + ZONE_TOLERANCE);

            if (wasBelowSnap && nowInOrAboveSnap) {
                e.preventDefault();
                subirAlHeader();
                return;
            }
        }

        lastY = window.scrollY;
    }

    function onKeyDown(e) {
        if (isAnimating) {
            e.preventDefault();
            return;
        }

        const introY = getIntroTargetY();

        // TOP -> INTRO
        if (isAtTop() && SCROLL_KEYS_DOWN.has(e.key)) {
            e.preventDefault();
            bajarDelHeader();
            return;
        }

        // SNAP -> TOP
        if (isNear(introY) && SCROLL_KEYS_UP.has(e.key)) {
            e.preventDefault();
            subirAlHeader();
            return;
        }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });
});