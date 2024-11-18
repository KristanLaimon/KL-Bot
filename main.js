///@ts-check
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

const startBot = async () => {
  // Inicializar autenticación
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  // Crear socket
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Genera QR en la terminal
  });

  // Manejar eventos de conexión
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("Conexión cerrada");
    } else if (connection === "open") {
      console.log("Conexión establecida.");
    }
  });

  // Guardar estado en cada cambio
  sock.ev.on("creds.update", saveCreds);

  // Manejar mensajes entrantes
  sock.ev.on("messages.upsert", async (messageUpdate) => {
    const messages = messageUpdate.messages;
    if (!messages || !messages[0]?.message) return;

    console.log(messageUpdate);

    const msg = messages[0];
    if (msg.key.fromMe) return;

    const jid = msg.key.remoteJid; // ID del chat

    // Verificar si el mensaje proviene de un grupo
    if (jid && jid.endsWith("@g.us")) {
      console.log(`📩 Mensaje recibido en el grupo: ${jid}`);
      console.log(`👤 Remitente: ${msg.pushName || "Desconocido"}`);
      console.log(
        `📜 Contenido: ${msg.message?.conversation || "No es texto"}`
      );

      // Responder al grupo
      await sock.sendMessage(jid, {
        text: "¡Hola grupo! He recibido su mensaje.",
      });
    }
  });
};

// Iniciar el bot
startBot();
