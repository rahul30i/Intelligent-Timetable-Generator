export class NotFoundError extends Error {
  statusCode = 404;
}

export class BadRequestError extends Error {
  statusCode = 400;
}

export class UnauthorizedError extends Error {
  statusCode = 401;
}
