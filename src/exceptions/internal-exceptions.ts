import { ERRORCODES, HttpException } from "./root";

export class InternalException extends HttpException {
    constructor (message: string, error: any, errorCodes: ERRORCODES) {
        super(message, errorCodes, 500, error)
    }
}