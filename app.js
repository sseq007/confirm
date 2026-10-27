// ===== 여기만 바꾸면 돼요 =====
const CONFIG = {
  her: '채민님',
  me: 'OO',                      // 내 이름
  date: new Date(2026, 9, 31),  // 2026-10-31 (토), 월은 0부터
  place: '청주 성안길',
  times: [
    { time: '12:00', title: '점심부터', desc: '맛있는 점심 먹고 카페' },
    { time: '14:00', title: '오후에', desc: '카페 갔다가 성안길 산책' },
    { time: '17:00', title: '저녁 무렵', desc: '가볍게 걷고 저녁 먹기' },
    { time: '19:00', title: '저녁에', desc: '저녁 먹고 가볍게 한잔' },
  ],
  courses: [
    { emoji: '🎬', title: '영화 보기' },
    { emoji: '🍝', title: '맛집 탐방' },
    { emoji: '☕', title: '분위기 좋은 카페' },
    { emoji: '🚶', title: '성안길 산책' },
    { emoji: '🍰', title: '디저트' },
    { emoji: '🎃', title: '할로윈 구경' },
    { emoji: '📸', title: '사진 찍기' },
  ],
};

const NO_LABELS = ['아니오', '정말요? 🥺', '다시 생각해봐요', '버튼이 부끄러워해요', '못 잡아요 🏃', '마지막 기회…'];
const WEEK = '일월화수목금토';

const state = { date: CONFIG.date, time: null, courses: new Set() };

const $ = (sel) => document.querySelector(sel);
const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();

// ----- 공통 텍스트 채우기 -----
document.querySelectorAll('[data-her]').forEach((el) => (el.textContent = CONFIG.her));
document.querySelectorAll('[data-me]').forEach((el) => (el.textContent = CONFIG.me));
document.querySelectorAll('[data-me-initial]').forEach((el) => (el.textContent = CONFIG.me.slice(0, 1)));
document.querySelectorAll('[data-date]').forEach((el) => (el.textContent = fmtDate(CONFIG.date)));
document.querySelectorAll('[data-place]').forEach((el) => (el.textContent = CONFIG.place));

// 선택된 레이어처럼 프레임 모서리에 핸들 붙이기
document.querySelectorAll('.frame').forEach((f) =>
  f.insertAdjacentHTML('beforeend', '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i>')
);

// ----- 화면 전환 -----
const PAGE_LABELS = {
  intro: 'Cover', ask: 'Page 1 / 3', alt: 'Page 1-1', time: 'Page 2 / 3',
  course: 'Page 3 / 3', done: 'Approved ✅', bye: 'Closed',
};

function go(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen === name));
  $('#pageLabel').textContent = PAGE_LABELS[name];
  noBtn.hidden = name !== 'ask';
  if (name === 'time') document.querySelector('[data-date-picked]').textContent = fmtDate(state.date);
  if (name === 'done') renderDone();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));

// ----- 토스트 -----
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
}

// ----- 1. 질문: 도망가는 "아니오" -----
const yesBtn = $('#yesBtn');
const noBtn = $('#noBtn');
let noCount = 0;
let lastFlee = 0;

