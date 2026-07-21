// ========================================================================
// MESA DE CONTROL — módulo compartido (extraído de braita-innovacion.html)
// ========================================================================
// Arma un pedido de despiece (piezas + cantos), calcula un resumen en vivo
// y lo manda por WhatsApp; guarda una copia en la misma base de Supabase
// que ya usa Braita Innovación (tabla pedidos_maquila) para que aparezca
// en el mismo panel de administrador central (braita-innovacion.html#panel-admin).
//
// Cómo usarlo en una página nueva:
//   1. Copia el HTML de la sección "mesa-control" de braita-innovacion.html
//      tal cual (mismos IDs: despiece-table, table-body-rows, row-counter,
//      summaryStrip/sumPiezas/sumArea/sumCanto/sumTableros, client-name,
//      client-company, client-phone, master-material, client-notes),
//      cambiando solo las <option> del <select id="master-material"> por
//      el catálogo real de esa marca.
//   2. Copia también el CSS de esa sección (mesa-control-section,
//      blueprint-panel, despiece-table, control-form, form-group,
//      summary-strip, btn-add-row, btn-remove-row, btn-copy-summary) y el
//      de #toast-container/.toast, adaptando los colores a las variables
//      propias de la página.
//   3. Agrega <div id="toast-container"></div> en el body.
//   4. Antes de este <script>, define en la página:
//        const MESA_WA_NUMBER = '523921287299';
//        const MESA_MARCA = 'Braita Select'; // nombre visible de la marca
//   5. Incluye <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//      y luego <script src="mesa-control.js"></script>.
//
// No se duplica el panel de administrador (login + tabla de pedidos) en
// cada página a propósito: vive solo en braita-innovacion.html para tener
// una sola vista central de pedidos de todo el grupo, en vez de 5 paneles
// separados con su propio login. El origen (marca) de cada pedido queda
// registrado como una línea dentro de "notas" — no se agregó una columna
// nueva a la tabla de Supabase porque no hay forma de confirmar el schema
// real desde aquí sin arriesgar un error de inserción.
// ========================================================================

