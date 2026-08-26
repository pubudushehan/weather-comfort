from pydantic import BaseModel, Field

class TokenPayload(BaseModel):
    sub: str = Field(..., description="Auth0 User ID")
    email: str = Field(..., description="Email address associated with the user")
    scope: str = Field("", description="Token scopes")
