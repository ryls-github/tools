/**
 * main.js - Modern HTML Table Generator (DOM-based Generation & Serializer)
 */

// 1. State Management
let rowsCount = 3;
let colsCount = 3;
let headerRowsCount = 1;
let headerColsCount = 0;
let matrix = [
  ['ヘッダー 1', 'ヘッダー 2', 'ヘッダー 3'],
  ['データ 1-1', 'データ 1-2', 'データ 1-3'],
  ['データ 2-1', 'データ 2-2', 'データ 2-3']
];

// 2. DOM Elements Cache
const $ = (id) => document.getElementById(id);
const DOM = {
  inputRows: $('input-rows'),
  inputCols: $('input-cols'),
  headerRows: $('header-rows'),
  headerCols: $('header-cols'),
  btnExport: $('btn-export'),
  btnOpenPreview: $('btn-open-preview'),
  excelTable: $('excel-table'),
  dialog: $('output-dialog'),
  htmlOutput: $('html-output'),
  btnCopy: $('btn-copy'),
  btnCloseX: $('btn-dialog-close-x'),
  toastContainer: $('toast-container'),
  tplColHeader: $('tpl-col-header'),
  tplRowHeader: $('tpl-row-header'),
  tplDataCell: $('tpl-data-cell'),
  tplToast: $('tpl-toast')
};

// 3. Helper Functions
// Excel column label generator (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
const getColumnLabel = (index) => {
  let label = '';
  for (let i = index; i >= 0; i = Math.floor(i / 26) - 1) {
    label = String.fromCharCode((i % 26) + 65) + label;
  }
  return label;
};

// Toast Notification (Modern Popover API - Top Layer)
const showToast = (message, type = 'success') => {
  const toastFragment = DOM.tplToast.content.cloneNode(true);
  const toastElem = toastFragment.querySelector('.toast');
  const svgElem = toastFragment.querySelector('svg');
  
  toastFragment.querySelector('.toast-msg').textContent = message;

  if (type === 'warning') {
    toastElem.classList.add('toast-warning');
    svgElem.innerHTML = `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`;
  } else if (type === 'info') {
    toastElem.classList.add('toast-info');
    svgElem.innerHTML = `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`;
  }

  DOM.toastContainer.append(toastFragment);

  // Re-promote to top of Top Layer stack
  try { DOM.toastContainer.hidePopover(); } catch (e) {}
  DOM.toastContainer.showPopover();
  
  setTimeout(() => {
    toastElem.remove();
    if (!DOM.toastContainer.children.length) {
      try { DOM.toastContainer.hidePopover(); } catch (e) {}
    }
  }, 3000);
};

// Synchronize matrix size with rowsCount & colsCount
const syncMatrix = () => {
  while (matrix.length < rowsCount) matrix.push(new Array(colsCount).fill(''));
  if (matrix.length > rowsCount) matrix.length = rowsCount;

  for (let r = 0; r < rowsCount; r++) {
    while (matrix[r].length < colsCount) matrix[r].push('');
    if (matrix[r].length > colsCount) matrix[r].length = colsCount;
  }
};

