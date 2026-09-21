// ============================================================
// NOTION API — helpers de leitura e escrita
// ============================================================

function notionRequest_(method, path, body) {
  const options = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + CONFIG.NOTION_TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };
  if (body) options.payload = JSON.stringify(body);

  const res = UrlFetchApp.fetch('https://api.notion.com/v1' + path, options);
  const data = JSON.parse(res.getContentText());

  if (res.getResponseCode() >= 400) {
    throw new Error('Notion API ' + res.getResponseCode() + ': ' + JSON.stringify(data));
  }
  return data;
}

// Cria um novo registro na database
function notionCreatePage(props) {
  return notionRequest_('post', '/pages', {
    parent: { database_id: CONFIG.NOTION_DATABASE_ID },
    properties: props,
  });
}

// Atualiza campos de uma página existente
function notionUpdatePage(pageId, props) {
  return notionRequest_('patch', '/pages/' + pageId, { properties: props });
}

// Lê uma página
function notionGetPage(pageId) {
  return notionRequest_('get', '/pages/' + pageId);
}

// Busca registros na database com filtro opcional
function notionQueryDatabase(filter, sorts) {
  const body = {};
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;
  return notionRequest_('post', '/databases/' + CONFIG.NOTION_DATABASE_ID + '/query', body);
}

// ---- Helpers de property ----------------------------------------

function notionTitle(value) {
  return { title: [{ text: { content: value } }] };
}

function notionRichText(value) {
  return { rich_text: [{ text: { content: value } }] };
}

function notionSelect(value) {
  return { select: { name: value } };
}

function notionDate(isoDate) {
  return { date: { start: isoDate } };
}

function notionUrl(value) {
  return { url: value };
}

function notionCheckbox(value) {
  return { checkbox: !!value };
}

// Lê o valor de uma property de forma segura
function notionReadText(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
  if (prop.type === 'select') return prop.select ? prop.select.name : '';
  if (prop.type === 'checkbox') return prop.checkbox;
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'files') return prop.files.length > 0;
  return '';
}
