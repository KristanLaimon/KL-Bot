import fs from "fs";
import path from "path";
import KlLogger from "../bot/logger";
import { Dates_GetFormatedDurationTimeFrom } from "./dates";
import { Str_CenterText, Str_NormalizeLiteralString, Str_StringifyObj } from "./strings";
import { KlPlayer, KlScheduledMatch_Player, KlTournamentEnhanced, KlSubscriptionEnhanced, TeamColor } from "../types/db";
import { GenericTournament } from "../logic/GenericTournament";
import { WAMessage } from "@whiskeysockets/baileys";
import { Phone_GetFullPhoneInfoFromRawmsg, Phone_GetPhoneNumberFromMention } from "./phonenumbers";
import Kldb from "./kldb";
import moment from "moment";

//------------------- Db Utils ------------------
// ============================ PLAYERS =============================
export async function Db_GetStandardInfoPlayerFromRawMsg(rawMsg: WAMessage):Promise<KlPlayer | null>{
  return await Db_GetStandardInfoPlayerFromNumber(Phone_GetFullPhoneInfoFromRawmsg(rawMsg).number);
}

export async function Db_GetStandardInfoPlayerFromMention(mention:string):Promise<KlPlayer | null>{
  const phoneInfo = Phone_GetPhoneNumberFromMention(mention);
  if(phoneInfo === null)return null;
  return await Db_GetStandardInfoPlayerFromNumber(phoneInfo.number);
}

export async function Db_GetStandardInfoPlayerFromNumber(number:string):Promise<KlPlayer | null>{
  try{
    return await Kldb.player.findFirstOrThrow({
      where: { phoneNumber: number },
      include: { Rank: true, Role: true }
    }) ;
  }catch(e){
    return null;
  }
}

export async function Db_GetStandardTournamentEnhancedInfo(tournamentId: number):Promise<KlTournamentEnhanced|null>{
  try{
    return await Kldb.tournament.findFirstOrThrow({
      where:{id:tournamentId},
      include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: { include: { Player: { include: { Rank: true, Role: true } } } } }
    })
  }catch(e){
    return null;
  }
}

// ============================ TOURNAMENTS =============================
export async function Db_DeleteTournamentById(tournamentId: number): Promise<boolean> {
  const tournament = await Kldb.tournament.findFirst({ where: { id: tournamentId } });
  if (!tournament) return false;

  if (tournament.cover_img_name) {
    try {
      fs.unlinkSync(path.join('db/tournaments_covers', tournament.cover_img_name));
    } catch (error) {
      KlLogger.error(`Failed to delete tournament cover: ${error}`);
    }
  }

  try {
    await Kldb.tournament.delete({ where: { id: tournamentId } });
    return true;
  } catch (error) {
    KlLogger.error(`Failed to delete tournament: ${error}`);
    return false;
  }
}

