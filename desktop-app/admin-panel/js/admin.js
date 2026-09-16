/* ==========================================================================
   ANDREA ROCK FITNESS — PANEL ADMIN JS (admin-panel/js/admin.js)
   ========================================================================== */

const API_BASE = '/api/admin';

document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();
});

async function cargarClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes`);
    const clientes = await res.json();
    renderTablaClientes(clientes);
  } catch (err) {
    console.error('Error al cargar clientes:', err);
  }
}

function renderTablaClientes(clientes) {
  const tbody = document.getElementById('tablaClientesBody');
  if (!tbody) return;

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted);">No hay clientes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td><span class="badge">${c.code}</span></td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.preferencia.toUpperCase()}</td>
      <td>${new Date(c.creadoEn).toLocaleDateString()}</td>
      <td><span style="color:${c.activo ? '#34d399' : '#f87171'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="btn-ghost" style="color:#f87171; padding:4px 8px; font-size:12px;" onclick="eliminarCliente('${c.code}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalNuevo() {
  document.getElementById('modalCliente').classList.add('show');
}

function cerrarModalNuevo() {
  document.getElementById('modalCliente').classList.remove('show');
}

async function crearClienteAdmin() {
  const nombre = document.getElementById('cliNombre').value.trim();
  const preferencia = document.getElementById('cliPreferencia').value;
  const peso = document.getElementById('cliPeso').value;

  if (!nombre) {
    alert('Por favor ingresa el nombre del cliente.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/clientes/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, preferencia, peso })
    });

    const data = await res.json();
    if (data.exito) {
      alert(`¡Cliente generado exitosamente!\nToken asignado: ${data.cliente.code}`);
      cerrarModalNuevo();
      document.getElementById('cliNombre').value = '';
      cargarClientes();
    } else {
      alert(data.error || 'Error al generar cliente');
    }
  } catch (err) {
    alert('Error de conexión con el servidor backend');
  }
}

async function eliminarCliente(code) {
  if (!confirm(`¿Estás segura de eliminar al cliente con token ${code}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/clientes/${code}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.exito) {
      cargarClientes();
    }
  } catch (err) {
    alert('Error al eliminar cliente');
  }
}/* ==========================================================================
   ANDREA ROCK FITNESS — DASHBOARD DE ADMINISTRACIÓN Y ENTRENADORA (admin-panel/js/admin.js)
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : 'https://andrearockfitness.com/api';

let adminToken = localStorage.getItem('adminToken') || null;
let listaClientes = [];
let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSesionAdmin();
});

/* ================= AUTENTICACIÓN ADMIN ================= */
function verificarSesionAdmin() {
  const loginSection = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');

  if (adminToken) {
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    cargarClientes();
  } else {
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
  }
}

async function loginAdmin() {
  const usuario = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value.trim();
  const msgEl = document.getElementById('loginMsg');

  if (!usuario || !password) {
    if (msgEl) msgEl.textContent = 'Por favor ingresa usuario y contraseña.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (res.ok && data.exito) {
      adminToken = data.token;
      localStorage.setItem('adminToken', adminToken);
      verificarSesionAdmin();
    } else {
      if (msgEl) msgEl.textContent = data.error || 'Credenciales incorrectas.';
    }
  } catch (err) {
    if (msgEl) msgEl.textContent = 'Error al conectar con el servidor central.';
  }
}

function logoutAdmin() {
  adminToken = null;
  localStorage.removeItem('adminToken');
  verificarSesionAdmin();
}

/* ================= GESTIÓN DE CLIENTES ================= */
async function cargarClientes() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/clientes`);
    listaClientes = await res.json();
    renderListaClientes();
  } catch (err) {
    console.error('Error al cargar la lista de clientes:', err);
  }
}

function renderListaClientes() {
  const tbody = document.getElementById('tablaClientesBody');
  if (!tbody) return;

  if (listaClientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#a0aec0;">No hay clientes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = listaClientes.map(c => `
    <tr style="border-bottom:1px solid #2d3748;">
      <td style="padding:10px; font-weight:bold; color:#e2e8f0;">${c.nombre}</td>
      <td style="padding:10px; font-family:monospace; color:#319795;">${c.code}</td>
      <td style="padding:10px; color:#cbd5e0;">${c.datosNutricion?.peso || '--'} kg</td>
      <td style="padding:10px; color:#cbd5e0;">${c.preferencia ? c.preferencia.toUpperCase() : 'SIN RESTRICCIÓN'}</td>
      <td style="padding:10px;">
        <span style="background:${c.activo ? '#276749' : '#9b2c2c'}; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px;">
          ${c.activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </td>
      <td style="padding:10px; text-align:right;">
        <button onclick="seleccionarClienteAdmin('${c.code}')" style="background:#3182ce; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer;">Gestionar</button>
        <button onclick="eliminarClienteAdmin('${c.code}')" style="background:#e53e3e; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer; margin-left:4px;">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

async function crearNuevoClienteAdmin() {
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const peso = document.getElementById('nuevoPeso').value;
  const altura = document.getElementById('nuevaAltura').value;
  const edad = document.getElementById('nuevaEdad').value;
  const sexo = document.getElementById('nuevoSexo').value;
  const preferencia = document.getElementById('nuevaPreferencia').value;

  if (!nombre) {
    alert('El nombre del cliente es obligatorio.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/clientes/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, peso, altura, edad, sexo, preferencia })
    });

    const data = await res.json();

    if (res.ok && data.exito) {
      alert(`Cliente creado con éxito. Código de acceso: ${data.cliente.code}`);
      cargarClientes();
      cerrarModalAdmin('modalNuevoCliente');
    } else {
      alert(data.error || 'Error al crear cliente.');
    }
  } catch (err) {
    alert('Error al comunicarse con el servidor.');
  }
}

function seleccionarClienteAdmin(code) {
  clienteSeleccionado = listaClientes.find(c => c.code === code);
  if (!clienteSeleccionado) return;

  const detailEl = document.getElementById('detalleClienteSection');
  if (detailEl) detailEl.classList.remove('hidden');

  document.getElementById('detalleNombre').textContent = clienteSeleccionado.nombre;
  document.getElementById('detalleCodigo').textContent = clienteSeleccionado.code;

  renderEditorRutinas();
}

async function guardarCambiosClienteAdmin() {
  if (!clienteSeleccionado) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/clientes/${clienteSeleccionado.code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteSeleccionado)
    });

    const data = await res.json();
    if (res.ok && data.exito) {
      alert('Cambios sincronizados con la app del cliente.');
      cargarClientes();
    } else {
      alert(data.error || 'Error al sincronizar datos.');
    }
  } catch (err) {
    alert('Error de conexión con el servidor.');
  }
}

async function eliminarClienteAdmin(code) {
  if (!confirm(`¿Seguro que deseas eliminar al cliente con token ${code}?`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/clientes/${code}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      alert('Cliente eliminado.');
      cargarClientes();
    }
  } catch (err) {
    alert('Error al eliminar cliente.');
  }
}

/* ================= MODALES UTILITARIOS ================= */
function abrirModalAdmin(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function cerrarModalAdmin(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}