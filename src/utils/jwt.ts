import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTVerifyOptions,
  errors,
} from "jose"
import { ApiError } from "./api-error.js"

export interface VerifiedUserPayload extends JWTPayload {
  userId?: string
  id?: string
  email?: string
  name?: string
  role?: string
}

let jwksResolver: ReturnType<typeof createRemoteJWKSet> | null = null
let currentJwksUrl: string | null = null

export function getJWKSResolver(overrideUrl?: string): ReturnType<typeof createRemoteJWKSet> {
  const targetUrl =
    overrideUrl ||
    process.env.BETTER_AUTH_JWKS_URL ||
    `${process.env.CLIENT_URL || "http://localhost:3000"}/api/auth/jwks`

  if (!jwksResolver || currentJwksUrl !== targetUrl) {
    currentJwksUrl = targetUrl
    jwksResolver = createRemoteJWKSet(new URL(targetUrl), {
      cooldownDuration: 30000,
      cacheMaxAge: 600000,
    })
  }

  return jwksResolver
}

export function resetJWKSResolver(): void {
  jwksResolver = null
  currentJwksUrl = null
}

export async function verifyToken(
  token: string,
  customOptions?: JWTVerifyOptions
): Promise<VerifiedUserPayload> {
  const verifyOptions: JWTVerifyOptions = {
    algorithms: ["RS256", "EdDSA", "ES256"],
    ...customOptions,
  }

  if (process.env.BETTER_AUTH_ISSUER && !verifyOptions.issuer) {
    verifyOptions.issuer = process.env.BETTER_AUTH_ISSUER
  }

  if (process.env.BETTER_AUTH_AUDIENCE && !verifyOptions.audience) {
    verifyOptions.audience = process.env.BETTER_AUTH_AUDIENCE
  }

  try {
    const resolver = getJWKSResolver()
    const { payload } = await jwtVerify(token, resolver, verifyOptions)
    return payload as VerifiedUserPayload
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw ApiError.unauthorized("Authorization token has expired")
    }
    if (error instanceof errors.JWSSignatureVerificationFailed) {
      throw ApiError.unauthorized("Invalid token signature")
    }
    if (error instanceof errors.JWTClaimValidationFailed) {
      throw ApiError.unauthorized("Token claim validation failed")
    }
    if (error instanceof errors.JWKSNoMatchingKey) {
      throw ApiError.unauthorized("No matching signing key found in JWKS")
    }
    if (error instanceof errors.JWSInvalid || error instanceof errors.JWTInvalid) {
      throw ApiError.unauthorized("Invalid or malformed authorization token")
    }

    if (error instanceof Error && error.message.includes("fetch failed")) {
      console.error("JWKS endpoint unreachable:", error.message)
      throw ApiError.internal("Authentication service is temporarily unavailable")
    }

    const message = error instanceof Error ? error.message : "Authentication failed"
    throw ApiError.unauthorized(message)
  }
}