// 4. Table Rendering via Template Cloning (Editor View)
const renderTable = () => {
  syncMatrix();
  DOM.excelTable.replaceChildren();

  // Create Header Row (Corner + Column headers)
  const thead = document.createElement('thead');
  const headerTr = document.createElement('tr');

  const cornerTh = document.createElement('th');
  cornerTh.className = 'corner-header';
  cornerTh.textContent = '＃';
  headerTr.append(cornerTh);

  for (let c = 0; c < colsCount; c++) {
    const colFragment = DOM.tplColHeader.content.cloneNode(true);
    const th = colFragment.querySelector('th');

    colFragment.querySelector('.col-title').textContent = getColumnLabel(c);

    const badge = colFragment.querySelector('.header-tag-badge');
    if (c >= headerColsCount) {
      badge.remove();
    }

    // Bind Actions
    colFragment.querySelector('.btn-add-left').onclick = (e) => { e.stopPropagation(); insertColumn(c); };
    colFragment.querySelector('.btn-del-col').onclick = (e) => { e.stopPropagation(); deleteColumn(c); };
    colFragment.querySelector('.btn-add-right').onclick = (e) => { e.stopPropagation(); insertColumn(c + 1); };

    headerTr.append(th);
  }
  thead.append(headerTr);
  DOM.excelTable.append(thead);

  // Create Body Rows
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rowsCount; r++) {
    const tr = document.createElement('tr');

    // Row Header Cell
    const rowFragment = DOM.tplRowHeader.content.cloneNode(true);
    const rowTd = rowFragment.querySelector('td');

    rowFragment.querySelector('.row-title').textContent = r + 1;

    const badge = rowFragment.querySelector('.header-tag-badge');
    if (r >= headerRowsCount) {
      badge.remove();
    }

    rowFragment.querySelector('.btn-add-above').onclick = (e) => { e.stopPropagation(); insertRow(r); };
    rowFragment.querySelector('.btn-del-row').onclick = (e) => { e.stopPropagation(); deleteRow(r); };
    rowFragment.querySelector('.btn-add-below').onclick = (e) => { e.stopPropagation(); insertRow(r + 1); };
    tr.append(rowTd);

    // Data Cells
    for (let c = 0; c < colsCount; c++) {
      const cellFragment = DOM.tplDataCell.content.cloneNode(true);
      const dataTd = cellFragment.querySelector('td');
      const textarea = cellFragment.querySelector('textarea');

      const isHeaderCell = r < headerRowsCount || c < headerColsCount;
      if (isHeaderCell) dataTd.classList.add('is-th-cell');

      textarea.value = matrix[r][c] || '';
      textarea.placeholder = isHeaderCell ? '[th セル]' : '[td セル]';

      const autoAdjust = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
      };

      textarea.oninput = (e) => {
        matrix[r][c] = e.target.value;
        autoAdjust();
      };
      textarea.onfocus = autoAdjust;

      tr.append(dataTd);
      setTimeout(autoAdjust, 0);
    }

    tbody.append(tr);
  }
  DOM.excelTable.append(tbody);
};

// 5. Grid Modifiers
const insertRow = (index) => {
  matrix.splice(index, 0, new Array(colsCount).fill(''));
  rowsCount++;
  DOM.inputRows.value = rowsCount;
  renderTable();
};

const deleteRow = (index) => {
  if (rowsCount <= 1) return showToast('これ以上行を削除できません（最小1行）', 'warning');
  matrix.splice(index, 1);
  rowsCount--;
  DOM.inputRows.value = rowsCount;
  renderTable();
};

const insertColumn = (index) => {
  matrix.forEach(row => row.splice(index, 0, ''));
  colsCount++;
  DOM.inputCols.value = colsCount;
  renderTable();
};

const deleteColumn = (index) => {
  if (colsCount <= 1) return showToast('これ以上列を削除できません（最小1列）', 'warning');
  matrix.forEach(row => row.splice(index, 1));
  colsCount--;
  DOM.inputCols.value = colsCount;
  renderTable();
};

// 6. DOM-based HTML Output Generator & Serializer
const buildTableElement = () => {
  const table = document.createElement('table');

  const appendCellContent = (cell, text = '') => {
    text.split('\n').forEach((line, idx) => {
      if (idx > 0) cell.append(document.createElement('br'));
      if (line) cell.append(line);
    });
  };

  // Header Rows (thead)
  if (headerRowsCount > 0) {
    const thead = document.createElement('thead');
    const endHeaderRow = Math.min(headerRowsCount, rowsCount);
    for (let r = 0; r < endHeaderRow; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < colsCount; c++) {
        const th = document.createElement('th');
        appendCellContent(th, matrix[r][c]);
        tr.append(th);
      }
      thead.append(tr);
    }
    table.append(thead);
  }

  // Body Rows (tbody)
  if (headerRowsCount < rowsCount) {
    const tbody = document.createElement('tbody');
    for (let r = headerRowsCount; r < rowsCount; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < colsCount; c++) {
        const tag = c < headerColsCount ? 'th' : 'td';
        const cell = document.createElement(tag);
        appendCellContent(cell, matrix[r][c]);
        tr.append(cell);
      }
      tbody.append(tr);
    }
    table.append(tbody);
  }

  return table;
};

