import humanizeDuration from "humanize-duration";

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