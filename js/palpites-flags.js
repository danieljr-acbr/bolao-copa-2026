(function () {
  const flags = {
    'México': 'mx',
    'África do Sul': 'za',
    'Coreia do Sul': 'kr',
    'República Tcheca': 'cz',
    'Canadá': 'ca',
    'Bósnia e Herzegovina': 'ba',
    'Estados Unidos': 'us',
    'Paraguai': 'py',
    'Catar': 'qa',
    'Suíça': 'ch',
    'Brasil': 'br',
    'Marrocos': 'ma',
    'Haiti': 'ht',
    'Escócia': 'gb',
    'Austrália': 'au',
    'Turquia': 'tr',
    'Alemanha': 'de',
    'Curaçao': 'cw',
    'Holanda': 'nl',
    'Japão': 'jp',
    'Costa do Marfim': 'ci',
    'Equador': 'ec',
    'Suécia': 'se',
    'Tunísia': 'tn',
    'Espanha': 'es',
    'Cabo Verde': 'cv',
    'Bélgica': 'be',
    'Egito': 'eg',
    'Arábia Saudita': 'sa',
    'Uruguai': 'uy',
    'Irã': 'ir',
    'Nova Zelândia': 'nz',
    'França': 'fr',
    'Senegal': 'sn',
    'Iraque': 'iq',
    'Noruega': 'no',
    'Argentina': 'ar',
    'Argélia': 'dz',
    'Áustria': 'at',
    'Jordânia': 'jo',
    'Portugal': 'pt',
    'RD Congo': 'cd',
    'Inglaterra': 'gb',
    'Croácia': 'hr',
    'Gana': 'gh',
    'Panamá': 'pa',
    'Uzbequistão': 'uz',
    'Colômbia': 'co'
  };

  function injectStyle() {
    if (document.getElementById('palpites-flags-style')) return;

    const style = document.createElement('style');
    style.id = 'palpites-flags-style';
    style.textContent = [
      '.team,.flag-team{display:flex;align-items:center;gap:8px;min-width:0}',
      '.team.away,.flag-team.away{justify-content:flex-end;text-align:right}',
      '.team-name{overflow:hidden;text-overflow:ellipsis}',
      '.flag-img{width:26px;height:18px;object-fit:cover;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.18);background:#334155;flex:0 0 auto}',
      '@media(max-width:700px){.team.away,.flag-team.away{justify-content:flex-start;text-align:left}}'
    ].join('');

    document.head.appendChild(style);
  }

  function normalizeTeamName(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getFlagUrl(code) {
    return 'https://flagcdn.com/w40/' + code + '.png';
  }

  function enhanceElement(el, forceAway) {
    if (!el || el.dataset.flagged === '1') return false;
    if (el.querySelector && el.querySelector('.flag-img')) return false;

    const teamName = normalizeTeamName(el.textContent);
    const code = flags[teamName];

    if (!code) return false;

    el.dataset.flagged = '1';
    el.classList.add('flag-team');
    if (forceAway) el.classList.add('away');
    el.textContent = '';

    const img = document.createElement('img');
    img.className = 'flag-img';
    img.alt = '';
    img.loading = 'lazy';
    img.src = getFlagUrl(code);

    const name = document.createElement('span');
    name.className = 'team-name';
    name.textContent = teamName;

    el.appendChild(img);
    el.appendChild(name);
    return true;
  }

  function enhanceTeamsLine(line) {
    if (!line) return;

    const children = Array.from(line.children || []);

    children.forEach(function (child, index) {
      if (child.classList && child.classList.contains('versus')) return;
      enhanceElement(child, index > 1);
    });
  }

  function applyFlags() {
    injectStyle();

    document.querySelectorAll('.team').forEach(function (el) {
      enhanceElement(el, el.classList && el.classList.contains('away'));
    });

    document.querySelectorAll('.teams-line').forEach(enhanceTeamsLine);
  }

  function startObserver() {
    if (!document.body || window.__palpitesFlagsObserverStarted) return;

    window.__palpitesFlagsObserverStarted = true;

    const observer = new MutationObserver(function () {
      applyFlags();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  applyFlags();
  startObserver();
  window.addEventListener('load', function () {
    applyFlags();
    startObserver();
  });
  setInterval(applyFlags, 700);
})();
