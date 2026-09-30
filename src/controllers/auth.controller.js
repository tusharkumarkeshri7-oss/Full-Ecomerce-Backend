import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AuthController {
  static register = asyncHandler(async (req, res) => {
    const { user, tokens } = await AuthService.register(req.body);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.created(
        {
          user,
          tokens
        },
        'User registered successfully'
      )
    );
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, tokens } = await AuthService.login({ email, password });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(
        {
          user,
          tokens
        },
        'Login successful'
      )
    );
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const rawRefreshToken = req.body.refreshToken || req.cookies.refreshToken;
    const { user, tokens } = await AuthService.refreshToken(rawRefreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(
        {
          user,
          tokens
        },
        'Tokens refreshed successfully'
      )
    );
  });

  static logout = asyncHandler(async (req, res) => {
    if (req.user) {
      await AuthService.logout(req.user._id);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, 'Logged out successfully'));
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const result = await AuthService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(result, result.message));
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const { user, tokens } = await AuthService.resetPassword({ token, password });

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(
        {
          user,
          tokens
        },
        'Password has been reset successfully'
      )
    );
  });
}
