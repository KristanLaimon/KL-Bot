import Kldb from "../src/utils/kldb";
import kldb from "../src/utils/kldb";

it("Should mock kldb entirely", async() => {
  Kldb.tournament.findMany();

  expect(Kldb.tournament.findMany).toHaveBeenCalledTimes(1);
  expect(kldb).toBeTruthy();
  const test = await kldb.tournament.findMany()
  expect(Array.isArray(test))
  expect(test.length > 0)
})