/**
 * Builds HTTP headers with JSON content type and an Authorization token.
 * @param {string} token - the JWT token
 * @return {object} the headers object
 */
const createHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: token,
});

/**
 * Throws an error if the response is not successful.
 * Uses custom messages for status 400, 403 and 409.
 * @param {Response} response - the fetch response to check
 * @param {string} forbiddenMessage - error message for 403
 * @param {string} badRequestMessage - error message for 400
 * @param {string} conflictMessage - error message for 409
 */
const ensureRequestSucceeded = (
  response: Response,
  forbiddenMessage?: string,
  badRequestMessage?: string,
  conflictMessage?: string,
) => {
  if (response.ok) {
    return;
  }

  if (response.status === 403 && forbiddenMessage) {
    throw new Error(forbiddenMessage);
  }

  if (response.status === 400 && badRequestMessage) {
    throw new Error(badRequestMessage);
  }

  if (response.status === 409 && conflictMessage) {
    throw new Error(conflictMessage);
  }

  throw new Error(`Erreur ${response.status}`);
};

export { createHeaders, ensureRequestSucceeded };
