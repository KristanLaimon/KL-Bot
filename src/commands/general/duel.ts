import Bot from '../../bot';
import Kldb, { TempPendingMatches } from '../../utils/db';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, MsgType } from '../../types/commands';
import { AllUtilsType } from '../../utils/index_utils';


//TODO: !duelpending? && !duellose
export default class DuelCommand implements ICommand {
  commandName: string = "duel";
  description: string = 'Reta a un duelo 1vs1 a otra persona'
  roleCommand: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs, u: AllUtilsType) {
    const t = u.Msg.CreateSenderReplyToolKit(bot, args);

    try {
      //Validates the original sender is a member
      const challengerNumber = u.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalMsg)!.fullRawCleanedNumber;
      const challengerInfo = await u.Member.GetMemberInfoFromPhone(challengerNumber, "Miembro");
      if (challengerInfo === null) {
        await t.txtToChatSender("Por alguna razón todavía no estás registrado como miembro, contacta a un admin para que te registre\nAdmins actuales:");
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await t.txtToChatSender(adminsAvailable);
        return;
      }

      //Validates the user actually dueled someone
      if (!u.PhoneNumber.isAMentionNumber(args.commandArgs.at(0) || '')) {
        await t.txtToChatSender("No etiquetaste a nadie, prueba de nuevo");
        return;
      }

      //Validates that the tagged user is a member
      const challengedNumber = u.PhoneNumber.GetPhoneNumberFromMention(args.commandArgs.at(0)!)!.fullRawCleanedNumber;
      const challengedInfo = await u.Member.GetMemberInfoFromPhone(challengedNumber, "Miembro");
      if (challengedInfo === null) {
        await t.txtToChatSender("Por alguna razón todavía no está registrado como miembro el usuario etiquetado, contacta a un admin para que te registre\nAdmins actuales:");
        //It assumes there's at least an admin registered
        const adminsAvailable =
          (await Kldb.player.findMany({ where: { role: "AD" } }))
            .map(ad =>
              `🐺 ${ad.username}`
            ).join("\n");
        await t.txtToChatSender(adminsAvailable);
        return;
      }

      //Validates they aren't the same person
      if (challengerNumber === challengedNumber) {
        await t.txtToChatSender("Te estás haciendo duelo a ti mismo?, no puedes hacer eso! 🦊");
        return;
      }

      //Waiting for the dueled person's response
      await t.txtToChatSender(`
        ⏳ *¡Esperando respuesta de ${challengedInfo.username}!* ⏳  
        🔔 Tienes *60 segundos* para decidir:
        
        ${challengedInfo.username} puedes:
        - Escribe *aceptar* para unirte al duelo.  
        - Escribe *no gracias ya comí* o cualquier otro mensaje para rechazarlo.  

        ${challengerInfo.username}, si ya tuviste miedo, escribe *cancelar*.

        ⚔️ ¡El destino del duelo está en tus manos! 🔥
      `);
      const thatPersonRawMsg = await bot.WaitNextRawMsgFromPhone(args.chatId, args.userId, challengedNumber, MsgType.text, 60);
      const thatPersonTxt = u.Msg.GetTextFromRawMsg(thatPersonRawMsg).toLowerCase();

      //Other used has responded!
      if (thatPersonTxt.includes("aceptar") || thatPersonTxt.includes("si")) {
        //Both users are ready to duel, lets get the duel info
        await t.txtToChatSender(`
          🎮⚔️ ¡Duelo en curso! ⚔️🎮
          🧢 Retador: ${challengerInfo.username}
          🏆 Retado: ${challengedInfo.username}

          ⏳ Tienen 20 minutos para enfrentarse y registrar su resultado con el comando:
          !duelwin [marcador] ó !duellose [marcador] (Ejemplo: !duelwin 2-1 o !duellose 2-1)

          ¡Que gane el mejor! 🚀🔥`
        );
        const matchPendingIdentifier = Date.now();
        const timerOnEnd = setTimeout(() => {
          const foundIndex = TempPendingMatches.findIndex(match => match.dateTime === matchPendingIdentifier);
          if (foundIndex !== -1) {
            //It means the match never was completed it but still pending, so lets delete it
            TempPendingMatches.splice(foundIndex, 1);
            t.txtToChatSender(`
              ⏳💔 **El tiempo ha terminado** 💔⏳  
              El duelo entre *${challengerInfo.username}* y *${challengedInfo.username}* no se completó a tiempo.  
              ⚠️ **El duelo ya no está pendiente.** ¡Inténtenlo de nuevo cuando estén listos! 🚀
            `);
          }
        }, 1000 * 60 * 20 /* 20 minutes */);

        TempPendingMatches.push({
          dateTime: matchPendingIdentifier,
          countDownTimer: timerOnEnd,
          challenger: challengerInfo,
          challenged: challengedInfo,
        })

      }
    } catch (e) {
      if (u.Msg.isBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) {
          await t.txtToChatSender("⏳ **No se recibió una respuesta de la persona esperada.**\nParece que no contestó a tiempo.");
        }
        else if (e.wasAbortedByUser) {
          await t.txtToChatSender("❌ **El usuario original canceló la espera.**\nEl duelo ha sido cancelado.");
        }
      } else {
        await t.txtToChatSender("⚠️ **Algo salió mal** con el sistema o la base de datos.\nPor favor, intenta nuevamente o contacta con soporte.\nDetalles: " + JSON.stringify(e));
      }

    }
  }

}