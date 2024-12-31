import kldb from "../../src/utils/kldb";

describe("Generic Tournament (Abstract)", () =>{
  it("Plan: 4 people, 2vs2",async () => {
    const tournamentInfo = await kldb.tournament.findFirstOrThrow({ where: { id: 1 }, include: { TournamentType: true, MatchFormat: true } });

  })
})