export async function Db_GetTournamentFormattedInfoStr(tournamentId: number): Promise<string> {
  try {
    const selectedTournament = await Kldb.tournament.findFirstOrThrow({
      where: { id: tournamentId },
      include: {
        TournamentType: true,
        Tournament_Rank_RanksAdmitteds: {
          include: { Rank: true },
          orderBy: { Rank: { id: "asc" } }
        },
        Tournament_Player_Subscriptions: {
          include: { Player: { include: { Rank: true, Role: true } } },
          orderBy: { Player: { username: "asc" } }
        },
        MatchFormat: true
      }
    });
    const playersSubscribed = selectedTournament.Tournament_Player_Subscriptions;
    const admittedRanks = selectedTournament.Tournament_Rank_RanksAdmitteds;

    const actualState:string =
      playersSubscribed.length < selectedTournament.max_players ? "✅ Abierto a inscripciones"
        : selectedTournament.endDate && moment().isBefore(moment(Number(selectedTournament.endDate))) ? "⏳ En curso"
        : "⛔ Finalizado";

    const imgCaptionInfo = `
      =🌟 *${selectedTournament.name.toUpperCase()}* 🌟=
      ${actualState}
      ${selectedTournament.description}

      📊 Capacidad: ${playersSubscribed.length}/${selectedTournament.max_players}
      🎮 Tipo: ${selectedTournament.TournamentType.name}
      🦁 Modo de juego: ${selectedTournament.MatchFormat.name}
      ⌛ Días para jugar cada fase: ${selectedTournament.matchPeriodTime + (selectedTournament.matchPeriodTime === 1 ? " día" : " días")}
      🕒 Creado: ${Dates_GetFormatedDurationTimeFrom(selectedTournament.creationDate, { includingSeconds: true })}
      📅 Inicio: ${selectedTournament.beginDate ? Dates_GetFormatedDurationTimeFrom(selectedTournament.beginDate, { includingSeconds: true }) : "No ha iniciado todavía"}
      ⏳ Cierre: ${selectedTournament.endDate
        ? Dates_GetFormatedDurationTimeFrom(selectedTournament.endDate)
        : "⛔ Se sabrá al iniciar"}

      🏆 Rangos admitidos: 
      ${admittedRanks.length === 0
        ? "🎲 Todos los rangos permitidos"
        : admittedRanks.map(r => `🎯 ${Str_NormalizeLiteralString(r.Rank.name)}`).join("\n")}

      🔖 Inscritos: 
      ${playersSubscribed.length === 0
        ? "😔 Nadie todavía"
        : new Array(selectedTournament.max_players)
          .fill(null)
          .map((_, i) => (i < playersSubscribed.length ? `🔹 ${playersSubscribed[i].Player.username} (${playersSubscribed[i].Player.Rank.name})` : "🔹 -----"))
          .join("\n")}
    `;

    return Str_NormalizeLiteralString(imgCaptionInfo);
  } catch (e) {
    return "No se pudo obtener la información del torneo...";
  }
}


export async function Db_FormatStrPlanningMatches(tournamentId:number): Promise<string>{
  const tournamentInfo :KlTournamentEnhanced|null = await Db_GetStandardTournamentEnhancedInfo(tournamentId);
  if(tournamentInfo === null) return "No se encontró información de los planes del torneo";

  const info = await Kldb.scheduledMatchWindow.findFirst({
    where: { tournament_id: tournamentInfo.id },
    include: {
      ScheduledMatches: {
        include: {
          MatchType: true,
          ScheduledMatch_Players: {
            include: {
              TeamColor: true,
              Player: {
                include: {
                  Rank: true,
                  Role: true }}}}}}},
  });

  const finalPlayersMsgToShowArray:string[] = [];
  const isCustomTournament = tournamentInfo.custom_players_per_team !== -1;
  const playersPerTeam = isCustomTournament ? tournamentInfo.custom_players_per_team : tournamentInfo.MatchFormat.players_per_team;
  const formatPlayer  = (player:KlPlayer) => `${player.username}`;
  const addFormatNumber  = () => finalPlayersMsgToShowArray.push(`#${++counter}`);

  let counter = 0;
  for(const match of info.ScheduledMatches){
    const blueTeam:KlPlayer[] = [];
    const orangeTeam:KlPlayer[] = [];

    for(const playerInfo of match.ScheduledMatch_Players)
      playerInfo.team_color_id === 'BLU' ? blueTeam.push(playerInfo.Player) : orangeTeam.push(playerInfo.Player);

    if(playersPerTeam <= 0) throw new Error("Custom players per team not correctly implemented ??? " + playersPerTeam + "players per team found");
    if(playersPerTeam === 1){
      addFormatNumber()
      finalPlayersMsgToShowArray.push(`${formatPlayer(blueTeam.at(0))} Vs ${formatPlayer(orangeTeam.at(0))}`)
    }
    if(playersPerTeam === 2){
      addFormatNumber()
      finalPlayersMsgToShowArray.push(`${blueTeam.map(formatPlayer) .join(', ')}`)
      finalPlayersMsgToShowArray.push("----------- Vs ------------");
      finalPlayersMsgToShowArray.push(`${orangeTeam.map(formatPlayer).join(', ')}`)
    }
    if(playersPerTeam >= 3){
      addFormatNumber()
      finalPlayersMsgToShowArray.push(`${blueTeam.map(formatPlayer) .join('\n')}`)
      finalPlayersMsgToShowArray.push("----------- Vs ------------");
      finalPlayersMsgToShowArray.push(`${orangeTeam.map(formatPlayer).join('\n')}`)
    }
  }
  return Str_CenterText(finalPlayersMsgToShowArray, "auto", "", 2);
}


