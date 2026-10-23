import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { RegisterService } from '../services/register.service';
import { SessionService } from '../services/session.service';
import { AuthTokenService } from '../services/auth-token.service';
import { PublicRoute } from '../../../common/decorators/public-route.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/auth.dto';
import { UnauthorizedError } from '../../../../../../libs/platform/errors/domain.error';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly sessionService: SessionService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  private getCookieName(req: Request): string {
    const isSecure = req.secure || process.env.NODE_ENV === 'production';
    return isSecure ? '__Host-recruitment_session' : 'recruitment_session';
  }

  private extractSessionToken(req: Request): string | undefined {
    if (req.cookies) {
      if (req.cookies['__Host-recruitment_session']) {
        return req.cookies['__Host-recruitment_session'];
      }
      if (req.cookies['recruitment_session']) {
        return req.cookies['recruitment_session'];
      }
    }
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return undefined;
  }

  @PublicRoute()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerService.register(dto, ip);
    if (result.duplicate) {
      res.status(HttpStatus.ACCEPTED);
      return { message: 'Registration accepted' };
    }
    res.status(HttpStatus.CREATED);
    return result.user;
  }

  @PublicRoute()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, sessionToken } = await this.sessionService.login(dto, ip);

    const isSecure = req.secure || process.env.NODE_ENV === 'production';
    const cookieName = this.getCookieName(req);

    res.cookie(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((r) => r.role),
      status: user.status,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionToken = this.extractSessionToken(req);
    if (sessionToken) {
      await this.sessionService.logout(sessionToken);
    }
    const isSecure = req.secure || process.env.NODE_ENV === 'production';
    const cookieName = this.getCookieName(req);
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const sessionToken = this.extractSessionToken(req);
    if (!sessionToken) {
      throw new UnauthorizedError('Session cookie required');
    }
    return this.sessionService.getSessionInfo(sessionToken);
  }

  @PublicRoute()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authTokenService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  @PublicRoute()
  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@Body() dto: ResendVerificationDto, @Ip() ip: string) {
    await this.authTokenService.resendVerification(dto.email, ip);
    return { message: 'Verification email resent if account exists' };
  }

  @PublicRoute()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    await this.authTokenService.forgotPassword(dto.email, ip);
    return { message: 'Password reset link sent if account exists' };
  }

  @PublicRoute()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authTokenService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully' };
  }
}
