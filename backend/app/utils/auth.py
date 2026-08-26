import logging
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.models.auth import TokenPayload

logger = logging.getLogger("weather-comfort")

# Prevent automatic 403 Forbidden errors when Authorization header is missing
security = HTTPBearer(auto_error=False)

# Local JWKS cache wrapper
_jwk_client: Optional[jwt.PyJWKClient] = None

def get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        _jwk_client = jwt.PyJWKClient(jwks_url)
    return _jwk_client

def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> TokenPayload:
    """
    Validates the Auth0 JWT token signature against the JWKS endpoint,
    checking expiration, issuer, and audience.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    token = credentials.credentials
    try:
        jwk_client = get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.AUTH0_API_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/"
        )

        return TokenPayload(
            sub=payload.get("sub", "unknown"),
            email=payload.get("email", ""),
            scope=payload.get("scope", "")
        )
    except Exception as e:
        logger.error("Token verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
