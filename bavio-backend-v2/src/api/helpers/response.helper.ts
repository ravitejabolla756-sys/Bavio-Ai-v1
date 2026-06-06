import { Response } from 'express';

export class ResponseHelper {
  public static success(
    res: Response,
    statusCode: number,
    data: any,
    countryCode: string = 'US',
    currencyCode: string = 'USD'
  ) {
    return res.status(statusCode).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      country: countryCode,
      currency: currencyCode,
      data
    });
  }

  public static error(
    res: Response,
    statusCode: number,
    message: string,
    errorCode: string,
    countryCode: string = 'US'
  ) {
    return res.status(statusCode).json({
      error: message,
      error_code: errorCode,
      country: countryCode,
      timestamp: new Date().toISOString()
    });
  }
}