(function () {
  const WA_NUMBER = typeof MESA_WA_NUMBER !== 'undefined' ? MESA_WA_NUMBER : '523921287299';
  const MARCA = typeof MESA_MARCA !== 'undefined' ? MESA_MARCA : 'Braita';

  const tableBody = document.getElementById('table-body-rows');
  const rowCounter = document.getElementById('row-counter');
  if (!tableBody) return; // esta página no tiene Mesa de Control montada

  function updateRowCounter() {
    const count = tableBody.querySelectorAll('tr').length;
    if (rowCounter) rowCounter.textContent = `${count} ${count === 1 ? 'Pieza' : 'Piezas'} en listado`;
  }

  window.addNewRow = function addNewRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" placeholder="Ej: Repisa superior" value="Nueva Pieza"></td>
      <td><input type="number" placeholder="0" value="400"></td>
      <td><input type="number" placeholder="0" value="300"></td>
      <td><input type="number" placeholder="1" value="1"></td>
      <td>
        <select>
          <option value="Ninguno">Ninguno</option>
          <option value="2 Largos">2 Largos</option>
          <option value="1 Largo 1 Ancho">1 Largo / 1 Ancho</option>
          <option value="Perimetral (4 lados)">Perimetral (4 lados)</option>
        </select>
      </td>
      <td>
        <button class="btn-remove-row" title="Eliminar fila" onclick="deleteRow(this)">
          <svg style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
    updateRowCounter();
    calcSummary();
    createToast('Nueva fila de despiece agregada.');
  };

  window.deleteRow = function deleteRow(button) {
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length <= 1) {
      createToast('Error: la orden debe contener al menos una pieza.');
      return;
    }
    button.closest('tr').remove();
    updateRowCounter();
    calcSummary();
  };

  // Mismas constantes/lógica que braita-innovacion.html: tablero estándar
  // 244 x 122 cm y 15% de merma como referencia rápida, no como cálculo
  // exacto de optimización de corte.
  const AREA_TABLERO_M2 = 2.44 * 1.22;
  const FACTOR_MERMA = 1.15;

  window.calcSummary = function calcSummary() {
    const rows = tableBody.querySelectorAll('tr');
    let totalPiezas = 0;
    let areaTotalM2 = 0;
    let cantoTotalMM = 0;

    rows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      const select = row.querySelector('select');
      const largoMM = parseFloat(inputs[1].value) || 0;
      const anchoMM = parseFloat(inputs[2].value) || 0;
      const cant = parseFloat(inputs[3].value) || 0;
      totalPiezas += cant;
      areaTotalM2 += (largoMM * anchoMM * cant) / 1000000;

      const canto = select ? select.value : 'Ninguno';
      let cantoPorPiezaMM = 0;
      if (canto === '2 Largos') cantoPorPiezaMM = largoMM * 2;
      else if (canto === '1 Largo 1 Ancho') cantoPorPiezaMM = largoMM + anchoMM;
      else if (canto === 'Perimetral (4 lados)') cantoPorPiezaMM = (largoMM + anchoMM) * 2;
      cantoTotalMM += cantoPorPiezaMM * cant;
    });

    const tablerosEstimados = areaTotalM2 > 0
      ? Math.ceil((areaTotalM2 * FACTOR_MERMA) / AREA_TABLERO_M2)
      : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sumPiezas', totalPiezas);
    set('sumArea', `${areaTotalM2.toFixed(2)} m²`);
    set('sumCanto', `${(cantoTotalMM / 1000).toFixed(2)} m`);
    set('sumTableros', tablerosEstimados);
  };

  tableBody.addEventListener('input', calcSummary);
  tableBody.addEventListener('change', calcSummary);

  window.copiarResumen = function copiarResumen() {
    const rows = tableBody.querySelectorAll('tr');
    let texto = `RESUMEN DE PEDIDO — ${MARCA.toUpperCase()}\n`;
    texto += '--------------------------------\n';
    rows.forEach((row, i) => {
      const inputs = row.querySelectorAll('input');
      const select = row.querySelector('select');
      texto += `[${i + 1}] ${inputs[0].value} -> ${inputs[1].value}x${inputs[2].value}mm | Cant: ${inputs[3].value} | Canto: ${select.value}\n`;
    });
    texto += '--------------------------------\n';
    texto += `${document.getElementById('sumPiezas').textContent} piezas · ${document.getElementById('sumArea').textContent} · ${document.getElementById('sumCanto').textContent} de canto · ~${document.getElementById('sumTableros').textContent} tablero(s) estimados\n`;
    const materialEl = document.getElementById('master-material');
    if (materialEl) texto += 'Material: ' + materialEl.value;

    navigator.clipboard.writeText(texto).then(() => {
      createToast('Resumen copiado al portapapeles.');
    }).catch(() => {
      createToast('No se pudo copiar automáticamente, selecciona el texto manualmente.');
    });
  };

  window.createToast = function createToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg style="width:18px;height:18px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  };

  const buildWhatsAppLink = (mensaje) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  // ---- Supabase (mismo proyecto que braita-innovacion.html, confirmado con
  // el cliente — project ref: gtpmffjzbiwghaibiprv). Guarda en la MISMA
  // tabla pedidos_maquila, mismas columnas ya existentes (nombre, empresa,
  // teléfono, material, notas, piezas, estado) — la marca de origen se
  // agrega como primera línea de "notas", no como columna nueva. ----
  let guardarOrdenEnSupabase = null;
  try {
    const SUPABASE_URL = 'https://gtpmffjzbiwghaibiprv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cG1mZmp6Yml3Z2hhaWJpcHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTM3MzYsImV4cCI6MjA5OTEyOTczNn0.SB8QRRiUlh1mNEfH3rDfkxYSk-A--dWF_77jZE8sseM';
    if (typeof window.supabase === 'undefined') {
      throw new Error('El script de Supabase no cargó.');
    }
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    guardarOrdenEnSupabase = async function (orden) {
      const { error } = await supabase.from('pedidos_maquila').insert([{
        nombre: orden.nombre,
        empresa: orden.empresa,
        telefono: orden.telefono,
        material: orden.material,
        notas: orden.notas,
        piezas: orden.piezas,
        estado: 'nuevo',
      }]);
      if (error) throw error;
    };
  } catch (err) {
    console.error('Mesa de Control: no se pudo inicializar Supabase.', err);
  }

  window.processOrderToWhatsApp = async function processOrderToWhatsApp() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientCompany = document.getElementById('client-company').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const masterMaterial = document.getElementById('master-material').value;
    const clientNotesRaw = document.getElementById('client-notes').value.trim();
    const clientNotes = `Marca: ${MARCA}${clientNotesRaw ? ' — ' + clientNotesRaw : ''}`;

    if (!clientName || !clientPhone) {
      createToast('Campos obligatorios: Nombre y Línea Móvil de validación.');
      return;
    }

    let despieceDataString = '';
    const piezasArray = [];
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach((row, index) => {
      const inputs = row.querySelectorAll('input');
      const select = row.querySelector('select');
      const label = inputs[0].value || `Pieza ${index + 1}`;
      const largo = inputs[1].value || '0';
      const ancho = inputs[2].value || '0';
      const cant = inputs[3].value || '1';
      const canto = select.value;
      despieceDataString += `\n[${index + 1}] ${label} -> ${largo}x${ancho}mm | Cant: ${cant} | Canto: ${canto}`;
      piezasArray.push({ label, largo, ancho, cant, canto });
    });

    const resumenLinea = `${document.getElementById('sumPiezas').textContent} piezas · ${document.getElementById('sumArea').textContent} · ${document.getElementById('sumCanto').textContent} de canto · ~${document.getElementById('sumTableros').textContent} tablero(s) estimados`;

    const finalMessage = `ORDEN DE MAQUILA — ${MARCA.toUpperCase()}
--------------------------------------------------
OPERADOR: ${clientName}
EMPRESA: ${clientCompany || 'Particular'}
CONTACTO ENLACE: ${clientPhone}
MATERIAL BASE SELECCIONADO: ${masterMaterial}
--------------------------------------------------
MATRIZ DE PIEZAS A COMPUTAR:${despieceDataString}
--------------------------------------------------
RESUMEN: ${resumenLinea}
--------------------------------------------------
NOTAS ADICIONALES: ${clientNotes}
--------------------------------------------------
*Solicito validación de rendimiento geométrico y cotización formal de hojas más servicios de corte.*`;

    if (typeof guardarOrdenEnSupabase === 'function') {
      try {
        await guardarOrdenEnSupabase({
          nombre: clientName,
          empresa: clientCompany || 'Particular',
          telefono: clientPhone,
          material: masterMaterial,
          notas: clientNotes,
          piezas: piezasArray,
        });
      } catch (err) {
        console.error('No se pudo guardar la orden en la base de datos:', err);
      }
    }

    createToast('Orden estructurada. Redirigiendo a WhatsApp...');
    setTimeout(() => {
      window.open(buildWhatsAppLink(finalMessage), '_blank');
    }, 800);
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateRowCounter();
    calcSummary();
  });
})();
