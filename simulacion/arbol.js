// Agente de Solar Saver: el mismo árbol de decisión de proyecto/agente/arbol.py,
// portado a JS para la simulación. Si cambia uno, hay que cambiar el otro:
// proyecto/agente/test_paridad.py compara los dos sobre una malla de estados.

export const PARAMETROS = Object.freeze({
  capacidad_wh: 84.0,        // AGM 12 V 7 Ah
  soc_minimo: 0.50,          // no descargar por debajo del 50 % (≈ 40 Wh útiles)
  p_lampara_w: 5.0,          // lámpara LED de 12 V
  p_base_w: 1.0,             // Pi con Wi-Fi local + lógica (~24 Wh/día)
  wh_celular: 15.0 / 0.88,   // batería de 15 Wh con el USB al 88 %
  lampara_desde: 18.0,
  lampara_hasta: 22.0,
  amanecer: 6.0,
  anochecer: 18.0,
  excedente_w: 5.0,
  margen_celular_wh: 13.0,
  temp_min_c: 0.0,           // POR CONFIRMAR con la hoja de datos de la AGM
  temp_max_c: 45.0,
  puertos_usb: 2,
});

const mod = (a, n) => ((a % n) + n) % n;
export const horasHastaAmanecer = (h, p) => mod(p.amanecer - h, 24);
export const esDia = (e, p) => p.amanecer <= e.hora && e.hora < p.anochecer;

export function horasLamparaRestantes(h, p) {
  if (h < p.amanecer) return 0;
  return Math.max(0, p.lampara_hasta - Math.max(h, p.lampara_desde));
}

// Energía útil que sobra al amanecer si no se acepta nada más (ver arbol.py).
export function balanceNocheWh(e, p) {
  const disponible = Math.max(0, e.soc - p.soc_minimo) * p.capacidad_wh;
  let hLampara, hBase;
  if (esDia(e, p)) {
    hLampara = p.lampara_hasta - p.lampara_desde;
    hBase = horasHastaAmanecer(p.anochecer, p);
  } else {
    hLampara = horasLamparaRestantes(e.hora, p);
    hBase = horasHastaAmanecer(e.hora, p);
  }
  const necesidad = hLampara * p.p_lampara_w + hBase * p.p_base_w
    + (e.celulares || 0) * (e.carga_pendiente ?? 0.6) * p.wh_celular;
  return disponible - necesidad;
}

const deficitSinLampara = (e, p) =>
  Math.max(0, e.soc - p.soc_minimo) * p.capacidad_wh < horasHastaAmanecer(e.hora, p) * p.p_base_w;

const hoja = (id, modo, luz, usb, aceptar_celular, intervalo_min, hablar, texto) =>
  ({ id, modo, luz, usb, aceptar_celular, intervalo_min, hablar, texto });
const nodo = (id, pregunta, prueba, si, no) => ({ id, pregunta, prueba, si, no });

export const ARBOL = nodo('N1', '¿Está activo el corte por bajo voltaje?', (e) => !!e.corte_activo,
  hoja('H1', 'AHORRO', 'APAGAR', 'BLOQUEADO', false, 60, true, 'La batería se agotó y las cargas están cortadas. Vuelven cuando el sol la recargue.'),
  nodo('N2', '¿La temperatura de la batería está fuera de rango?', (e, p) => !(p.temp_min_c <= e.temp_bat_c && e.temp_bat_c <= p.temp_max_c),
    hoja('H2', 'AHORRO', 'HORARIO', 'BLOQUEADO', false, 15, true, 'La batería está fuera de su temperatura segura. Se suspende la carga de celulares.'),
    nodo('N3', '¿Es de día?', esDia,
      nodo('N4', '¿El panel da más que el consumo + excedente?', (e, p) => e.p_panel_w - e.p_cargas_w >= p.excedente_w,
        hoja('H3', 'NORMAL', 'HORARIO', 'LIBRE', true, 15, false, 'Hay sol de sobra. Se pueden cargar celulares.'),
        nodo('N5', '¿El balance a la noche deja la holgura de un celular?', (e, p) => balanceNocheWh(e, p) >= p.margen_celular_wh,
          hoja('H4', 'NORMAL', 'HORARIO', 'LIBRE', true, 15, false, 'Poco sol, pero la batería alcanza para la noche. Se puede cargar otro celular.'),
          nodo('N6', '¿El balance a la noche es positivo?', (e, p) => balanceNocheWh(e, p) >= 0,
            hoja('H5', 'AHORRO', 'HORARIO', 'SOLO_CONECTADOS', false, 15, true, 'Hay poco sol. Se terminan los celulares conectados y no se aceptan más, para guardar la luz de la noche.'),
            hoja('H6', 'AHORRO', 'HORARIO', 'BLOQUEADO', false, 15, true, 'Hay poco sol y la batería no alcanza para la noche. Se corta el USB para guardar la luz.')))),
      nodo('N7', '¿El balance al amanecer deja la holgura de un celular?', (e, p) => balanceNocheWh(e, p) >= p.margen_celular_wh,
        hoja('H7', 'NORMAL', 'HORARIO', 'LIBRE', true, 30, false, 'La energía alcanza hasta el amanecer. Se puede cargar otro celular.'),
        nodo('N8', '¿El balance al amanecer es positivo?', (e, p) => balanceNocheWh(e, p) >= 0,
          hoja('H8', 'AHORRO', 'HORARIO', 'SOLO_CONECTADOS', false, 30, true, 'La energía alcanza para la luz, pero no para otro celular. Mejor guardarla para la noche.'),
          nodo('N9', '¿Falta energía aun sin lámpara ni celulares?', deficitSinLampara,
            hoja('H10', 'AHORRO', 'APAGAR', 'BLOQUEADO', false, 60, true, 'La batería no alcanza ni para la luz. Se apaga todo para no llegar al corte.'),
            hoja('H9', 'AHORRO', 'HORARIO', 'BLOQUEADO', false, 30, true, 'Con este consumo la batería no llega al amanecer. Se corta el USB y queda solo la luz.')))))));

// Recorre el árbol y aplica las restricciones duras al final (igual que decidir() en arbol.py).
export function decidir(e, p = PARAMETROS, modoPrevio = null) {
  const camino = [];
  let r = ARBOL;
  while (r.prueba) {
    const s = !!r.prueba(e, p);
    camino.push([r.id, s ? 'sí' : 'no']);
    r = s ? r.si : r.no;
  }
  let aceptar = r.aceptar_celular, texto = r.texto;
  if (aceptar && (e.celulares || 0) >= p.puertos_usb) { aceptar = false; texto += ' Los dos puertos USB están ocupados.'; }
  if (!e.pedido_celular) aceptar = false;
  const hablar = r.hablar || (modoPrevio !== null && modoPrevio !== r.modo);
  return {
    modo: r.modo, luz: r.luz, usb: r.usb, aceptar_celular: aceptar, intervalo_min: r.intervalo_min,
    hablar, texto, hoja: r.id, camino, balance_wh: Math.round(balanceNocheWh(e, p) * 10) / 10,
  };
}