function overlaps(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function flee(e) {
  e.preventDefault();
  const now = Date.now();
  if (now - lastFlee < 300) return; // 터치 시 pointerdown + click 중복 방지
  lastFlee = now;

  noCount++;
  yesBtn.style.transform = `scale(${Math.min(1 + noCount * 0.1, 1.5)})`;

  if (noCount >= NO_LABELS.length) {
    noBtn.classList.add('is-gone');
    toast('"아니오" 버튼이 퇴사했어요 🫡');
    return;
  }

  noBtn.textContent = NO_LABELS[noCount];

  if (!noBtn.classList.contains('is-floating')) {
    const r = noBtn.getBoundingClientRect();
    noBtn.style.left = `${r.left}px`;
    noBtn.style.top = `${r.top}px`;
    noBtn.classList.add('is-floating');
    document.body.appendChild(noBtn);
  }

  // 화면 안, "네" 버튼과 겹치지 않는 곳으로 이동
  const pad = 16;
  const topSafe = 64;
  const w = noBtn.offsetWidth;
  const h = noBtn.offsetHeight;
  const yesRect = yesBtn.getBoundingClientRect();
  let x, y;
  for (let i = 0; i < 20; i++) {
    x = pad + Math.random() * (innerWidth - w - pad * 2);
    y = topSafe + Math.random() * (innerHeight - h - topSafe - pad);
    if (!overlaps({ left: x, top: y, right: x + w, bottom: y + h }, yesRect)) break;
  }
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
}

noBtn.addEventListener('pointerdown', flee);
noBtn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') flee(e); });
noBtn.addEventListener('click', flee); // 키보드 접근 대비

yesBtn.addEventListener('click', () => {
  state.date = CONFIG.date;
  go('time');
});

// ----- 옵션 버튼 공통 -----
function makeOpt(html, onSelect, extraClass = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `opt ${extraClass}`;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = html;
  b.addEventListener('click', () => onSelect(b));
  return b;
}

function selectOne(container, btn) {
  container.querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-pressed', String(o === btn)));
}

// ----- 1-1. 다른 날짜 -----
const dateBox = $('#dateOptions');
const altNext = $('#altNext');
const today = new Date();
today.setHours(0, 0, 0, 0);
for (let i = 1; i <= 16; i++) {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  if (sameDay(d, CONFIG.date)) continue;
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  dateBox.appendChild(
    makeOpt(
      `<span class="opt-day">${WEEK[d.getDay()]}</span><span class="opt-date">${d.getMonth() + 1}/${d.getDate()}</span>`,
      (btn) => { selectOne(dateBox, btn); state.date = d; altNext.disabled = false; },
      weekend ? 'is-weekend' : ''
    )
  );
}
altNext.addEventListener('click', () => go('time'));

// ----- 2. 시간 -----
const timeBox = $('#timeOptions');
const timeNext = $('#timeNext');
const customTime = $('#customTime');

CONFIG.times.forEach((t) => {
  timeBox.appendChild(
    makeOpt(
      `<span class="opt-time">${t.time}</span><span><span class="opt-title">${t.title}</span><span class="opt-desc">${t.desc}</span></span>`,
      (btn) => { selectOne(timeBox, btn); customTime.value = ''; state.time = t.time; timeNext.disabled = false; }
    )
  );
});

customTime.addEventListener('input', () => {
  selectOne(timeBox, null);
  state.time = customTime.value || null;
  timeNext.disabled = !state.time;
});
timeNext.addEventListener('click', () => go('course'));

// ----- 3. 코스 -----
const courseBox = $('#courseOptions');
const courseNext = $('#courseNext');

CONFIG.courses.forEach((c) => {
  courseBox.appendChild(
    makeOpt(`<span class="opt-emoji">${c.emoji}</span><span class="opt-title">${c.title}</span>`, (btn) => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      on ? state.courses.add(c.title) : state.courses.delete(c.title);
      courseNext.disabled = state.courses.size === 0;
    })
  );
});
courseNext.addEventListener('click', () => go('done'));

// ----- 4. 완료 -----
function summaryRows() {
  return [
    ['📅 날짜', fmtDate(state.date)],
    ['⏰ 시간', state.time],
    ['📍 장소', CONFIG.place],
    ['🗺️ 코스', [...state.courses].join(', ')],
  ];
}

function renderDone() {
  $('#summary').innerHTML = summaryRows().map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  confetti();
}

$('#shareBtn').addEventListener('click', async () => {
  const text = ['[토요일 약속 확정 ✅]', ...summaryRows().map(([k, v]) => `${k} ${v}`)].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    toast('복사됐어요! 카톡에 붙여넣어 주세요 💌');
  } catch {
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else prompt('아래 내용을 복사해주세요', text);
  }
});

function confetti() {
  const items = ['🎃', '🎉', '✨', '🍂'];
  const colors = ['#7dd3fc', '#38bdf8', '#bae6fd', '#0ea5e9', '#fde68a'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    if (i % 5 === 0) {
      el.textContent = items[i % items.length];
      el.style.fontSize = `${16 + Math.random() * 12}px`;
    } else {
      el.style.width = '8px';
      el.style.height = '12px';
      el.style.borderRadius = '2px';
      el.style.background = colors[i % colors.length];
    }
    el.style.left = `${Math.random() * 100}vw`;
    el.style.setProperty('--x', `${(Math.random() - 0.5) * 160}px`);
    el.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    el.style.setProperty('--d', `${2.2 + Math.random() * 1.8}s`);
    el.style.setProperty('--delay', `${Math.random() * 0.6}s`);
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
