import { ERRORCODES, HttpException } from "./root";
import { Response } from "express";

export class UnauthorizedException extends HttpException {
  constructor(message: string, errorCodes: ERRORCODES) {
    super(message, errorCodes, 401, null);
  }

  sendResponse(res: Response) {
    return res.status(this.statusCode).json({
      success: false,
      message: this.message,
      errorcode: this.errorCode,
    });
  }
}
