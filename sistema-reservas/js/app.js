
// CARGA DE VISTAS

function inicializarSistema() {
  try {
    if (typeof inicializarUsuariosDemo === "function") {
      inicializarUsuariosDemo();
    }
  } catch (error) {
    console.error("Error al cargar usuarios demo:", error);
  }
}

inicializarSistema();

function redirigirPorRol(rol) {
  const rutas = {
    'ADMINISTRADOR': 'administrador.html',
    'MESERO': 'mesero.html',
    'COCINA': 'cocina.html',
    'DESPACHO': 'despacho.html'
  };
  window.location.href = rutas[rol] || 'index.html';
}

function iniciarSesion(evento) {
  if (evento) evento.preventDefault();
  if (typeof validarFormulario === "function" && !validarFormulario()) return;

  const usuarioEscrito = document.getElementById("usuario").value;
  const passwordEscrita = document.getElementById("password").value;

  try {
    const usuarioEncontrado = autenticarUsuario(usuarioEscrito, passwordEscrita);

    if (usuarioEncontrado) {
      guardarSesionActiva(usuarioEncontrado);
      const sesion = obtenerSesionActiva();
      redirigirPorRol(sesion.rol);
    } else {
      const errorPassword = document.getElementById("errorPassword");
      if (typeof mostrarError === "function") {
        mostrarError(errorPassword, "Usuario o contraseña incorrectos.");
      } else {
        alert("Usuario o contraseña incorrectos.");
      }
    }
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);
    alert("Hubo un problema al intentar iniciar sesión.");
  }
}

function activarSeccion(nombreSeccion) {
  const secciones = document.querySelectorAll(".section");
  secciones.forEach(seccion => {
    if (seccion.id === "section-" + nombreSeccion) {
      seccion.classList.add("active");
      seccion.style.display = "block";
    } else {
      seccion.classList.remove("active");
      seccion.style.display = "none";
    }
  });

  const botones = document.querySelectorAll(".nav-btn");
  botones.forEach(boton => {
    if (boton.getAttribute("data-section") === nombreSeccion) {
      boton.classList.add("active");
    } else {
      boton.classList.remove("active");
    }
  });

  const renderFunciones = {
    'panel': renderizarPanelEstadisticas,
    'mesas': renderizarMesas,
    'reservas': renderizarReservas,
    'pedidos': renderizarPedidos,
    'despachos': renderizarDespachos,
    'usuarios': renderizarUsuarios
  };

  if (renderFunciones[nombreSeccion]) {
    renderFunciones[nombreSeccion]();
  }
}

function salirDeLaApp() {
  try {
    if (typeof cerrarSesion === "function") cerrarSesion();
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

// INICIALIZADOR AUTOMÁTICO Y PROTECTOR DE VISTAS SEGÚN EL HTML
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('administrador.html') && protegerRuta('ADMINISTRADOR')) {
    activarSeccion('panel');
  } else if (path.includes('mesero.html') && protegerRuta('MESERO')) {
    activarSeccion('mesas');
  } else if (path.includes('cocina.html') && protegerRuta('COCINA')) {
    activarSeccion('pedidos');
  } else if (path.includes('despacho.html') && protegerRuta('DESPACHO')) {
    activarSeccion('despachos');
  }
});

setInterval(() => {
  if (typeof actualizarEstadosMesasPorReserva === "function") {
    actualizarEstadosMesasPorReserva();
  }
}, 30000);


// Navegación Móvil

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

function checkMobileLayout() {
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    if (window.innerWidth <= 768) {
      appContainer.classList.add('mobile-layout');
    } else {
      appContainer.classList.remove('mobile-layout');
    }
  }
}


window.addEventListener('DOMContentLoaded', () => {
  checkMobileLayout();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggleSidebar();
      }
    });
  });
});

window.addEventListener('resize', checkMobileLayout);