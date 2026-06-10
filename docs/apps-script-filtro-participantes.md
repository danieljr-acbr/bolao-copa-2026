# Filtro de participantes ativos no Apps Script

Este ajuste transforma a planilha/formulario na fonte oficial de participantes validos do bolao.

## Objetivo

Mesmo que um arquivo JSON continue salvo no Google Drive, o participante so deve aparecer no `index.html`, `ranking.html` e no JSON consolidado se estiver ativo na planilha oficial.

## Modelo recomendado da planilha

Crie ou mantenha uma aba chamada `Participantes` com pelo menos estas colunas:

| nome | email | status | pago |
|---|---|---|---|
| Daniel | daniel@email.com | ativo | sim |
| Joao | joao@email.com | removido | nao |

Valores aceitos para `status`:

- `ativo`
- `pago`
- `confirmado`
- `pendente`
- `removido`
- `cancelado`

Para o consolidado publico, recomenda-se exibir apenas:

- `ativo`
- `pago`
- `confirmado`

## Funcoes para adicionar ao Apps Script

Cole estas funcoes no seu Apps Script consolidador.

```javascript
const ABA_PARTICIPANTES = 'Participantes';
const STATUS_VALIDOS_PUBLICOS = new Set(['ativo', 'pago', 'confirmado']);

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizarEmail(email) {
  return normalizarTexto(email);
}

function encontrarIndiceCabecalho(cabecalhos, nomesPossiveis) {
  const normalizados = cabecalhos.map(normalizarTexto);
  for (const nome of nomesPossiveis) {
    const idx = normalizados.indexOf(normalizarTexto(nome));
    if (idx >= 0) return idx;
  }
  return -1;
}

function carregarParticipantesValidosDaPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ABA_PARTICIPANTES);

  if (!sheet) {
    throw new Error('Aba "' + ABA_PARTICIPANTES + '" nao encontrada.');
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { emails: new Set(), nomes: new Set() };

  const headers = values[0];
  const idxNome = encontrarIndiceCabecalho(headers, ['nome', 'name', 'participante']);
  const idxEmail = encontrarIndiceCabecalho(headers, ['email', 'e-mail', 'mail']);
  const idxStatus = encontrarIndiceCabecalho(headers, ['status', 'situacao', 'situação']);
  const idxPago = encontrarIndiceCabecalho(headers, ['pago', 'pagamento', 'confirmado']);

  const emails = new Set();
  const nomes = new Set();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const nome = idxNome >= 0 ? String(row[idxNome] || '').trim() : '';
    const email = idxEmail >= 0 ? normalizarEmail(row[idxEmail]) : '';
    const status = idxStatus >= 0 ? normalizarTexto(row[idxStatus]) : '';
    const pago = idxPago >= 0 ? normalizarTexto(row[idxPago]) : '';

    const estaAtivo = STATUS_VALIDOS_PUBLICOS.has(status) || pago === 'sim' || pago === 'pago' || pago === 'true';

    if (!estaAtivo) continue;
    if (email) emails.add(email);
    if (nome) nomes.add(normalizarTexto(nome));
  }

  return { emails, nomes };
}

function participanteEstaValidoNoCadastro(participante, participantesValidos) {
  const email = normalizarEmail(participante.email || participante.mail || participante.e_mail);
  const nome = normalizarTexto(participante.nome || participante.name || participante.apelido);

  if (email && participantesValidos.emails.has(email)) return true;
  if (nome && participantesValidos.nomes.has(nome)) return true;

  return false;
}
```

## Onde usar no consolidador

No ponto em que o Apps Script percorre os arquivos JSON da pasta do Drive, carregue a lista oficial uma vez:

```javascript
const participantesValidos = carregarParticipantesValidosDaPlanilha();
```

Depois, dentro do loop de arquivos:

```javascript
const participante = dados.participant || dados.participante || dados;

if (!participanteEstaValidoNoCadastro(participante, participantesValidos)) {
  Logger.log('Ignorando participante removido ou nao confirmado: ' + JSON.stringify(participante));
  continue;
}

// segue o processamento normal
```

## Regra final

- Remover da planilha ou marcar como `removido` faz o participante sumir do consolidado.
- O JSON original pode continuar no Drive para auditoria.
- O ranking e a central passam a refletir apenas os participantes ativos/pagos/confirmados.

## Observacao importante

Prefira validar por e-mail quando possivel. Nome pode mudar, ter apelido ou duplicidade. O e-mail e mais seguro para sincronizacao.
