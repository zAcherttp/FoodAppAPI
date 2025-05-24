"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSessions = exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.logout = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = __importDefault(require("../config/supabase"));
const emailService_1 = __importDefault(require("../utils/emailService"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
}
const signToken = (id, sessionId) => {
    return jsonwebtoken_1.default.sign({ id, sessionId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    });
};
const createSession = (userId, req) => __awaiter(void 0, void 0, void 0, function* () {
    const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN || '90');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    // Create session record
    const { data, error } = yield supabase_1.default
        .from('sessions')
        .insert([
        {
            user_id: userId,
            user_agent: req.headers['user-agent'] || 'unknown',
            ip_address: req.ip || req.socket.remoteAddress,
            expires_at: expiresAt.toISOString(),
            is_valid: true
        }
    ])
        .select();
    if (error || !data || data.length === 0) {
        console.error('Error creating session:', error);
        throw new Error('Could not create session');
    }
    return data[0];
});
// Helper function to create and send token
const createSendToken = (user, req, statusCode, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create a session
        const session = yield createSession(user.id, req);
        // Create token including the session ID
        const token = signToken(user.id, session.id);
        // Update the session with the token
        yield supabase_1.default
            .from('sessions')
            .update({ token })
            .eq('id', session.id);
        // Remove password from output
        delete user.password;
        res.status(statusCode).json({
            status: 'success',
            token,
            data: {
                user,
                session: { id: session.id },
            },
        });
    }
    catch (err) {
        console.error('Error in createSendToken:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error creating authentication token',
        });
    }
});
// Register user
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Check if user already exists
        const { data: existingUser } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (existingUser) {
            res.status(400).json({
                status: 'fail',
                message: 'Email already in use',
            });
            return;
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        // Create user in Supabase
        const { data: newUser, error } = yield supabase_1.default
            .from('users')
            .insert([
            {
                name,
                email,
                password: hashedPassword,
            },
        ])
            .select();
        if (error || !newUser || newUser.length === 0) {
            res.status(400).json({
                status: 'fail',
                message: (error === null || error === void 0 ? void 0 : error.message) || 'Error creating user',
            });
            return;
        }
        // Remove password from output
        delete newUser[0].password;
        // Return success but don't create a session
        res.status(201).json({
            status: 'success',
            data: {
                user: newUser[0],
            },
            message: 'User created successfully. Please log in.'
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Error creating user',
        });
    }
});
exports.signup = signup;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Check if email and password exist
        if (!email || !password) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password',
            });
            return;
        }
        // Check if user exists && password is correct
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !user || !(yield bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password',
            });
            return;
        }
        // Check for existing active sessions
        const { data: existingSessions } = yield supabase_1.default
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_valid', true);
        // Invalidate all existing sessions - ensure only one active session
        if (existingSessions && existingSessions.length > 0) {
            const currentIP = req.ip || req.socket.remoteAddress;
            const currentUserAgent = req.headers['user-agent'] || 'unknown';
            // Option to reuse session if from same device/location
            const sameDeviceSession = existingSessions.find(session => session.ip_address === currentIP &&
                session.user_agent === currentUserAgent);
            if (sameDeviceSession) {
                // If session is from same device but has expired, invalidate it
                const now = new Date();
                const expiresAt = new Date(sameDeviceSession.expires_at);
                if (expiresAt > now) {
                    // Session is still valid, reuse it
                    const token = signToken(user.id, sameDeviceSession.id);
                    // Update the session with new token
                    yield supabase_1.default
                        .from('sessions')
                        .update({ token })
                        .eq('id', sameDeviceSession.id);
                    // Remove password from output
                    delete user.password;
                    res.status(200).json({
                        status: 'success',
                        token,
                        sessionId: sameDeviceSession.id, // Include session ID in response
                        data: {
                            user,
                            message: 'Using existing session from same device'
                        },
                    });
                    return;
                }
            }
            // Invalidate all existing sessions for this user
            yield supabase_1.default
                .from('sessions')
                .update({ is_valid: false })
                .eq('user_id', user.id);
        }
        // Create new session and send token
        yield createSendToken(user, req, 200, res);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Error logging in',
        });
    }
});
exports.login = login;
// Logout 
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get token
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in.',
            });
            return;
        }
        // Find and invalidate the session
        const { error } = yield supabase_1.default
            .from('sessions')
            .update({ is_valid: false })
            .eq('token', token);
        if (error) {
            console.error('Error invalidating session:', error);
            res.status(500).json({
                status: 'error',
                message: 'Could not log out. Please try again.',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    }
    catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during logout',
        });
    }
});
exports.logout = logout;
// Forgot password
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // 1) Get user based on POSTed email
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !user) {
            res.status(404).json({
                status: 'fail',
                message: 'There is no user with that email address',
            });
            return;
        }
        // 2) Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash the OTP before storing in database
        const hashedOtp = crypto_1.default
            .createHash('sha256')
            .update(otp)
            .digest('hex');
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
        // 3) Save to database
        const { error: updateError } = yield supabase_1.default
            .from('users')
            .update({
            password_reset_token: hashedOtp,
            password_reset_expires: otpExpires,
        })
            .eq('id', user.id);
        if (updateError) {
            res.status(500).json({
                status: 'fail',
                message: 'Error generating OTP',
            });
            return;
        }
        // 4) Send email
        try {
            const emailData = {
                email: user.email,
                subject: 'Your password reset OTP (valid for 10 min)',
                html: `
          <h2>Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `,
            };
            yield (0, emailService_1.default)(emailData);
            res.status(200).json({
                status: 'success',
                message: 'Token sent to email!',
            });
        }
        catch (err) {
            // If error sending email, remove token from db
            yield supabase_1.default
                .from('users')
                .update({
                password_reset_token: null,
                password_reset_expires: null,
            })
                .eq('id', user.id);
            res.status(500).json({
                status: 'error',
                message: 'There was an error sending the email. Try again later!',
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Error processing request',
        });
    }
});
exports.forgotPassword = forgotPassword;
// verify OTP
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide email and OTP',
            });
            return;
        }
        // 1) Hash the provided OTP
        const hashedOtp = crypto_1.default.createHash('sha256').update(otp).digest('hex');
        // 2) Get user based on email and check OTP
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password_reset_token', hashedOtp)
            .gt('password_reset_expires', new Date().toISOString())
            .single();
        // 3) If OTP has not expired and is valid, return success
        if (error || !user) {
            res.status(400).json({
                status: 'fail',
                message: 'Invalid OTP or OTP has expired',
            });
            return;
        }
        // OTP is valid
        res.status(200).json({
            status: 'success',
            message: 'OTP verified successfully',
            isValid: true
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Error verifying OTP',
        });
    }
});
exports.verifyOtp = verifyOtp;
// Reset password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, confirmPassword } = req.body;
        if (!email || !password || !confirmPassword) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide email, password, and password confirmation',
            });
            return;
        }
        // Check if password and confirmPassword match
        if (password !== confirmPassword) {
            res.status(400).json({
                status: 'fail',
                message: 'Passwords do not match',
            });
            return;
        }
        // Get user based on email and check if they have an active reset token
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('email', email)
            .not('password_reset_token', 'is', null)
            .gt('password_reset_expires', new Date().toISOString())
            .single();
        // 3) If reset token has not expired and is valid, set the new password
        if (error || !user) {
            res.status(400).json({
                status: 'fail',
                message: 'Invalid reset session or session has expired. Please verify OTP again.',
            });
            return;
        }
        // 4) Update password
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        const { error: updateError } = yield supabase_1.default
            .from('users')
            .update({
            password: hashedPassword,
            password_reset_token: null,
            password_reset_expires: null,
        })
            .eq('id', user.id);
        if (updateError) {
            res.status(500).json({
                status: 'error',
                message: 'Error updating password',
            });
            return;
        }
        // 5) Log the user in, send JWT
        yield createSendToken(user, req, 200, res);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Error resetting password',
        });
    }
});
exports.resetPassword = resetPassword;
// Get all active sessions for current user
const getUserSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({
                status: 'fail',
                message: 'Not authenticated',
            });
            return;
        }
        const { data: sessions, error } = yield supabase_1.default
            .from('sessions')
            .select('id, user_agent, ip_address, created_at, expires_at')
            .eq('user_id', req.user.id)
            .eq('is_valid', true)
            .order('created_at', { ascending: false });
        if (error) {
            res.status(500).json({
                status: 'error',
                message: 'Could not retrieve sessions',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                sessions,
                current_session_id: (_b = req.session) === null || _b === void 0 ? void 0 : _b.id
            },
        });
    }
    catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching sessions',
        });
    }
});
exports.getUserSessions = getUserSessions;
