(function () {
  const flags = {
    'Bósnia e Herzegovina': 'ba',
    'República Tcheca': 'cz',
    'África do Sul': 'za',
    'Estados Unidos': 'us',
    'Coreia do Sul': 'kr',
    'Costa do Marfim': 'ci',
    'Arábia Saudita': 'sa',
    'Nova Zelândia': 'nz',
    'Cabo Verde': 'cv',
    'RD Congo': 'cd',
    'México': 'mx',
    'Canadá': 'ca',
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
    'Equador': 'ec',
    'Suécia': 'se',
    'Tunísia': 'tn',
    'Espanha': 'es',
    'Bélgica': 'be',
    'Egito': 'eg',
    'Uruguai': 'uy',
    'Irã': 'ir',
    'França': 'fr',
    'Senegal': 'sn',
    'Iraque': 'iq',
    'Noruega': 'no',
    'Argentina': 'ar',
    'Argélia': 'dz',
    'Áustria': 'at',
    'Jordânia': 'jo',
    'Portugal': 'pt',
    'Inglaterra': 'gb',
    'Croácia': 'hr',
    'Gana': 'gh',
    'Panamá': 'pa',
    'Uzbequistão': 'uz',
    'Colômbia': 'co'
  };

  const teamNames = Object.keys(flags).sort(function (a, b) {
    return b.length - a.length;
  });

  function injectStyle() {
    if (document.getElementById('palpites-flags-style')) return;

    const style = document.createElement('style');
    style.id = 'palpites-flags-style';
    style.textContent = [
      '.team,.flag-team{display:flex!important;align-items:center!important;gap:8px!important;min-width:0}',
      '.team.away,.flag-team.away{justify-content:flex-end;text-align:right}',
      '.team-name{overflow:hidden;text-overflow:ellipsis}',
      '.flag-img{width:26px;height:18px;object-fit:cover;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.18);background:#334155;flex:0 0 auto}',
      '@media(max-width:700px){.team.away,.flag-team.away{justify-content:flex-start;text-align:left}}'
    ].join('');

    document.head.appendChild(style);
  }

  function flagUrl(name) {
    return 'https://flagcdn.com/w40/' + flags[name] + '.png';
  }

  function makeTeamNode(name, away) {
    const wrap = document.createElement('span');
    wrap.className = away ? 'flag-team away' : 'flag-team';
    wrap.dataset.flagged = '1';

    const img = document.createElement('img');
    img.className = 'flag-img';
    img.alt = '';
    img.loading = 'lazy';
    img.src = flagUrl(name);

    const text = document.createElement('span');
    text.className = 'team-name';
    text.textContent = name;

    wrap.appendChild(img);
    wrap.appendChild(text);
    return wrap;
  }

  function enhanceKnownElement(el, away) {
    if (!el || el.dataset.flagged === '1') return false;
    if (el.querySelector && el.querySelector('.flag-img')) return false;

    const name = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!flags[name]) return false;

    el.dataset.flagged = '1';
    el.classList.add('flag-team');
    if (away) el.classList.add('away');
    el.textContent = '';
    el.appendChild(makeTeamNode(name, away));
    return true;
  }

  function enhanceTextNode(textNode, away) {
    const original = textNode.nodeValue;
    if (!original || !original.trim()) return false;

    const parent = textNode.parentNode;
    if (!parent || parent.closest && parent.closest('.flag-team')) return false;

    const trimmed = original.replace(/\s+/g, ' ').trim();
    const matched = teamNames.find(function (name) {
      return trimmed === name;
    });

    if (!matched) return false;

    parent.replaceChild(makeTeamNode(matched, away), textNode);
    return true;
  }

  function enhanceTeamsLine(line) {
    if (!line) return;

    const children = Array.from(line.children || []);

    children.forEach(function (child, index) {
      if (child.classList && child.classList.contains('versus')) return;
      enhanceKnownElement(child, index > 1);
    });

    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      const el = node.parentElement;
      const away = !!(el && el.classList && el.classList.contains('away'));
      enhanceTextNode(node, away);
    });
  }

  function enhanceCards() {
    document.querySelectorAll('.match-card,.game-card,.card').forEach(function (card) {
      if (card.dataset.flagsScanned === '1') return;

      const text = card.textContent || '';
      const hasTeam = teamNames.some(function (name) {
        return text.indexOf(name) !== -1;
      });

      if (!hasTeam) return;

      card.dataset.flagsScanned = '1';

      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        enhanceTextNode(node, false);
      });
    });
  }

  function applyFlags() {
    injectStyle();

    document.querySelectorAll('.team').forEach(function (el) {
      enhanceKnownElement(el, el.classList && el.classList.contains('away'));
    });

    document.querySelectorAll('.teams-line').forEach(enhanceTeamsLine);
    enhanceCards();
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
