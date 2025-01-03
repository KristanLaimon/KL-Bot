import HashMapChaining from "../../src/lib/HashMapChaining";
import { before } from "node:test";

let hashy :HashMapChaining<number, string>;

describe("Adding", () => {
  beforeAll(() => {
    hashy = new HashMapChaining<number, string>();
  })

  beforeEach(() => {
    hashy.clear();
  })

  it("Should add a key and value", () => {
    hashy.add(1, "uno");
    expect(hashy.Length).toBe(1);
    expect(hashy.toArray()).toStrictEqual([{key: 1, value: ["uno"]}]);
  })

  it("Should add multiple keys and values", () => {
    hashy.add(1, "uno");
    hashy.add(2, "dos");
    expect(hashy.Length).toBe(2);
    expect(hashy.toArray()).toStrictEqual([{key: 1, value: ["uno"]}, {key: 2, value: ["dos"]}]);
  })
  it("Should add multiples values to same key", () => {
    hashy.add(1, "uno");
    hashy.add(1, "dos");
    hashy.add(1, "tres");
    hashy.add(1, "cuatro");
    expect(hashy.Length).toBe(1);
    expect(hashy.toArray()).toStrictEqual([{key: 1, value: ["uno", "dos", "tres", "cuatro"]}]);
  })
})

describe("Getting", () => {
  beforeAll(() => {
    hashy = new HashMapChaining<number, string>();
    hashy.add(1, "uno");
    hashy.add(1, "dos");
    hashy.add(1, "tres");
    hashy.add(1, "cuatro");
    hashy.add(2, "cinco");
    hashy.add(2, "seis");
    hashy.add(2, "siete");
    hashy.add(3, "ocho");
    hashy.add(4, "nueve");
  })
  
  it("Should get a value", () => {
    expect(hashy.get(1)).toStrictEqual(["uno", "dos", "tres", "cuatro"]);
    expect(hashy.get(2)).toStrictEqual(["cinco", "seis", "siete"]);
    expect(hashy.get(3)).toStrictEqual(["ocho"]);
    expect(hashy.get(4)).toStrictEqual(["nueve"]);
  })
})