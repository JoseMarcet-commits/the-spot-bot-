// Bot de WhatsApp gratis para The Spot Chile / Botillería Marcet
// Plataforma: Render.com (plan gratis)
// Librería: whatsapp-web.js (usa WhatsApp Web bajo el capó – no oficial)

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  }
});

const PROMOS = {
  "1": { nombre: "Alto del Carmen", precio: 11990 },
  "2": { nombre: "Mistral 1L", precio: 12990 },
  "3": { nombre: "Gin + Redbull", precio: 20990 },
  "4": { nombre: "Vodka Stolichnaya", precio: 15990 },
  "5": { nombre: "Absolut Vodka", precio: 17990 },
  "6": { nombre: "Alto Transparente", precio: 11590 },
  "7": { nombre: "Fernet Branca", precio: 14241 }
};

const ZONAS = {
  "1": { etiqueta: "Concón y cercanos", costo: 3000 },
  "2": { etiqueta: "Reñaca / alrededores", costo: 4500 }
};

const HORARIOS = `🕐 *Horarios*
🛵 Delivery: todos los días 12:00 p.m. – 11:30 p.m.
🏪 Local: Dom–Jue 10:30 a.m. – 12:00 a.m. | Vie–Sáb 10:30 a.m. – 1:00 a.m.
`;

const APPS = `🛒 *Catálogo ampliado — Apps oficiales*
🚗 Rappi → https://www.rappi.cl/tiendas/900028159-the-spot-liquor-vina-del-mar/
🍔 PedidosYa → https://www.pedidosya.cl/restaurantes/concon/botilleria-the-spot-d573b70d-a613-4fc2-9e95-183f8fc97877-menu
🛵 UberEats → https://www.ubereats.com/cl/store/the-spot-botilleria-%26-vinoteca-concon/
`;

const state = new Map();

function menuInicial() {
  return `👋 ¡Hola! Bienvenido a *The Spot Chile / Botillería Marcet* 🍾

${HORARIOS}
Elige una opción:
1️⃣ Reparto (zonas y tarifas)
2️⃣ Promociones disponibles
3️⃣ Aplicaciones Delivery (Catálogo ampliado)

Escribe *1*, *2* o *3* 👇`;
}

function menuReparto() {
  return `🚚 *Zonas y tarifas de reparto*
1️⃣ ${ZONAS["1"].etiqueta} → $${ZONAS["1"].costo.toLocaleString('es-CL')}
2️⃣ ${ZONAS["2"].etiqueta} → $${ZONAS["2"].costo.toLocaleString('es-CL')}

Escribe *MENÚ* para volver.`;
}

function menuPromos() {
  const lines = Object.entries(PROMOS).map(([id, p]) => `${id}️⃣ ${p.nombre} — $${p.precio.toLocaleString('es-CL')}`);
  return `🍾 *Promociones disponibles hoy*\n${lines.join('\n')}\n\nResponde con el *número* de la promo que quieres 👇`;
}

function pedirZona() {
  return `Elige tu zona para calcular el total 👇
1️⃣ ${ZONAS["1"].etiqueta} ($${ZONAS["1"].costo.toLocaleString('es-CL')})
2️⃣ ${ZONAS["2"].etiqueta} ($${ZONAS["2"].costo.toLocaleString('es-CL')})`;
}

function datosTransferencia(total) {
  return `💳 *Datos para transferencia bancaria*
• Banco: N/D (Confianza: Alta)
• Tipo de cuenta: N/D (Confianza: Alta)
• Titular: The Spot Chile
• RUT: N/D (Confianza: Alta)
• Correo para comprobante: N/D (Confianza: Alta)

💰 *Total a transferir:* $${total.toLocaleString('es-CL')}

Por favor *envía una foto o captura del comprobante por aquí* cuando completes la transferencia. ✅`;
}

client.on('qr', (qr) => {
  console.log('Escanea este código QR con tu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot de The Spot Chile conectado correctamente.');
});

