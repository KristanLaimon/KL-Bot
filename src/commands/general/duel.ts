import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, MsgType, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import { SpecificChat } from '../../bot/SpecificChat';
import { Phone_GetPhoneNumberFromMention, Phone_GetFullPhoneInfoFromRawMsg, Phone_IsAMentionNumber } from '../../utils/phonenumbers';
import { Members_GetMemberInfoFromWhatsappId } from '../../utils/members';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';
import GlobalCache from '../../bot/cache/GlobalCache';
import Kldb from "../../utils/kldb";

export default class DuelCommand implements ICommand {
  commandName: string = "duel";
  description: string = 'Reta a un duelo 1vs1 a otra persona del clan'
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  maxScope: CommandScopeType = "Group";
  helpMessage?: CommandHelpInfo = {
    notes: "Para registrar un duelo se usaría !duel @alguien y para registrarlo es con !duelwin",
    examples: [
      { text: 'duel @miembro', isOk: true },
      { text: 'duel @alguienmás', isOk: true },
      { text: 'duel', isOk: false },
      { text: 'duel @alguienmás @alguienmás', isOk: false }
    ],
    structure: "duel [@etiquetadealgunmiembro]"
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      //Validates the original sender is a member
      const challengerWhatsId = Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)!.whatsappId;
      const challengerInfo = await Members_GetMemberInfoFromWhatsappId(challengerWhatsId);
      if (challengerInfo === null) {
        await chat.SendText("Por alguna razón todavía no estás registrado como miembro, contacta a un admin para que te registre\nAdmins actuales:", true, {quoted: args.originalMsg});
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await chat.SendText(adminsAvailable);
        await chat.SendReactionToOriginalMsg("✅");
        return;
      }

      //Validates the user actually dueled someone
      if (!Phone_IsAMentionNumber(args.commandArgs.at(0) || '')) {
        await chat.SendText("No etiquetaste a nadie, prueba de nuevo", true, { quoted: args.originalMsg});
        await chat.SendReactionToOriginalMsg("❌");
        return;
      }

      //Validates that the tagged user is a member
      const challengedWhatsId = Phone_GetPhoneNumberFromMention(args.commandArgs.at(0)!)!.whatsappId;
      const challengedInfo = await Members_GetMemberInfoFromWhatsappId(challengedWhatsId);
      if (challengedInfo === null) {
        await chat.SendText("Por alguna razón todavía no está registrado como miembro el usuario etiquetado, contacta a un admin para que te registre\nAdmins actuales:", true, { quoted: args.originalMsg});
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await chat.SendText(adminsAvailable);
        await chat.SendReactionToOriginalMsg("❌");
        return;
      }

      //Validates they aren't the same person
      if (challengerWhatsId === challengedWhatsId) {
        await chat.SendText("Te estás haciendo duelo a ti mismo?, no puedes hacer eso! 🦊", true, { quoted: args.originalMsg});
        await chat.SendReactionToOriginalMsg("❌");
        return;
      }

      //Waiting for the dueled person's response
      await chat.SendText(`
        ⏳ *¡Esperando respuesta de ${challengedInfo.username}!* ⏳  
        🔔 Tienes *60 segundos* para decidir:
        
        ${challengedInfo.username} puedes:
        - Escribe *aceptar* para unirte al duelo.  
        - Escribe *no gracias ya comí* o cualquier otro mensaje para rechazarlo.  

        ${challengerInfo.username}, si ya tuviste miedo, escribe *cancelar*.

        ⚔️ ¡El destino del duelo está en tus manos! 🔥
      `, true, { quoted: args.originalMsg });
      await chat.SendReactionToOriginalMsg("⌛");

      const thatPersonRawMsg = await bot.Receive.WaitNextRawMsgFromWhatsId(args.chatId, args.userIdOrChatUserId, challengedWhatsId, MsgType.text, 60);
      const thatPersonTxt = Msg_GetTextFromRawMsg(thatPersonRawMsg).toLowerCase();

      //Other used has responded!
      if (thatPersonTxt.includes("aceptar") || thatPersonTxt.includes("si")) {
        await chat.SendReactionToOriginalMsg("🫸🏼");
        //Both users are ready to duel, let's get the duel info
        await chat.SendText(`
          🎮⚔️ ¡Duelo en curso! ⚔️🎮
          🧢 Retador: ${challengerInfo.username}
          🏆 Retado: ${challengedInfo.username}

          ⏳ Tienen 20 minutos para enfrentarse y registrar su resultado con el comando:
          !duelwin [marcador] ó !duellose [marcador] (Ejemplo: !duelwin 2-1 o !duellose 2-1)

          ¡Que gane el mejor! 🚀🔥`
        );
        const matchPendingIdentifier = Date.now();
        const timerOnEnd = setTimeout(() => {
          const foundIndex = GlobalCache.Auto_PendingMatches.findIndex(match => match.dateTime === matchPendingIdentifier);
          if (foundIndex !== -1) {
            //It means the match never was completed it but still pending, so let's delete it
            GlobalCache.Auto_PendingMatches.splice(foundIndex, 1);
            chat.SendText(`
              ⏳💔 **El tiempo ha terminado** 💔⏳  
              El duelo entre *${challengerInfo.username}* y *${challengedInfo.username}* no se completó a tiempo.  
              ⚠️ **El duelo ya no está pendiente.** ¡Inténtenlo de nuevo cuando estén listos! 🚀
            `);
            chat.SendReactionToOriginalMsg("❌");
          }
        }, 1000 * 60 * 20 /* 20 minutes */);

        GlobalCache.Auto_PendingMatches.push({
          dateTime: matchPendingIdentifier,
          countDownTimer: timerOnEnd,
          challenger: challengerInfo,
          challenged: challengedInfo,
        })
      }
    } catch (e) {
      await chat.SendReactionToOriginalMsg("❌");
      if (Msg_IsBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) {
          await chat.SendText("⏳ **No se recibió una respuesta de la persona esperada.**\nParece que no contestó a tiempo.");
        }
        else if (e.wasAbortedByUser) {
          await chat.SendText("❌ **El usuario original canceló la espera.**\nEl duelo ha sido cancelado.");
        }
      } else {
        await chat.SendText("⚠️ **Algo salió mal** con el sistema o la base de datos.\nPor favor, intenta nuevamente o contacta con soporte.\nDetalles: " + JSON.stringify(e));
      }
    }
  }
}