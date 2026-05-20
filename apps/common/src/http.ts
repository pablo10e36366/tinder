import { HttpException, HttpStatus } from '@nestjs/common';

function normalizeHeaders(headers?: HeadersInit): HeadersInit {
  return {
    'content-type': 'application/json',
    ...(headers ?? {}),
  };
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const message = (payload as Record<string, unknown>).message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return null;
}

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: normalizeHeaders(init?.headers),
  });

  if (response.status === HttpStatus.NO_CONTENT) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new HttpException(
      extractErrorMessage(payload) ?? `Request to ${url} failed`,
      response.status,
    );
  }

  return payload as T;
}
