import { ERRORCODES, HttpException } from "./root";

export class BadRequestsException extends HttpException {
    constructor(message: string, errorCodes: ERRORCODES) {
        super(message, errorCodes, 400, null);
    }
}