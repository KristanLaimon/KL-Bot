import { Delegate } from '../src/bot/WhatsSocket';

// Define a test suite for the Delegate class
describe("Delegate class", () => {
  let delegate: Delegate<() => void>;

  beforeEach(() => {
    // Initialize the delegate before each test
    delegate = new Delegate();
  });

  // Test case for unsubscribing a function that is not subscribed
  test("Unsubscribe returns false when trying to unsubscribe a function that is not subscribed", () => {
    const testFunction = () => {
      console.log("Test function");
    };

    // Attempt to unsubscribe the test function
    const unsubscribeResult = delegate.Unsubsribe(testFunction);

    // Expect the unsubscribeResult to be false
    expect(unsubscribeResult).toBe(false);
  });
});

describe("Delegate class - Unsubscribe method", () => {
  it("should return true when successfully unsubscribing a function that is subscribed", () => {
    // Arrange
    const delegate = new Delegate<() => void>();
    const testFunction = jest.fn();
    delegate.Subscribe(testFunction);

    // Act
    const result = delegate.Unsubsribe(testFunction);

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when trying to unsubscribe a function that is not subscribed", () => {
    // Arrange
    const delegate = new Delegate<() => void>();
    const testFunction = jest.fn();

    // Act
    const result = delegate.Unsubsribe(testFunction);

    // Assert
    expect(result).toBe(false);
  });
});

// Unit test for the Unsubsribe method of Delegate class
test("Delegate.Unsubsribe should handle multiple subscriptions", () => {
  // Arrange
  const delegate = new Delegate<() => void>();
  const callback1 = jest.fn();
  const callback2 = jest.fn();
  const callback3 = jest.fn();

  delegate.Subscribe(callback1);
  delegate.Subscribe(callback2);
  delegate.Subscribe(callback3);

  // Act
  delegate.Unsubsribe(callback2);

  // Assert
  delegate.CallAll();
  expect(callback1).toHaveBeenCalledTimes(1);
  expect(callback2).toHaveBeenCalledTimes(0); // callback2 should not be called
  expect(callback3).toHaveBeenCalledTimes(1);
});