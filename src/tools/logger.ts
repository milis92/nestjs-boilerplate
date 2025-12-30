import { type IncomingMessage, type ServerResponse } from 'http';
import { Params } from 'nestjs-pino';
import { GenReqId, Options } from 'pino-http';
import { LogCollector, LogLevel } from '@/config/app.config';

const REQUEST_ID_HEADER = 'X-Request-Id';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.email',
  'req.body.password',
  'req.body.oldPassword',
];

const generateRequestId: GenReqId = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
) => {
  const requestId =
    req.headers[REQUEST_ID_HEADER] ??
    req.headers[REQUEST_ID_HEADER.toLowerCase()] ??
    crypto.randomUUID();
  res.setHeader(REQUEST_ID_HEADER, requestId);
  return requestId;
};

function logCollectorConfig(logCollector: LogCollector): Options {
  switch (logCollector) {
    case LogCollector.Console:
    default:
      return consoleLoggerConfig();
  }
}

export function consoleLoggerConfig(): Options {
  return {
    messageKey: 'msg',
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
        ignore:
          'req.id,req.headers,req.remoteAddress,req.remotePort,res.headers',
      },
    },
  };
}

export default function useLoggerFactory(
  level: LogLevel,
  logCollector: LogCollector,
): Params {
  const pinoHttpOptions: Options = {
    level: level,
    genReqId: generateRequestId,
    redact: {
      // Redact sensitive information
      paths: REDACTED_PATHS,
      censor: '**GDPR COMPLIANT**',
    },
    ...logCollectorConfig(logCollector),
  };

  return {
    pinoHttp: pinoHttpOptions,
  };
}
