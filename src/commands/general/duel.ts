import Bot from '../../bot';
import Kldb, { Kldb_Ram_PendingMatches } from '../../utils/db';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, MsgType, ScopeType } from '../../types/commands';
import { SpecificChat } from '../../bot/SpecificChat';
import { Phone_GetPhoneNumberFromMention, Phone_GetFullPhoneInfoFromRawmsg, Phone_IsAMentionNumber } from '../../utils/phonenumbers';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';


//TODO: !duelpending? && !duellose
export default class DuelCommand implements ICommand {
  commandName: string = "duel";
  description: string = 'Reta a un duelo 1vs1 a otra persona del clan'
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  maxScope: ScopeType = "Group";

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      //Validates the original sender is a member
      const challengerNumber = Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg)!.number;
      const challengerInfo = await Members_GetMemberInfoFromPhone(challengerNumber);
      if (challengerInfo === null) {
        await chat.SendTxt("Por alguna razón todavía no estás registrado como miembro, contacta a un admin para que te registre\nAdmins actuales:");
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await chat.SendTxt(adminsAvailable);
        return;
      }

      //Validates the user actually dueled someone
      if (!Phone_IsAMentionNumber(args.commandArgs.at(0) || '')) {
        await chat.SendTxt("No etiquetaste a nadie, prueba de nuevo");
        return;
      }

      //Validates that the tagged user is a member
      const challengedNumber = Phone_GetPhoneNumberFromMention(args.commandArgs.at(0)!)!.number;
      const challengedInfo = await Members_GetMemberInfoFromPhone(challengedNumber);
      if (challengedInfo === null) {
        await chat.SendTxt("Por alguna razón todavía no está registrado como miembro el usuario etiquetado, contacta a un admin para que te registre\nAdmins actuales:");
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await chat.SendTxt(adminsAvailable);
        return;
      }

      //Validates they aren't the same person
      if (challengerNumber === challengedNumber) {
        await chat.SendTxt("Te estás haciendo duelo a ti mismo?, no puedes hacer eso! 🦊");
        return;
      }

      //Waiting for the dueled person's response
      await chat.SendTxt(`
        ⏳ *¡Esperando respuesta de ${challengedInfo.username}!* ⏳  
        🔔 Tienes *60 segundos* para decidir:
        
        ${challengedInfo.username} puedes:
        - Escribe *aceptar* para unirte al duelo.  
        - Escribe *no gracias ya comí* o cualquier otro mensaje para rechazarlo.  

        ${challengerInfo.username}, si ya tuviste miedo, escribe *cancelar*.

        ⚔️ ¡El destino del duelo está en tus manos! 🔥
      `);

      const thatPersonRawMsg = await bot.Receive.WaitNextRawMsgFromPhone(args.chatId, args.userIdOrChatUserId, challengedNumber, MsgType.text, 60);
      const thatPersonTxt = Msg_GetTextFromRawMsg(thatPersonRawMsg).toLowerCase();

      //Other used has responded!
      if (thatPersonTxt.includes("aceptar") || thatPersonTxt.includes("si")) {
        //Both users are ready to duel, lets get the duel info
        await chat.SendTxt(`
          🎮⚔️ ¡Duelo en curso! ⚔️🎮
          🧢 Retador: ${challengerInfo.username}
          🏆 Retado: ${challengedInfo.username}

          ⏳ Tienen 20 minutos para enfrentarse y registrar su resultado con el comando:
          !duelwin [marcador] ó !duellose [marcador] (Ejemplo: !duelwin 2-1 o !duellose 2-1)

          ¡Que gane el mejor! 🚀🔥`
        );
        const matchPendingIdentifier = Date.now();
        const timerOnEnd = setTimeout(() => {
          const foundIndex = Kldb_Ram_PendingMatches.findIndex(match => match.dateTime === matchPendingIdentifier);
          if (foundIndex !== -1) {
            //It means the match never was completed it but still pending, so lets delete it
            Kldb_Ram_PendingMatches.splice(foundIndex, 1);
            chat.SendTxt(`
              ⏳💔 **El tiempo ha terminado** 💔⏳  
              El duelo entre *${challengerInfo.username}* y *${challengedInfo.username}* no se completó a tiempo.  
              ⚠️ **El duelo ya no está pendiente.** ¡Inténtenlo de nuevo cuando estén listos! 🚀
            `);
          }
        }, 1000 * 60 * 20 /* 20 minutes */);

        Kldb_Ram_PendingMatches.push({
          dateTime: matchPendingIdentifier,
          countDownTimer: timerOnEnd,
          challenger: challengerInfo,
          challenged: challengedInfo,
        })

      }
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) {
          await chat.SendTxt("⏳ **No se recibió una respuesta de la persona esperada.**\nParece que no contestó a tiempo.");
        }
        else if (e.wasAbortedByUser) {
          await chat.SendTxt("❌ **El usuario original canceló la espera.**\nEl duelo ha sido cancelado.");
        }
      } else {
        await chat.SendTxt("⚠️ **Algo salió mal** con el sistema o la base de datos.\nPor favor, intenta nuevamente o contacta con soporte.\nDetalles: " + JSON.stringify(e));
      }

    }
  }

}