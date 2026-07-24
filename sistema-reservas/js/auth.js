// SISTEMA DE AUTENTICACIÓN

const roles = {
  ADMINISTRADOR: { permisos: ["panel", "mesas", "reservas", "pedidos", "despachos", "usuarios"] },
  MESERO: { permisos: ["mesas", "reservas", "pedidos", "despachos"] },
  COCINA: { permisos: ["pedidos"] },
  DESPACHO: { permisos: ["despachos"] }
};

function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').replace(/['";]/g, '').trim();
}

function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  return /^[a-zA-Z0-9]{10,}$/.test(username);
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

function autenticarUsuario(usuarioInput, passwordInput) {
  try {
    const usuarios = obtenerUsuarios();
    return usuarios.find(u => u.usuario === usuarioInput && (u.password === passwordInput || u.passHash === passwordInput));
  } catch (error) {
    console.error("Error al autenticar usuario:", error);
    return null;
  }
}

function guardarSesionActiva(usuarioObj) {
  try {
    const sesion = {
      usuario: usuarioObj.usuario,
      rol: usuarioObj.rol,
      permisos: roles[usuarioObj.rol] ? roles[usuarioObj.rol].permisos : []
    };
    guardarEncrypted("sesionActiva", sesion);
  } catch (error) {
    console.error("Error al guardar la sesión:", error);
  }
}

function obtenerSesionActiva() {
  try {
    return obtenerEncrypted("sesionActiva");
  } catch (error) {
    return null;
  }
}

function cerrarSesion() {
  localStorage.removeItem("sesionActiva");
}

// VALIDACIONES
function validarFormulario() {
  const usuario = document.getElementById("usuario");
  const password = document.getElementById("password");
  const errorUsuario = document.getElementById("errorUsuario");
  const errorPassword = document.getElementById("errorPassword");
  let validacionCorrecta = true;

  if (!usuario || !password) return false;

  const usuarioVal = sanitizeInput(usuario.value);
  if (!isValidUsername(usuarioVal)) {
    if (errorUsuario) errorUsuario.textContent = "Usuario inválido (mínimo 10 caracteres, solo letras y números)";
    validacionCorrecta = false;
  } else {
    if (errorUsuario) errorUsuario.textContent = "";
  }

  if (!isValidPassword(password.value)) {
    if (errorPassword) errorPassword.textContent = "Contraseña inválida (mínimo 8 caracteres, mayúscula, minúscula, número y especial)";
    validacionCorrecta = false;
  } else {
    if (errorPassword) errorPassword.textContent = "";
  }

  return validacionCorrecta;
}

function validarUsuarioModal() {
  const usuario = document.getElementById("nuevoUsuarioNombre");
  const password = document.getElementById("nuevoUsuarioPass");
  const errorUsuario = document.getElementById("errorNuevoUsuario");
  const errorPassword = document.getElementById("errorNuevoPass");
  let esValido = true;

  if (!usuario || !password) return false;

  const usuarioVal = sanitizeInput(usuario.value);
  if (!isValidUsername(usuarioVal)) {
    if (errorUsuario) errorUsuario.textContent = "Usuario inválido (mínimo 10 caracteres, solo letras y números)";
    esValido = false;
  } else {
    if (errorUsuario) errorUsuario.textContent = "";
  }

  if (!isValidPassword(password.value)) {
    if (errorPassword) errorPassword.textContent = "Contraseña inválida (mínimo 8 caracteres, mayúscula, minúscula, número y especial)";
    esValido = false;
  } else {
    if (errorPassword) errorPassword.textContent = "";
  }

  return esValido;
}

function mostrarError(elemento, mensaje) {
  if (elemento) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
  }
}

function ocultarError(elemento) {
  if (elemento) {
    elemento.textContent = '';
    elemento.style.display = 'none';
  }
}

// GUARDIA DE SEGURIDAD PARA VISTAS
function protegerRuta(rolRequerido) {
  const sesion = obtenerSesionActiva();

  if (!sesion || !sesion.rol) {
    window.location.href = 'index.html';
    return false;
  }

  if (sesion.rol !== rolRequerido) {
    redirigirPorRol(sesion.rol);
    return false;
  }

  return true;
}