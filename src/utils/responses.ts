const Responses_Affirmative = ['si', 's', 'yes', 'y', 'ok', 'yep'];
const Responses_Negative = ['no', 'n', 'nope', 'nop'];

/**
 * Checks if a given string is an affirmative response.
 * @example
 * isAfirmativeResponse("Si"); // true
 * isAfirmativeResponse("nO"); // false
 * isAfirmativeResponse("ok"); // true
 * isAfirmativeResponse("nope"); // false
 * @param {string} rawResponse - the string to check
 * @returns {boolean} - true if the string is an affirmative response, false otherwise
 */
export function Reponse_isAfirmativeAnswer(rawResponse: string): boolean {
  return Responses_Affirmative.includes(rawResponse.toLowerCase());
}

/**
 * Checks if a given string is a negative response.
 * @example
 * isNegativeResponse("No"); // true
 * isNegativeResponse("nO"); // true
 * isNegativeResponse("si"); // false
 * isNegativeResponse("ok"); // false
 * @param {string} rawResponse - the string to check
 * @returns {boolean} - true if the string is a negative response, false otherwise
 */
export function Response_isNegativeAnswer(rawResponse: string): boolean {
  return Responses_Negative.includes(rawResponse.toLowerCase());
}