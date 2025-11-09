import { ERRORCODES, HttpException } from "./root";

export default class UnproccessableRequest extends HttpException {
    constructor(error: any, message: string, errorCode:ERRORCODES) {
        super(message, errorCode, 422, error)
    }
}