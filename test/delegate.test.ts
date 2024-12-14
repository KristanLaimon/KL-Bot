import { Delegate } from '../src/bot/WhatsSocket';

const functy = () => { };
let del: Delegate<() => void>;

beforeEach(() => {
  del = new Delegate<() => void>();
  del.Subscribe(functy);
});

describe("Subscribing a delegate", () => {
  it("Should at least add a delegate", () => {
    expect(del.Length).toBe(1);
  })
})

describe("Unsubsribe a delegate", () => {
  it("Should be length zero if there are none of delegates", () => {
    del.Unsubsribe(functy);
    expect(del.Length).toBe(0);
    expect(del.Unsubsribe(functy)).toBe(false);
  })
})

describe("Calling all", () => {
  it("Should call all once", () => {
    del.Unsubsribe(functy);
    expect(del.Length === 0);
    const manyMocks = [0, 1, 2, 3, 4, 5].map(i => jest.fn());
    manyMocks.forEach(fn => del.Subscribe(fn));
    del.CallAll();
    manyMocks.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
  })
})