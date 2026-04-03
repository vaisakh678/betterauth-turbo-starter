export class APIError extends Error {
	constructor(
		public readonly statusCode: number,
		message: string,
	) {
		super(message);
		this.name = "APIError";
	}
}

export const BadRequest = (message: string) => new APIError(400, message);
export const Unauthorized = (message = "Unauthorized") => new APIError(401, message);
export const Forbidden = (message = "Forbidden") => new APIError(403, message);
export const NotFound = (message: string) => new APIError(404, message);
export const Conflict = (message: string) => new APIError(409, message);
export const InternalError = (message = "Internal server error") => new APIError(500, message);
