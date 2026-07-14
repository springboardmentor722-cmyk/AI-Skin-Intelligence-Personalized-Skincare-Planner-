"""Production-readiness audit finding: the browser calls this API directly
(`NEXT_PUBLIC_API_URL`, not proxied through Next.js — `web/lib/api.ts`), so
`web/next.config.ts`'s security headers only ever covered the frontend's own HTML/
static responses, never this API's. Same three headers, same values, for
consistency — no `Permissions-Policy` here (that header governs which *browser
features* a document may use; it's meaningless on a JSON API response with no
document context).
"""

from starlette.types import ASGIApp, Message, Receive, Scope, Send

_HEADERS: list[tuple[bytes, bytes]] = [
    (b"x-content-type-options", b"nosniff"),
    (b"x-frame-options", b"DENY"),
    (b"referrer-policy", b"strict-origin-when-cross-origin"),
]


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                message["headers"] = list(message.get("headers", [])) + _HEADERS
            await send(message)

        await self.app(scope, receive, send_with_headers)
