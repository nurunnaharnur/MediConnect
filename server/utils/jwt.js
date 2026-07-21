import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'

if (!JWT_SECRET) {
    // Fails loudly at startup instead of silently signing tokens with "undefined"
    throw new Error('JWT_SECRET is missing. Add it to your .env file.')
}

// payload should be small, non-sensitive data - e.g. { id, name, email }
// Never put the password in here.
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Throws if the token is missing, expired, or was signed with a different secret.
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET)
}