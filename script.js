/* ---------- CONFIG: put her/his name here (leave "" for default wording) ---------- */
const RECIPIENT_NAME = "";

const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const name = RECIPIENT_NAME.trim();
if (name) document.querySelectorAll("[data-name]").forEach(el => el.textContent = name);

const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => timers.splice(0).forEach(clearTimeout);

function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
}

/* ---------- music ---------- */
const music = $("music"), muteBtn = $("mute");
function startMusic() {
    music.volume = .45;
    music.play().then(() => muteBtn.classList.add("show")).catch(() => { });
}
muteBtn.onclick = () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "✕" : "♫";
};

/* ---------- tree ---------- */
const canvas = $("canvas"), ctx = canvas.getContext("2d");
let W, H, branches = [], hearts = [], dust = [], progress = 0, raf = 0;

function resize() {
    const r = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    canvas.width = W * r; canvas.height = H * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
    if (raf) build();
}
addEventListener("resize", resize);

function grow(x, y, len, ang, thick, depth) {
    if (depth <= 0) return;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    branches.push({ x1: x, y1: y, x2: ex, y2: ey, w: thick, depth });
    grow(ex, ey, len * .74, ang - .5, thick * .68, depth - 1);
    grow(ex, ey, len * .74, ang + .5, thick * .68, depth - 1);
}

function build() {
    branches = []; hearts = [];
    const trunk = Math.min(H * .14, W * .26, 130);
    grow(W / 2, H * .86, trunk, -Math.PI / 2, Math.max(8, trunk / 9), 7);
    const k = Math.min(1.2, Math.max(.7, Math.min(W, H) / 600));
    branches.forEach(b => {
        if (b.depth > 3) return;
        for (let i = 0; i < 2; i++) {
            const t = rand(.3, 1);
            hearts.push({ x: b.x1 + (b.x2 - b.x1) * t, y: b.y1 + (b.y2 - b.y1) * t, s: rand(3.5, 6.5) * k, d: rand(.5, 1.1), o: 0, ph: rand(0, 6) });
        }
    });
    dust = Array.from({ length: 90 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.5, 2.2), v: rand(.1, .45), o: rand(.2, .6) }));
}

function heart(x, y, s, o) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, .3);
    ctx.bezierCurveTo(-1.2, -.5, -.7, -1.5, 0, -.8);
    ctx.bezierCurveTo(.7, -1.5, 1.2, -.5, 0, .3);
    ctx.fillStyle = `rgba(255,105,160,${o})`;
    ctx.shadowColor = "rgba(255,110,170,.9)"; ctx.shadowBlur = 12;
    ctx.fill(); ctx.restore();
}