client.on('message', async (msg) => {
  const chatId = msg.from;
  const text = (msg.body || '').trim();
  const t = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (!state.has(chatId)) state.set(chatId, { etapa: 'inicio' });
  const s = state.get(chatId);

  if (msg.hasMedia && s.etapa === 'esperando_comprobante') {
    s.etapa = 'esperando_direccion';
    await msg.reply(`✅ ¡Comprobante recibido, gracias!

Para coordinar tu entrega, por favor responde con:
1️⃣ Dirección completa (calle, número, depto/piso, conserjería si aplica)
2️⃣ Zona: "${ZONAS["1"].etiqueta}" o "${ZONAS["2"].etiqueta}"
3️⃣ Nombre de quien recibe
4️⃣ Teléfono de contacto
5️⃣ Indicaciones extra (portería, sin timbre, horario preferido, etc.)`);
    return;
  }

  if (s.etapa === 'esperando_direccion' && !msg.hasMedia && text.length > 10) {
    s.etapa = 'fin';
    await msg.reply(`📦 *Pedido confirmado*
• Promo: ${PROMOS[s.promoId]?.nombre || 'N/D'}
• Total: $${(s.total || 0).toLocaleString('es-CL')}

🛵 Te avisamos cuando el pedido salga. ¡Gracias por preferir *The Spot Chile*!
Escribe *MENÚ* para volver al inicio.`);
    return;
  }

  if (['menu', 'menú', 'hola', 'buenas', 'inicio', 'start'].includes(t)) {
    state.set(chatId, { etapa: 'inicio' });
    await msg.reply(menuInicial());
    return;
  }

  if (s.etapa === 'inicio') {
    if (t === '1') {
      s.etapa = 'reparto';
      await msg.reply(menuReparto());
      return;
    } else if (t === '2') {
      s.etapa = 'promos';
      await msg.reply(menuPromos());
      return;
    } else if (t === '3') {
      s.etapa = 'apps';
      await msg.reply(APPS + '\nEscribe *MENÚ* para volver al inicio.');
      return;
    } else {
      await msg.reply(menuInicial());
      return;
    }
  }

  if (s.etapa === 'reparto') {
    if (t === 'menu' || t === 'menú') {
      s.etapa = 'inicio';
      await msg.reply(menuInicial());
      return;
    }
    if (t === '1' || t === '2') {
      const zona = ZONAS[t];
      await msg.reply(`ℹ️ *${zona.etiqueta}* → $${zona.costo.toLocaleString('es-CL')}\n\nEscribe *MENÚ* para volver o *2* para ver promociones.`);
      return;
    }
    await msg.reply(menuReparto());
    return;
  }

  if (s.etapa === 'promos') {
    if (PROMOS[t]) {
      s.promoId = t;
      s.etapa = 'seleccion_zona';
      const p = PROMOS[t];
      await msg.reply(`🧾 *${p.nombre}* — $${p.precio.toLocaleString('es-CL')}
Incluye: (ver detalle en catálogo interno)

${pedirZona()}`);
      return;
    } else if (t === 'menu' || t === 'menú') {
      s.etapa = 'inicio';
      await msg.reply(menuInicial());
      return;
    } else {
      await msg.reply(menuPromos());
      return;
    }
  }

  if (s.etapa === 'seleccion_zona') {
    if (t === '1' || t === '2') {
      s.zonaId = t;
      const p = PROMOS[s.promoId];
      const z = ZONAS[s.zonaId];
      const total = p.precio + z.costo;
      s.total = total;
      s.etapa = 'pago_transferencia';
      await msg.reply(`✅ Zona seleccionada: *${z.etiqueta}*
🧾 Promo: ${p.nombre} → $${p.precio.toLocaleString('es-CL')}
🚚 Envío: $${z.costo.toLocaleString('es-CL')}

💰 *TOTAL: $${total.toLocaleString('es-CL')}*

¿Deseas continuar al pago por transferencia?
1️⃣ Sí, pagar por transferencia
2️⃣ Cancelar / MENÚ`);
      return;
    } else {
      await msg.reply(pedirZona());
      return;
    }
  }

  if (s.etapa === 'pago_transferencia') {
    if (t === '1') {
      s.etapa = 'esperando_comprobante';
      await msg.reply(datosTransferencia(s.total));
      return;
    }
    if (t === '2' || t === 'menu' || t === 'menú') {
      s.etapa = 'inicio';
      await msg.reply(menuInicial());
      return;
    }
    await msg.reply(`Responde *1* para pagar por transferencia o *MENÚ* para volver.`);
    return;
  }

  if (['comprobante', 'pague', 'pagué', 'transferencia hecha', 'listo'].includes(t)) {
    if (s.etapa === 'esperando_comprobante') {
      s.etapa = 'esperando_direccion';
      await msg.reply(`¡Gracias! Si aún no adjuntaste la foto del comprobante, por favor envíala.
Luego, comparte:
1) Dirección completa
2) Zona (Concón o Reñaca)
3) Nombre receptor
4) Teléfono
5) Indicaciones`);
      return;
    }
  }

  await msg.reply(menuInicial());
});

client.initialize();
