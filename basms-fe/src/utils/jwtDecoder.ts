// src/utils/jwtDecoder.ts
export interface JWTPayload {
    sub?: string;
    iat?: number;
    exp?: number;
    [key: string]: unknown;
}

export class JWTDecoder {
    static decode(token: string | null): JWTPayload | null {
        if (!token || token.trim() === '') {
            return null;
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const base64Url = parts[1];
            if (!base64Url) {
                return null;
            }

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload) as JWTPayload;
            return payload;
        } catch {
            return null;
        }
    }

    static isTokenExpired(token: string | null): boolean {
        if (!token || token.trim() === '') {
            return true;
        }

        const payload = this.decode(token);
        if (!payload || typeof payload.exp !== 'number') {
            return true;
        }

        const now = Date.now();
        const expTime = payload.exp * 1000;

        return expTime <= now;
    }

    static getTokenInfo(token: string | null): JWTPayload | null {
        return this.decode(token);
    }
}