function frame() {
    ctx.clearRect(0, 0, W, H);
    dust.forEach(p => {
        p.y -= p.v; if (p.y < -10) p.y = H + 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(255,200,225,${p.o})`; ctx.fill();
    });
    const g = ctx.createRadialGradient(W / 2, H * .86, 0, W / 2, H * .86, Math.min(W, 320));
    g.addColorStop(0, "rgba(243,167,185,.3)"); g.addColorStop(1, "rgba(243,167,185,0)");
    ctx.fillStyle = g; ctx.fillRect(0, H * .6, W, H * .4);

    ctx.lineCap = "round"; ctx.strokeStyle = "#8a5560";
    branches.forEach((b, i) => {
        const p = Math.min(1, Math.max(0, progress * 1.3 - (i / branches.length) * .45));
        if (p <= 0) return;
        ctx.lineWidth = b.w;
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x1 + (b.x2 - b.x1) * p, b.y1 + (b.y2 - b.y1) * p);
        ctx.stroke();
    });
    const now = Date.now() * .003;
    hearts.forEach(h => {
        if (progress < h.d * .9) return;
        h.o = Math.min(1, h.o + .03);
        heart(h.x, h.y, h.s * (1 + Math.sin(now + h.ph) * .1), h.o);
    });
    progress = Math.min(1.3, progress + .0042);
    raf = requestAnimationFrame(frame);
}

function playTree() {
    cancelAnimationFrame(raf); clearTimers();
    progress = 0; resize(); build(); raf = requestAnimationFrame(frame);
    const lines = [...$("lines").children];
    lines.forEach(l => l.classList.remove("show"));
    $("more").classList.remove("visible");
    lines.forEach((l, i) => later(() => l.classList.add("show"), 3200 + i * 950));
    later(() => $("more").classList.add("visible"), 3200 + lines.length * 950 + 500);
}

/* ---------- memory deck ---------- */
const cards = [...document.querySelectorAll(".dc")];
const deck = $("deck"), dots = $("dots");
let cur = 0;
cards.forEach(() => dots.appendChild(document.createElement("i")));

function layoutDeck() {
    cards.forEach((c, i) => {
        const r = i - cur;
        c.style.zIndex = 20 - Math.abs(r);
        if (r < 0) {
            c.style.transform = "translateX(-130%) rotate(-16deg)";
            c.style.opacity = 0;
        } else {
            const tilt = r ? (r % 2 ? 1 : -1) * r * 2.2 : 0;
            c.style.transform = `translateY(${r * 16}px) scale(${1 - r * .055}) rotate(${tilt}deg)`;
            c.style.opacity = r > 2 ? 0 : 1 - r * .22;
        }
    });
    [...dots.children].forEach((d, i) => d.classList.toggle("on", i === cur));
    const last = cur === cards.length - 1;
    $("deckHint").textContent = last ? "That's all… or is it? ♥" : "Tap the card or swipe ✨";
    $("toGift").classList.toggle("show", last);
}
function nextCard() { if (cur < cards.length - 1) { cur++; layoutDeck(); } }
function prevCard() { if (cur > 0) { cur--; layoutDeck(); } }

let startX = null;
deck.addEventListener("pointerdown", e => startX = e.clientX);
deck.addEventListener("pointerup", e => {
    if (startX === null) return;
    const dx = e.clientX - startX; startX = null;
    if (dx > 50) prevCard(); else nextCard();
});
deck.addEventListener("pointercancel", () => startX = null);
deck.tabIndex = 0;
deck.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); nextCard(); }
    if (e.key === "ArrowLeft") prevCard();
});
layoutDeck();

/* ---------- gift ---------- */
let opened = false;
function burst() {
    const set = ["✨", "💖", "❤️", "⭐", "🌸", "💫", "🎉"];
    for (let i = 0; i < 50; i++) {
        const e = document.createElement("div");
        e.className = "burst"; e.textContent = set[i % set.length];
        e.style.fontSize = rand(14, 30) + "px";
        document.body.appendChild(e);
        const a = rand(0, 6.283), d = rand(110, 380);
        requestAnimationFrame(() => {
            e.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(${rand(.6, 1.5)})`;
            e.style.opacity = 0;
        });
        setTimeout(() => e.remove(), 1600);
    }
}
function confetti() {
    const box = $("confetti"), set = ["❤️", "💕", "💖", "✨", "🌸", "🎉", "⭐", "🎀"];
    box.innerHTML = "";
    for (let i = 0; i < 70; i++) {
        const c = document.createElement("div");
        c.className = "c"; c.textContent = set[i % set.length];
        c.style.cssText = `left:${rand(0, 100)}vw;font-size:${rand(10, 24)}px;animation-duration:${rand(3.5, 6.5)}s;animation-delay:${rand(0, 1.8)}s`;
        box.appendChild(c);
    }
}
$("gift").onclick = () => {
    if (opened) return;
    opened = true;
    $("gift").classList.add("open");
    later(() => $("giftCard").classList.add("hide"), 450);
    burst();
    later(() => { show("final"); confetti(); }, 1400);
};

/* ---------- flow ---------- */
$("start").onclick = () => { startMusic(); show("tree"); later(playTree, 350); };
$("more").onclick = () => show("memories");
$("toGift").onclick = () => show("giftScreen");
$("replay").onclick = () => {
    opened = false;
    cur = 0; layoutDeck();
    $("gift").classList.remove("open");
    $("giftCard").classList.remove("hide");
    $("confetti").innerHTML = "";
    show("tree"); later(playTree, 350);
};
resize();