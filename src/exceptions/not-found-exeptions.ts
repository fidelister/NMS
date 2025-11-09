import { ERRORCODES, HttpException } from "./root";

export class NotFoundException extends HttpException {
    constructor(message: string, errorCodes: ERRORCODES) {
        super(message, errorCodes, 404, null);
    }
}