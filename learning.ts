import humanizeDuration from "humanize-duration";
import Kldb from './src/utils/db';

async function main() {

  const __allGameTypesExceptSomeOnes = await Kldb.matchType.findMany({ where: { NOT: { id: { in: ["1S", "2S", "3S"] } } }, orderBy: { id: "asc" } });
}
main();
const memberTimeHumanizer = humanizeDuration.humanizer(
  {
    language: 'es', fallbacks: ['en'],
    round: true,
    conjunction: " y ",
    units: ["y", "mo", "w", "d"],
    serialComma: false
  }
);

const tournamentExactHumanizer = humanizeDuration.humanizer(
  {
    language: 'es', fallbacks: ['en'],
    round: true,
    conjunction: " y ",
    units: ["y", "mo", "w", "d", "h", "m", "s"],
    serialComma: false
  }
);





// it("Should spy on math add function", () => {
//   expect((math.add as jest.Mock).mock.calls.length).toBe(1);
// });

// console.log(math.add(2, 3)); // Output: 10