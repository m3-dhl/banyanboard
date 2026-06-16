import { ErrorRequestHandler } from 'express';

/**
 * Catches SyntaxError thrown by express.json() when the request body
 * contains malformed JSON, and returns a structured 400 response.
 * All other errors are forwarded to the next error handler.
 */
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

export default jsonErrorHandler;