// Recursive Serializer for Pretty Format
const serializePretty = (element, level = 0) => {
  const indent = '  '.repeat(level);
  const tagName = element.tagName.toLowerCase();

  // Leaf elements (th, td) formatted inline
  if (tagName === 'th' || tagName === 'td') {
    return `${indent}<${tagName}>${element.innerHTML}</${tagName}>`;
  }

  // Block elements (table, thead, tbody, tr) formatted with indentation
  const childrenHTML = Array.from(element.children)
    .map(child => serializePretty(child, level + 1))
    .join('\n');

  return `${indent}<${tagName}>\n${childrenHTML}\n${indent}</${tagName}>`;
};

// High-level HTML Generator
const generateHTML = (formatStyle = 'pretty') => {
  const tableElem = buildTableElement();
  return formatStyle === 'pretty' ? serializePretty(tableElem) : tableElem.outerHTML;
};

// 7. Clipboard Copy Function (Modern Clipboard API for Chrome/Edge)
const copyToClipboard = async (text) => {
  const htmlBlob = new Blob([text], { type: 'text/html' });
  const textBlob = new Blob([text], { type: 'text/plain' });
  await navigator.clipboard.write([
    new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
  ]);
};

// Open minimal contenteditable preview window in new tab
const openPreviewWindow = () => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html contenteditable="true" spellcheck="false">
        <head>
          <meta charset="UTF-8">
          <style>
          html,
          body {
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          table {
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #ccc;
            padding: 8px;
          }
          </style>
        </head>
        <body></body>
      </html>`
    );
    win.document.close();
  }
};

// 8. Event Initialization
const initEvents = () => {
  DOM.inputRows.onchange = (e) => {
    rowsCount = Math.max(1, Math.min(100, +e.target.value || 1));
    headerRowsCount = Math.min(headerRowsCount, rowsCount);
    DOM.headerRows.max = rowsCount;
    DOM.headerRows.value = headerRowsCount;
    e.target.value = rowsCount;
    renderTable();
  };

  DOM.inputCols.onchange = (e) => {
    colsCount = Math.max(1, Math.min(50, +e.target.value || 1));
    headerColsCount = Math.min(headerColsCount, colsCount);
    DOM.headerCols.max = colsCount;
    DOM.headerCols.value = headerColsCount;
    e.target.value = colsCount;
    renderTable();
  };

  DOM.headerRows.onchange = (e) => {
    headerRowsCount = Math.max(0, Math.min(rowsCount, +e.target.value || 0));
    e.target.value = headerRowsCount;
    renderTable();
  };

  DOM.headerCols.onchange = (e) => {
    headerColsCount = Math.max(0, Math.min(colsCount, +e.target.value || 0));
    e.target.value = headerColsCount;
    renderTable();
  };

  // Open Preview Data URL in new tab
  DOM.btnOpenPreview.onclick = openPreviewWindow;

  // Open Output Dialog
  DOM.btnExport.onclick = () => {
    const selectedFormat = document.querySelector('input[name="format-style"]:checked')?.value || 'pretty';
    DOM.htmlOutput.value = generateHTML(selectedFormat);
    DOM.dialog.showModal();
  };

  // Dynamically update output code format inside dialog
  document.querySelectorAll('input[name="format-style"]').forEach(radio => {
    radio.onchange = (e) => {
      DOM.htmlOutput.value = generateHTML(e.target.value);
    };
  });

  DOM.btnCopy.onclick = async () => {
    await copyToClipboard(DOM.htmlOutput.value);
    showToast('HTML（テーブル形式）としてクリップボードにコピーしました！');
  };

  DOM.btnCloseX.onclick = () => DOM.dialog.close();

  DOM.dialog.onclick = (e) => {
    const rect = DOM.dialog.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) {
      DOM.dialog.close();
    }
  };
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  initEvents();
});