export async function Db_InsertNewTournamentSubscription(subscriptionDateTimeUNIX: number, playerId: number, tournamentId: number): Promise<{wasCorrectSub:boolean, tournamentIsFull:boolean}> {
  try {
    await Kldb.tournament_Player_Subscriptions.create({
      data: {
        subscription_date: subscriptionDateTimeUNIX,
        player_id: playerId,
        tournament_id: tournamentId
      }
    })

    const tournamentInfo: KlTournamentEnhanced = await Kldb.tournament.findFirstOrThrow({ where: { id: tournamentId }, include: { Tournament_Player_Subscriptions: true, TournamentType: true, MatchFormat: true } });

    if (tournamentInfo.Tournament_Player_Subscriptions.length >= tournamentInfo.max_players) {
      const wasCorrectSub =  await Db_InsertNewPhaseTournamentPlanning(tournamentInfo);
      return {wasCorrectSub, tournamentIsFull: true};
    }

    return {wasCorrectSub: true, tournamentIsFull: false};
  } catch (e) {
    KlLogger.error(`Failed to insert new tournament subscription inside Db_InsertNewTournamentSubscription: ${Str_StringifyObj(e)}`);
    return {wasCorrectSub: false, tournamentIsFull: false};
  }
}

export async function Db_InsertNewPhaseTournamentPlanning(tournamentInfo: KlTournamentEnhanced): Promise<boolean> {
  try {
    const participants: KlSubscriptionEnhanced[] = await Kldb.tournament_Player_Subscriptions.findMany({
      where: { tournament_id: tournamentInfo.id },
      include: { Player: { include: { Rank: true, Role: true } } }
    });

    const phasePlanning = GenericTournament.PlanNextPhaseMatches(tournamentInfo, participants);

    //Update tournament endDate
    await Kldb.tournament.update({
      where: { id: tournamentInfo.id },
      data: {
        beginDate: phasePlanning.StartDate,
        endDate: phasePlanning.EndDate
      }
    });

    //Most optimized possible…
    const scheduledMatch_PlayersToInsert: KlScheduledMatch_Player[] = [];

    //Adding ScheduleMatch general info
    const fullCreatedMW = await Kldb.scheduledMatchWindow.create({
      data: {
        starting_date: BigInt(phasePlanning.StartDate),
        ending_date: BigInt(phasePlanning.EndDate),
        tournament_id: tournamentInfo.id
      }
    });

    //Adding every ScheduleMatch inside
    for (const sm of phasePlanning.ScheduledMatches) {
      const fullCreatedSM = await Kldb.scheduledMatch.create({
        data: {
          match_type: sm.MatchTypeId,
          scheduled_match_window_id: fullCreatedMW.id
        }
      })

      const zeroOrOne = Math.round(Math.random());
      const teamColorId1: string = zeroOrOne === 0 ? TeamColor.Blue : TeamColor.Orange;
      const teamColorId2: string = !(zeroOrOne === 0) ? TeamColor.Blue : TeamColor.Orange;

      for (const p of sm.Team1) {
        scheduledMatch_PlayersToInsert.push({
          player_id: p.id,
          team_color_id: teamColorId1,
          scheduled_match_id: fullCreatedSM.scheduled_match_window_id
        })
      }

      for (const p of sm.Team2) {
        scheduledMatch_PlayersToInsert.push({
          player_id: p.id,
          team_color_id: teamColorId2,
          scheduled_match_id: fullCreatedSM.scheduled_match_window_id
        })
      }

      await Kldb.scheduledMatch_Player.createMany({
        data: scheduledMatch_PlayersToInsert.map<KlScheduledMatch_Player>(info => ({
          scheduled_match_id: info.scheduled_match_id,
          player_id:  info.player_id,
          team_color_id:  info.team_color_id,
        }))
      });
    }

    return true;
  } catch (e) {
    KlLogger.error(`Couldn't plan tournament nor update it (maybe) in db: ${JSON.stringify(e, null, 0)}`);
    return false;
  }
}




