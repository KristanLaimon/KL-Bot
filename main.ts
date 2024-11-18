import makeWASocket, { DisconnectReason } from "@whiskeysockets/baileys";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

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
    const disconect = lastDisconnect!;

    if (connection === "close") {
      const shouldReconnect =
        (disconect.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        disconect.error,
        ", reconnecting ",
        shouldReconnect
      );

      // reconnect if not logged out
      if (shouldReconnect) startBot();

      //Endif
    } else if (connection === "open") console.log("opened connection");
  });

  // Guardar estado en cada cambio
  sock.ev.on("creds.update", saveCreds);

  // Manejar mensajes entrantes
  sock.ev.on("messages.upsert", async (messageUpdate) => {
    // Check if its a text message and includes at least text
    const messages = messageUpdate.messages;
    if (!messages || !messages[0]?.message) return;

    console.log(messageUpdate);

    // It is?, it can't be my own msg
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
      const respond: string[] = [];
      respond.push(`💳 Mensaje recibido de: ${msg.pushName}`);
      respond.push(
        `🐺 Mensaje: ${msg.message?.conversation || "Eso no era texto(?)"}`
      );

      // Responder al grupo
      await sock.sendMessage(jid, {
        text: respond.join("\n"),
      });
    }

    //It comes from an individual chat
    else if (jid && jid.endsWith("@s.whatsapp.net")) {
      console.log(`📩 Mensaje recibido en el chat individual: ${jid}`);
      console.log("🦊 Text: " + msg.message?.conversation);
      await sock.sendMessage(jid, {
        text: msg.message?.conversation || "Eso no era un mensaje",
      });
    }
  });
};

// Iniciar el bot
startBot();
