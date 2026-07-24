function renderizarPanelEstadisticas() {
  // Obtener datos sincronizados desde localStorage
  const reservas = obtenerReservas();
  const pedidos = obtenerPedidos();
  const despachos = obtenerDespachos();
  const mesas = obtenerMesas();

  // Obtener la fecha actual 
  const hoyObj = new Date();
  const hoyStr = hoyObj.toISOString().split('T')[0];

  // Formato legible para el encabezado (ej. 23/07/2026)
  const dia = String(hoyObj.getDate()).padStart(2, '0');
  const mes = String(hoyObj.getMonth() + 1).padStart(2, '0');
  const anio = hoyObj.getFullYear();
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  // Actualizar la fecha
  const elFecha = document.getElementById("fechaHoyText");
  if (elFecha) elFecha.textContent = fechaFormateada;

  // Filtrar reservas de hoy
  const reservasHoy = reservas.filter(r => typeof r.fechaHora === 'string' && r.fechaHora.startsWith(hoyStr));

  // PLATOS PENDIENTES (Sumando cantidades de cada ítem)
  const platosPendientes = pedidos.reduce((acc, p) => {
    if (p.estadoCocina !== 'Listo') {
      if (Array.isArray(p.items)) {
        return acc + p.items.reduce((sum, i) => sum + (parseInt(i.cantidad) || 1), 0);
      } else if (p.cantidad) {
        return acc + (parseInt(p.cantidad) || 1);
      }
    }
    return acc;
  }, 0);

  // DESPACHOS ACTIVOS (Sumando cantidades de despachos)
  const despachosActivos = despachos.length;

  const mesasOcupadas = mesas.filter(m => m.estado === 'Ocupada').length;
  const mesasReservadas = mesas.filter(m => m.estado === 'Reservada').length;
  const pedidosAbiertos = pedidos.length;

  // Inyectar valores en las tarjetas numéricas del Panel
  const elReservas = document.getElementById("statReservasHoy");
  const elPlatos = document.getElementById("statPlatosPendientes");
  const elDespachos = document.getElementById("statDespachosActivos");
  const elMesas = document.getElementById("statMesasOcupadas");
  const elReservadas = document.getElementById("statMesasReservadas");
  const elPedidos = document.getElementById("statPedidosAbiertos");

  if (elReservas) elReservas.textContent = reservasHoy.length;
  if (elPlatos) elPlatos.textContent = platosPendientes; 
  if (elDespachos) elDespachos.textContent = despachosActivos;
  if (elMesas) elMesas.textContent = mesasOcupadas;
  if (elReservadas) elReservadas.textContent = mesasReservadas;
  if (elPedidos) elPedidos.textContent = pedidosAbiertos;

  // Renderizar la tabla de "Reservas de hoy"
  const tablaBody = document.getElementById("tablaReservasHoyBody");
  if (!tablaBody) return;

  tablaBody.innerHTML = "";

  if (reservasHoy.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty-cell">
          <div class="empty-state">
            <span class="empty-icon">📅</span>
            <p>No hay reservas registradas hoy</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  reservasHoy.forEach(r => {
    const hora = r.fechaHora.split(' ')[1] || r.fechaHora;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.cliente}</strong></td>
      <td>${r.telefono}</td>
      <td><span class="badge-disponible">${r.mesa}</span></td>
      <td>${hora}</td>
      <td>${r.personas}</td>
      <td><span class="badge-admin">Confirmada</span></td>
    `;
    tablaBody.appendChild(tr);
  });
}

// MESAS
function renderizarMesas() {
  let mesas = obtenerMesas();

  // ORDENAR LAS MESAS POR SU NÚMERO 
  mesas.sort((a, b) => a.numero - b.numero);

  const gridContainer = document.getElementById("gridMesas");
  const tablaBody = document.getElementById("tablaMesasBody");

  if (gridContainer) {
    gridContainer.innerHTML = "";
    mesas.forEach(mesa => {
      const estadoLower = (mesa.estado || "disponible").toLowerCase();
      const esReservada = mesa.estado === "Reservada";

      const card = document.createElement("div");
      card.className = "card-mesa " + estadoLower;
      card.style.cursor = esReservada ? "not-allowed" : "pointer";

      if (!esReservada) {
        card.onclick = function () { cambiarEstadoMesaManual(mesa.numero); };
      }

      card.innerHTML = `
        <h3>Mesa ${mesa.numero}</h3>
        <p class="detalles">${mesa.capacidad} personas · ${mesa.zona}</p>
        <span class="badge-${estadoLower}">${mesa.estado}</span>
      `;
      gridContainer.appendChild(card);
    });
  }

  if (tablaBody) {
    tablaBody.innerHTML = "";
    if (mesas.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="5" class="table-empty-cell">No hay mesas registradas.</td></tr>`;
      return;
    }
    mesas.forEach(mesa => {
      const estadoLower = (mesa.estado || "disponible").toLowerCase();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${mesa.numero}</strong></td>
        <td>${mesa.capacidad}</td>
        <td>${mesa.zona}</td>
        <td><span class="badge-${estadoLower}">${mesa.estado}</span></td>
        <td><button class="btn-danger btn-sm" onclick="eliminarMesa(${mesa.numero})">Eliminar</button></td>
      `;
      tablaBody.appendChild(tr);
    });
  }
}


function cambiarEstadoMesaManual(numeroMesa) {
  const mesas = obtenerMesas();
  const mIndex = mesas.findIndex(m => m.numero === numeroMesa);
  if (mIndex !== -1 && mesas[mIndex].estado !== "Reservada") {
    mesas[mIndex].estado = (mesas[mIndex].estado === "Disponible") ? "Ocupada" : "Disponible";
    guardarMesas(mesas);
    renderizarMesas();
  }
}

function abrirModalMesa() {
  const form = document.getElementById("formMesa");
  
  // Inyectar el campo de "Número de Mesa" si no existe
  if (form && !document.getElementById("mesaNumero")) {
    const divNumero = document.createElement("div");
    divNumero.className = "form-group";
    divNumero.innerHTML = `
      <label for="mesaNumero">Número de Mesa</label>
      <input type="number" id="mesaNumero" placeholder="Ej: 1, 2, 3..." min="1" max="100" />
    `;
    form.insertBefore(divNumero, form.firstChild);

    // Controlar en tiempo real que no supere 100 ni sea menor a 1
    const inputNumero = document.getElementById("mesaNumero");
    inputNumero.oninput = function () {
      if (this.value !== "") {
        let valor = parseInt(this.value);
        if (valor > 100) this.value = 100;
        if (valor < 1) this.value = 1;
      }
    };
  }

  // Restringir la capacidad 
  const inputCapacidad = document.getElementById("mesaCapacidad");
  if (inputCapacidad) {
    inputCapacidad.value = "1";
    inputCapacidad.min = "1";
    inputCapacidad.max = "10";
    inputCapacidad.oninput = function () {
      if (this.value !== "") {
        let valor = parseInt(this.value);
        if (valor > 10) this.value = 10;
        if (valor < 1) this.value = 1;
      }
    };
  }

  const modal = document.getElementById("modalMesa");
  if (modal) modal.classList.add("active");
}

function cerrarModalMesa() {
  const modal = document.getElementById("modalMesa");
  if (modal) modal.classList.remove("active");
  const form = document.getElementById("formMesa");
  if (form) form.reset();
}

function guardarMesa(e) {
  e.preventDefault();

  const capacidadInput = document.getElementById("mesaCapacidad");
  const zonaInput = document.getElementById("mesaZona");
  const inputNumero = document.getElementById("mesaNumero");
  const errorCapacidad = document.getElementById("errorMesaCapacidad");

  if (typeof ocultarError === "function" && errorCapacidad) {
    ocultarError(errorCapacidad);
  }

  // Validacionea
  if (!capacidadInput || !capacidadInput.value.trim()) {
    if (typeof mostrarError === "function" && errorCapacidad) {
      mostrarError(errorCapacidad, "Este campo es obligatorio");
    } else {
      alert("Por favor, ingresa la capacidad de personas.");
    }
    return;
  }

  const capacidad = parseInt(capacidadInput.value);

  if (isNaN(capacidad) || capacidad < 1 || capacidad > 10) {
    if (typeof mostrarError === "function" && errorCapacidad) {
      mostrarError(errorCapacidad, "La capacidad debe ser entre 1 y 10 personas.");
    }
    return;
  }

  const zona = zonaInput ? zonaInput.value : "Salón";
  const mesas = obtenerMesas();

  // Comprobar si eligió o no el número de mesa
  let numeroMesa = inputNumero && inputNumero.value.trim() !== "" ? parseInt(inputNumero.value) : null;

  if (!numeroMesa || isNaN(numeroMesa)) {
    // Si no puso número, calcular el siguiente disponible
    let ultimoNumero = 0;
    mesas.forEach(m => { 
      if (m.numero > ultimoNumero) ultimoNumero = m.numero; 
    });
    numeroMesa = ultimoNumero + 1;

    // VALIDACIÓN DE LÍMITE 100 PARA ASIGNACIÓN AUTOMÁTICA
    if (numeroMesa > 100) {
      alert("Se ha alcanzado el límite máximo permitido de 100 mesas.");
      return;
    }

    alert(`No especificaste un número de mesa. Se asignará automáticamente la Mesa ${numeroMesa}.`);
  } else {
    // VALIDACIÓN DE LÍMITE 100 PARA INGRESO MANUAL
    if (numeroMesa < 1 || numeroMesa > 100) {
      alert("El número de mesa debe estar entre 1 y 100.");
      return;
    }

    // Verificar que no esté repetido
    if (mesas.some(m => m.numero === numeroMesa)) {
      alert(`La Mesa ${numeroMesa} ya existe. Por favor elige otro número.`);
      return;
    }
  }

  // Guardar mesa
  mesas.push({ 
    numero: numeroMesa, 
    capacidad: capacidad, 
    zona: zona, 
    estado: "Disponible" 
  });

  guardarMesas(mesas);
  cerrarModalMesa();
  renderizarMesas();
}

function eliminarMesa(numeroMesa) {
  if (confirm("¿Deseas eliminar la Mesa " + numeroMesa + "?")) {
    let mesas = obtenerMesas().filter(m => m.numero !== numeroMesa);
    guardarMesas(mesas);
    renderizarMesas();
  }
}

// RESERVAS

function actualizarEstadosMesasPorReserva() {
  const reservas = obtenerReservas();
  const mesas = obtenerMesas();
  const ahora = new Date();
  
  let cambios = false;

  reservas.forEach(r => {
    if (!r.fechaHora) return;

    // Crear objeto Date con la fecha y hora de la reserva (formato "YYYY-MM-DD HH:mm")
    const fechaHoraReserva = new Date(r.fechaHora.replace(" ", "T"));
    
    // Diferencia en minutos entre la hora de la reserva y el momento actual
    const diferenciaMinutos = (fechaHoraReserva - ahora) / (1000 * 60);

    const numMesa = r.numMesa || parseInt((r.mesa || "").replace("Mesa ", ""));
    const mIndex = mesas.findIndex(m => m.numero === numMesa);

    if (mIndex !== -1) {
      // Si faltan 20 minutos o menos para la reserva
      if (diferenciaMinutos <= 20 && diferenciaMinutos >= -120) {
        if (mesas[mIndex].estado !== "Reservada" && mesas[mIndex].estado !== "Ocupada") {
          mesas[mIndex].estado = "Reservada";
          cambios = true;
        }
      }
    }
  });

  if (cambios) {
    guardarMesas(mesas);
    const elGrid = document.getElementById("gridMesas");
    if (elGrid && elGrid.children.length > 0) {
      renderizarMesas();
    }
  }
}

function renderizarReservas() {
  actualizarEstadosMesasPorReserva();
  const reservas = obtenerReservas();
  const tablaBody = document.getElementById("tablaReservasBody");
  if (!tablaBody) return;

  tablaBody.innerHTML = "";
  if (reservas.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="7" class="table-empty-cell">No hay reservas registradas.</td></tr>`;
    return;
  }

  reservas.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.cliente}</strong></td>
      <td>${r.telefono}</td>
      <td><span class="badge-disponible">${r.mesa}</span></td>
      <td>${r.fechaHora}</td>
      <td>${r.personas}</td>
      <td>${r.notas || "-"}</td>
      <td><button class="btn-danger btn-sm" onclick="eliminarReserva(${r.id})">Eliminar</button></td>
    `;
    tablaBody.appendChild(tr);
  });
}

function abrirModalReserva() {
  // Configurar la fecha mínima (hoy) para bloquear días anteriores en el calendario
  const inputFecha = document.getElementById("reservaFecha");
  if (inputFecha) {
    const hoy = new Date().toISOString().split("T")[0];
    inputFecha.min = hoy;
  }

  const inputPersonas = document.getElementById("reservaPersonas");
  if (inputPersonas) {
    inputPersonas.value = "1"; // Valor por defecto al abrir
    inputPersonas.min = "1";
    inputPersonas.max = "10";

    inputPersonas.oninput = function() {
      if (this.value !== "") {
        let valor = parseInt(this.value);
        if (valor > 10) this.value = 10;
        if (valor < 1) this.value = 1;
      }
    };
  }

  const selectMesa = document.getElementById("reservaMesa");
  const mesas = obtenerMesas();
  if (selectMesa && mesas) {
    selectMesa.innerHTML = "";
    mesas.forEach(m => {
      const option = document.createElement("option");
      option.value = `Mesa ${m.numero}`;
      option.textContent = `Mesa ${m.numero} — ${m.zona}`;
      selectMesa.appendChild(option);
    });
  }
  const modal = document.getElementById("modalReserva");
  if (modal) modal.classList.add("active");
}
function cerrarModalReserva() {
  const modal = document.getElementById("modalReserva");
  if (modal) modal.classList.remove("active");
  const form = document.getElementById("formReserva");
  if (form) form.reset();

  // Limpiar mensajes de error
  const IDsErrores = [
    "errorReservaCliente", 
    "errorReservaTelefono", 
    "errorReservaFecha", 
    "errorReservaHora", 
    "errorReservaPersonas", 
    "errorReservaNotas"
  ];
  
  IDsErrores.forEach(id => {
    const el = document.getElementById(id);
    if (typeof ocultarError === "function") ocultarError(el);
  });
}

function guardarReserva(e) {
  e.preventDefault();

  // Elementos de Error
  const errCliente = document.getElementById("errorReservaCliente");
  const errTelefono = document.getElementById("errorReservaTelefono");
  const errFecha = document.getElementById("errorReservaFecha");
  const errHora = document.getElementById("errorReservaHora");
  const errPersonas = document.getElementById("errorReservaPersonas");
  const errNotas = document.getElementById("errorReservaNotas");

  // Ocultar errores previos
  [errCliente, errTelefono, errFecha, errHora, errPersonas, errNotas].forEach(el => {
    if (typeof ocultarError === "function") ocultarError(el);
  });

  // Capturar valores
  const cliente = document.getElementById("reservaCliente").value.trim();
  const telefono = document.getElementById("reservaTelefono").value.trim();
  const mesaElegida = document.getElementById("reservaMesa").value;
  const fecha = document.getElementById("reservaFecha").value;
  const hora = document.getElementById("reservaHora").value;
  const personas = document.getElementById("reservaPersonas").value.trim();
  const notas = document.getElementById("reservaNotas").value.trim();

  let esValido = true;

  // 1. Validar Cliente
  const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!cliente) {
    mostrarError(errCliente, "Este campo es obligatorio");
    esValido = false;
  } else if (cliente.length > 40 || !regexSoloLetras.test(cliente)) {
    mostrarError(errCliente, "Solo se permiten letras (máx. 40 caracteres).");
    esValido = false;
  }

  // 2. Validar Teléfono
  const regexSoloNumeros = /^\d+$/;
  if (!telefono) {
    mostrarError(errTelefono, "Este campo es obligatorio");
    esValido = false;
  } else if (telefono.length > 11 || !regexSoloNumeros.test(telefono)) {
    mostrarError(errTelefono, "Solo se permiten números (máximo 11 dígitos).");
    esValido = false;
  }

  // 3. Validar Fecha
  const hoyStr = new Date().toISOString().split("T")[0];
  if (!fecha) {
    mostrarError(errFecha, "Este campo es obligatorio");
    esValido = false;
  } else if (fecha < hoyStr) {
    mostrarError(errFecha, "No puedes seleccionar una fecha pasada");
    esValido = false;
  }

  // 4. Validar Hora
  if (!hora) {
    mostrarError(errHora, "Este campo es obligatorio");
    esValido = false;
  }

  // 5. Validar Personas
  if (!personas) {
    mostrarError(errPersonas, "Este campo es obligatorio");
    esValido = false;
  } else if (!regexSoloNumeros.test(personas) || parseInt(personas) <= 0) {
    mostrarError(errPersonas, "Ingresa un número de personas válido.");
    esValido = false;
  }

  // 6. Validar Notas (Opcional)
  const regexAlfaNumerico = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/;
  if (notas && (notas.length > 150 || !regexAlfaNumerico.test(notas))) {
    mostrarError(errNotas, "Solo letras y números (máximo 150 caracteres).");
    esValido = false;
  }

  if (!esValido) return;

  // Guardar Reserva
  const numMesa = parseInt(mesaElegida.replace("Mesa ", ""));
  const nuevaReserva = {
    id: Date.now(),
    cliente: cliente,
    telefono: telefono,
    mesa: mesaElegida,
    numMesa: numMesa,
    fechaHora: `${fecha} ${hora}`,
    personas: parseInt(personas),
    notas: notas || "-"
  };

  const reservas = obtenerReservas();
  reservas.push(nuevaReserva);
  guardarReservas(reservas);

  actualizarEstadosMesasPorReserva();
  cerrarModalReserva();
  renderizarReservas();
}

function eliminarReserva(idReserva) {
  if (confirm("¿Deseas cancelar esta reserva?")) {
    let reservas = obtenerReservas();
    const reserva = reservas.find(r => r.id === idReserva);

    if (reserva) {
      const numMesa = reserva.numMesa || parseInt(reserva.mesa.replace("Mesa ", ""));
      const mesas = obtenerMesas();
      const mIndex = mesas.findIndex(m => m.numero === numMesa);
      if (mIndex !== -1 && mesas[mIndex].estado === "Reservada") {
        mesas[mIndex].estado = "Disponible";
        guardarMesas(mesas);
      }
    }

    reservas = reservas.filter(r => r.id !== idReserva);
    guardarReservas(reservas);
    renderizarReservas();
  }
}

// PEDIDOS 
function renderizarPedidos() {
  const pedidos = obtenerPedidos();
  const tablaBody = document.getElementById("tablaPedidosBody");
  if (!tablaBody) return;

  tablaBody.innerHTML = "";
  if (pedidos.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">No hay pedidos registrados.</td></tr>`;
    return;
  }

  pedidos.forEach(p => {
    let platoYCantidadTexto = "";
    if (Array.isArray(p.items) && p.items.length > 0) {
      platoYCantidadTexto = p.items.map(i => `<strong>${i.cantidad}x</strong> ${i.plato}`).join("<br>");
    } else if (p.plato) {
      platoYCantidadTexto = `<strong>${p.cantidad || 1}x</strong> ${p.plato}`;
    } else {
      platoYCantidadTexto = "Sin especificar";
    }

    const esEnPreparacion = (p.estadoCocina || 'En preparación') === 'En preparación';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.mesa}</strong></td>
      <td>${platoYCantidadTexto}</td>
      <td><span class="badge-disponible">${p.estadoCocina || 'En preparación'}</span></td>
      <td>
        <div class="table-actions">
          ${esEnPreparacion ?
            `<button class="btn-primary btn-success btn-sm" onclick="cambiarEstadoCocina(${p.id}, 'Listo')">✓ Listo</button>` :
            `<button class="btn-primary btn-warning btn-sm" onclick="crearDespachoDesdePedido(${p.id})">🛵 Despachar</button>`
          }
          <button class="btn-danger btn-sm" onclick="eliminarPedido(${p.id})">✕</button>
        </div>
      </td>
    `;
    tablaBody.appendChild(tr);
  });
}

function abrirModalPedido() {
  const selectMesa = document.getElementById("pedidoMesa");
  const contenedor = document.getElementById("contenedorPlatosDinamicos");

  // 1. Cargar las mesas disponibles
  if (selectMesa) {
    selectMesa.innerHTML = "";
    obtenerMesas().forEach(m => {
      const option = document.createElement("option");
      option.value = `Mesa ${m.numero}`;
      option.textContent = `Mesa ${m.numero} — ${m.zona}`;
      selectMesa.appendChild(option);
    });
  }

  // 2. Limpiar el contenedor e insertar la primera fila automáticamente
  if (contenedor) {
    contenedor.innerHTML = "";
    agregarFilaPlatoModal(); 
  }

  const modal = document.getElementById("modalPedido");
  if (modal) modal.classList.add("active");
}

function cerrarModalPedido() {
  const modal = document.getElementById("modalPedido");
  if (modal) modal.classList.remove("active");
  const form = document.getElementById("formPedido");
  if (form) form.reset();
}

function agregarFilaPlatoModal() {
  const contenedor = document.getElementById("contenedorPlatosDinamicos");
  if (!contenedor) return;

  const platos = obtenerPlatos();
  const opcionesHTML = platos.map(p => `<option value="${p.nombre}">${p.nombre} - $${p.precio}</option>`).join("");

  const divRow = document.createElement("div");
  divRow.className = "form-row fila-plato-item";
  divRow.style.alignItems = "flex-end";
  divRow.style.marginBottom = "0.8rem";

  divRow.innerHTML = `
    <div class="form-group flex-plato margin-bottom-0">
      <label>Plato</label>
      <select class="item-plato-nombre" required>
        ${opcionesHTML}
      </select>
    </div>
    <div class="form-group flex-cant margin-bottom-0">
      <label>Cant.</label>
      <input type="number" class="item-plato-cantidad" min="1" max="12" value="1" required />
    </div>
    <div class="form-group flex-0 margin-bottom-0">
      <button type="button" class="btn-danger btn-remove-row" onclick="eliminarFilaPlatoModal(this)">✕</button>
    </div>
  `;

  const inputCantidad = divRow.querySelector(".item-plato-cantidad");
  if (inputCantidad) {
    inputCantidad.oninput = function () {
      if (this.value !== "") {
        let valor = parseInt(this.value);
        if (valor > 12) this.value = 12;
        if (valor < 1) this.value = 1;
      }
    };
  }

  contenedor.appendChild(divRow);
}

function eliminarFilaPlatoModal(btn) {
  const filas = document.querySelectorAll(".fila-plato-item");
  if (filas.length > 1) {
    btn.closest(".fila-plato-item").remove();
  } else {
    alert("El pedido debe contener al menos un plato.");
  }
}

function guardarPedido(e) {
  e.preventDefault();

  const mesa = document.getElementById("pedidoMesa").value;
  const numMesa = parseInt(mesa.replace("Mesa ", ""));
  
  const filas = document.querySelectorAll(".fila-plato-item");
  const items = [];
  let esValido = true;

  if (filas.length > 0) {
    filas.forEach(fila => {
      const nombre = fila.querySelector(".item-plato-nombre").value;
      let cantidad = parseInt(fila.querySelector(".item-plato-cantidad").value) || 1;
      
      if (cantidad > 12) {
        alert("La cantidad máxima permitida por plato es 12.");
        esValido = false;
        return;
      }

      const existente = items.find(i => i.plato === nombre);
      if (existente) {
        existente.cantidad += cantidad;
        if (existente.cantidad > 12) existente.cantidad = 12;
      } else {
        items.push({ plato: nombre, cantidad: cantidad });
      }
    });
  }

  if (!esValido) return;

  const nuevoPedido = { 
    id: Date.now(), 
    mesa, 
    items: items, 
    estadoCocina: "En preparación" 
  };

  const pedidos = obtenerPedidos();
  pedidos.push(nuevoPedido);
  guardarPedidos(pedidos);

  const mesas = obtenerMesas();
  const mIndex = mesas.findIndex(m => m.numero === numMesa);
  if (mIndex !== -1) {
    mesas[mIndex].estado = "Ocupada";
    guardarMesas(mesas);
  }

  cerrarModalPedido();
  renderizarPedidos();
}

function cambiarEstadoCocina(idPedido, nuevoEstado) {
  let pedidos = obtenerPedidos();
  const idx = pedidos.findIndex(p => p.id === idPedido);
  if (idx !== -1) {
    pedidos[idx].estadoCocina = nuevoEstado;
    guardarPedidos(pedidos);
    renderizarPedidos();
  }
}

function eliminarPedido(idPedido) {
  if (confirm("¿Deseas eliminar este pedido?")) {
    let pedidos = obtenerPedidos().filter(p => p.id !== idPedido);
    guardarPedidos(pedidos);
    renderizarPedidos();
  }
}

// DESPACHOS

function crearDespachoDesdePedido(idPedido) {
  let pedidos = obtenerPedidos();
  const pedido = pedidos.find(p => p.id === idPedido);

  if (pedido) {

    pedidos = pedidos.filter(p => p.id !== idPedido);
    guardarPedidos(pedidos);

    let itemsNormalizados = [];
    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
      itemsNormalizados = pedido.items;
    } else if (pedido.plato) {
      itemsNormalizados = [{ plato: pedido.plato, cantidad: pedido.cantidad || 1 }];
    }
    const despachos = obtenerDespachos();
    despachos.push({
      id: pedido.id,
      mesa: pedido.mesa,
      items: itemsNormalizados,
      estadoDespacho: "En ruta"
    });
    guardarDespachos(despachos);

    renderizarPedidos();
    alert("¡Pedido enviado a Despachos!");
  }
}

function renderizarDespachos() {
  const despachos = obtenerDespachos();
  const tablaBody = document.getElementById("tablaDespachosBody");

  const numActivos = document.getElementById("despachosActivosNum");
  const numPlatos = document.getElementById("platosPorEntregarNum");

  const totalPlatos = despachos.reduce((acc, d) => {
    if (Array.isArray(d.items)) {
      return acc + d.items.reduce((sum, item) => sum + (parseInt(item.cantidad) || 1), 0);
    } else if (d.cantidad) {
      return acc + (parseInt(d.cantidad) || 1);
    }
    return acc;
  }, 0);

  if (numActivos) numActivos.textContent = despachos.length;
  if (numPlatos) numPlatos.textContent = totalPlatos;

  if (!tablaBody) return;
  tablaBody.innerHTML = "";

  if (despachos.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">No hay despachos pendientes.</td></tr>`;
    return;
  }

  despachos.forEach(d => {
    let platosTexto = "";
    if (Array.isArray(d.items) && d.items.length > 0) {
      platosTexto = d.items.map(i => `<strong>${i.cantidad}x</strong> ${i.plato}`).join("<br>");
    } else if (d.plato) {
      let nombreLimpio = d.plato.replace(/^\d+x\s*/i, "").split(" - ")[0];
      platosTexto = `<strong>${d.cantidad || 1}x</strong> ${nombreLimpio}`;
    } else {
      platosTexto = "<em>Sin platos</em>";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${d.mesa}</strong></td>
      <td>${platosTexto}</td>
      <td><span class="badge-disponible">${d.estadoDespacho || 'En ruta'}</span></td>
      <td>
        <button class="btn-primary btn-success btn-sm" onclick="marcarEntregado(${d.id})">
          ✓ Entregado
        </button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });
}

function marcarEntregado(idDespacho) {
  let despachos = obtenerDespachos().filter(d => d.id !== idDespacho);
  guardarDespachos(despachos);
  renderizarDespachos();
}

// USUARIOS
function renderizarUsuarios() {
  const usuarios = obtenerUsuarios();
  const tablaBody = document.getElementById("tablaUsuariosBody");

  if (!tablaBody) return;
  tablaBody.innerHTML = "";

  if (!usuarios || usuarios.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="4" class="table-empty-cell">No hay usuarios registrados.</td></tr>`;
    return;
  }

  usuarios.forEach(u => {
    let badgeClass = "badge-disponible";
    const rolLower = (u.rol || "").toLowerCase();

    if (rolLower.includes("admin")) badgeClass = "badge-admin";
    else if (rolLower.includes("mesero")) badgeClass = "badge-mesero";
    else if (rolLower.includes("cocina")) badgeClass = "badge-cocina";
    else if (rolLower.includes("despacho")) badgeClass = "badge-despacho";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.usuario}</strong></td>
      <td>${u.usuario}</td>
      <td><span class="${badgeClass}">${(u.rol || "").toUpperCase()}</span></td>
      <td>
        <button class="btn-danger btn-sm" onclick="eliminarUsuario('${u.usuario}')">
          Eliminar
        </button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });
}

function abrirModalNuevoUsuario() { abrirModalUsuario(); }

function abrirModalUsuario() {
  const modal = document.getElementById("modalUsuario");
  if (modal) modal.classList.add("active");
}

function cerrarModalUsuario() {
  const modal = document.getElementById("modalUsuario");
  if (modal) modal.classList.remove("active");

  const form = document.getElementById("formUsuario");
  if (form) form.reset();

  const errorUsuario = document.getElementById("errorNuevoUsuario");
  const errorPassword = document.getElementById("errorNuevoPass");

  if (typeof ocultarError === "function") {
    ocultarError(errorUsuario);
    ocultarError(errorPassword);
  }
}

function guardarUsuarioModal(e) {
  e.preventDefault();

  if (typeof validarUsuarioModal === "function" && !validarUsuarioModal()) return;

  const usuario = document.getElementById("nuevoUsuarioNombre").value.trim();
  const pass = document.getElementById("nuevoUsuarioPass").value;
  const rol = document.getElementById("nuevoUsuarioRol").value;

  const res = guardarNuevoUsuario(usuario, pass, rol);
  if (!res.exito) {
    const errorUsuario = document.getElementById("errorNuevoUsuario");
    if (typeof mostrarError === "function") mostrarError(errorUsuario, res.mensaje);
    return;
  }

  alert("¡Usuario registrado con éxito!");
  cerrarModalUsuario();
  renderizarUsuarios();
}

function eliminarUsuario(nombreUsuario) {
  if (confirm(`¿Deseas eliminar al usuario ${nombreUsuario}?`)) {
    let usuarios = obtenerUsuarios().filter(u => u.usuario !== nombreUsuario);
    guardarEncrypted('usuariosRestaurante', usuarios);
    renderizarUsuarios();
  }
}

function resetearDatosDemo() {
  if (confirm("¿Restablecer los datos demo por defecto?")) {
    resetearUsuariosDemo();
    renderizarUsuarios();
  }
}