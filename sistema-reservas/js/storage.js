
const secretKey = "ReservaRest2026SecureKey#";

// FUNCIONES DE CIFRADO Y DESCIFRADO
function encrypt(text) {
  if (!text) return '';
  try {
    const utf8Text = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => 
      String.fromCharCode('0x' + p1)
    );
    let result = '';
    for (let i = 0; i < utf8Text.length; i++) {
      const charCode = utf8Text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch (e) {
    return '';
  }
}

function decrypt(encoded) {
  if (!encoded) return null;
  try {
    const decoded = atob(encoded);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
      result += String.fromCharCode(charCode);
    }
    return decodeURIComponent(
      Array.prototype.map.call(result, c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch (e) {
    return null;
  }
}

function guardarEncrypted(key, data) {
  const jsonString = JSON.stringify(data);
  const encryptedData = encrypt(jsonString);
  Storage.prototype.setItem.call(localStorage, key, encryptedData);
}

function obtenerEncrypted(key) {
  const rawData = Storage.prototype.getItem.call(localStorage, key);
  if (!rawData) return null;

  const decryptedString = decrypt(rawData);
  if (!decryptedString) return null;

  try {
    return JSON.parse(decryptedString);
  } catch {
    return null;
  }
}

// DATOS POR DEFECTO
const defaultUsuarios = [
  { usuario: "AdminJuan18", password: "Admin123.", rol: "ADMINISTRADOR" },
  { usuario: "meseroJuan18", password: "Mesero123.", rol: "MESERO" },
  { usuario: "cocinaJuan18", password: "Cocina123.", rol: "COCINA" },
  { usuario: "despachoJuan18", password: "Despacho123.", rol: "DESPACHO" }
];

const defaultMesas = [
  { numero: 1, capacidad: 2, zona: "Terraza", estado: "Disponible" },
  { numero: 2, capacidad: 4, zona: "Terraza", estado: "Ocupada" },
  { numero: 3, capacidad: 4, zona: "Salón", estado: "Disponible" },
  { numero: 4, capacidad: 6, zona: "Salón", estado: "Disponible" },
  { numero: 5, capacidad: 2, zona: "Barra", estado: "Disponible" },
  { numero: 6, capacidad: 8, zona: "VIP", estado: "Disponible" },
  { numero: 7, capacidad: 4, zona: "Salón", estado: "Disponible" },
  { numero: 8, capacidad: 4, zona: "Terraza", estado: "Disponible" }
];

const defaultPlatos = [
  { id: 1, nombre: "Ceviche clásico", precio: 30 },
  { id: 2, nombre: "Lomo saltado", precio: 35 },
  { id: 3, nombre: "Arroz con pollo", precio: 25 },
  { id: 4, nombre: "Ají de gallina", precio: 28 },
  { id: 5, nombre: "Bandeja Paisa", precio: 32 },
  { id: 6, nombre: "Sancocho trifásico", precio: 26 },
  { id: 7, nombre: "Churrasco", precio: 40 },
  { id: 8, nombre: "Pescado frito", precio: 34 }
];

function obtenerUsuarios() {
  const usuarios = obtenerEncrypted('usuariosRestaurante');
  if (!usuarios || usuarios.length === 0) {
    guardarEncrypted('usuariosRestaurante', defaultUsuarios);
    return defaultUsuarios;
  }
  return usuarios;
}

function inicializarUsuariosDemo() {
  const usuarios = obtenerEncrypted('usuariosRestaurante');
  if (!usuarios || usuarios.length === 0) {
    guardarEncrypted('usuariosRestaurante', defaultUsuarios);
  }
}

function resetearUsuariosDemo() {
  guardarEncrypted('usuariosRestaurante', defaultUsuarios);
}

function guardarNuevoUsuario(nuevoUsuario, passwordTextoPlano, rolElegido) {
  const usuarios = obtenerUsuarios();
  if (typeof roles === "undefined" || !roles[rolElegido]) {
    return { exito: false, mensaje: 'El rol seleccionado no es válido.' };
  }
  
  const existe = usuarios.some(u => u.usuario.toLowerCase() === nuevoUsuario.toLowerCase());
  if (existe) {
    return { exito: false, mensaje: 'El nombre de usuario ya está registrado.' };
  }

  usuarios.push({
    usuario: nuevoUsuario,
    password: passwordTextoPlano,
    rol: rolElegido
  });

  guardarEncrypted('usuariosRestaurante', usuarios);
  return { exito: true, mensaje: 'Usuario registrado con éxito.' };
}

function obtenerMesas() {
  const guardadas = obtenerEncrypted("mesasRestaurante");
  if (!guardadas) {
    guardarEncrypted("mesasRestaurante", defaultMesas);
    return defaultMesas;
  }
  return guardadas;
}

function guardarMesas(mesas) { guardarEncrypted("mesasRestaurante", mesas); }
function obtenerPlatos() { return defaultPlatos; }
function obtenerReservas() { return obtenerEncrypted("reservasRestaurante") || []; }
function guardarReservas(reservas) { guardarEncrypted("reservasRestaurante", reservas); }
function obtenerPedidos() { return obtenerEncrypted("pedidosRestaurante") || []; }
function guardarPedidos(pedidos) { guardarEncrypted("pedidosRestaurante", pedidos); }
function obtenerDespachos() { return obtenerEncrypted("despachosRestaurante") || []; }
function guardarDespachos(despachos) { guardarEncrypted("despachosRestaurante", despachos); }

obtenerUsuarios();