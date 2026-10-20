import { type ExecutionContext, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  auth,
  InvalidRequestError,
  InvalidTokenError,
  InsufficientScopeError,
  UnauthorizedError,
} from 'express-oauth2-jwt-bearer';
import type { Mock } from 'vitest';
import type { Env } from '../../infrastructure/config/env.schema.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';

// Keep the real error hierarchy: instanceof checks are part of the contract.
vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('express-oauth2-jwt-bearer')>()),
  auth: vi.fn(),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let context: ExecutionContext;
  let controller: new () => object;
  let handler: () => void;
  let request: Request;
  let response: Response;
  let setHeader: Mock<Response['set']>;
  let verify: ReturnType<typeof vi.fn<RequestHandler>>;

  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    controller = class TestController {};
    handler = () => undefined;
    request = {} as Request;
    setHeader = vi.fn<Response['set']>();
    // The guard only calls res.set, so a type-checked Pick downcasts directly.
    const partialResponse: Pick<Response, 'set'> = { set: setHeader };
    response = partialResponse as Response;
    context = new ExecutionContextHost(
      [request, response],
      controller,
      handler,
    );
    verify = vi.fn<RequestHandler>((_req, _res, next) => next());
    vi.mocked(auth).mockReturnValue(verify);
    guard = new JwtAuthGuard(
      new Reflector(),
      new ConfigService<Env, true>({
        AUTH0_ISSUER_BASE_URL: 'https://tenant.example/',
        AUTH0_AUDIENCE: 'https://api.classflow.test',
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('configures verification with the trusted issuer and audience', () => {
    expect(auth).toHaveBeenCalledExactlyOnceWith({
      issuerBaseURL: 'https://tenant.example/',
      audience: 'https://api.classflow.test',
    });
  });

  it('allows a public controller without invoking token verification', async () => {
    Public()(controller);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('allows a public handler without invoking token verification', async () => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('lets a protected handler override a public controller', async () => {
    Public()(controller);
    Reflect.defineMetadata(IS_PUBLIC_KEY, false, handler);
    verify.mockImplementation((_req, _res, next) =>
      next(new UnauthorizedError()),
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(verify).toHaveBeenCalledOnce();
  });

  it('waits for verification before allowing access and retains verified claims', async () => {
    let complete!: NextFunction;
    verify.mockImplementation((_req, _res, next) => {
      complete = next;
    });
    let settled = false;
    const result = guard.canActivate(context).then((allowed) => {
      settled = true;
      return allowed;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    expect(verify).toHaveBeenCalledExactlyOnceWith(
      request,
      response,
      expect.any(Function),
    );
    const claims = { sub: 'auth0|test-user' };
    request.auth = {
      header: { alg: 'RS256' },
      payload: claims,
      token: 'test-token',
    };
    complete();

    await expect(result).resolves.toBe(true);
    expect(request.auth.payload).toEqual(claims);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'missing credentials',
      error: new UnauthorizedError(),
      status: 401,
    },
    {
      label: 'malformed authentication request',
      error: new InvalidRequestError(),
      status: 400,
    },
    {
      label: 'insufficient scope',
      error: new InsufficientScopeError(['read:classes']),
      status: 403,
    },
  ])(
    'preserves the status and challenge for $label',
    async ({ error, status }) => {
      verify.mockImplementation((_req, _res, next) => next(error));

      const caught: unknown = await guard
        .canActivate(context)
        .catch((err: unknown) => err);

      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(status);
      expect((caught as HttpException).getResponse()).toBe(error.message);
      expect(setHeader).toHaveBeenCalledExactlyOnceWith(error.headers);
    },
  );

  it('removes internal verification details from both the response and challenge', async () => {
    const internalDetails =
      'Failed to fetch keys from https://internal.example/private';
    const error = new InvalidTokenError(internalDetails);
    verify.mockImplementation((_req, _res, next) => next(error));

    const caught: unknown = await guard
      .canActivate(context)
      .catch((err: unknown) => err);

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(401);
    expect((caught as HttpException).getResponse()).toBe('Invalid Token');
    expect(setHeader).toHaveBeenCalledExactlyOnceWith({
      'WWW-Authenticate':
        'Bearer realm="api", error="invalid_token", error_description="Invalid Token"',
    });
    expect(JSON.stringify(setHeader.mock.calls)).not.toContain(internalDetails);
  });

  it('propagates unexpected failures unchanged without setting an auth challenge', async () => {
    const error = new Error('Unexpected application failure');
    verify.mockImplementation((_req, _res, next) => next(error));

    await expect(guard.canActivate(context)).rejects.toBe(error);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('propagates synchronous middleware failures unchanged', async () => {
    const error = new Error('Middleware failed before calling next');
    verify.mockImplementation(() => {
      throw error;
    });

    await expect(guard.canActivate(context)).rejects.toBe(error);
    expect(setHeader).not.toHaveBeenCalled();
  });
});
