import { Controller, Post, Body, Request, Get, Param, Patch, Delete, Res, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService, CreateBarberWithScheduleDto } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './entities/user.entity';
import { Public } from './decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Get('barberos')
  async findAllBarberos() {
    return this.authService.findAllBarberos();
  }

  @Roles(Role.ADMINISTRADOR)
  @Get('barberos-admin')
  async findAllBarberosAdmin() {
    return this.authService.findAllBarberosAdmin();
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Post('register-barber')
  async registerBarber(@Body() dto: CreateBarberWithScheduleDto) {
    return this.authService.registerBarberWithSchedule(dto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Post('register-barber-with-schedule')
  async registerBarberWithSchedule(@Body() createBarberWithScheduleDto: any) {
    return this.authService.registerBarberWithSchedule(createBarberWithScheduleDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const token = await this.authService.login(loginDto);

    // Guardamos el token en una cookie httpOnly
    res.cookie('jwt', token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true en producción con https
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60, // 1 hora
    });

    // 🎯 DEVOLVER TAMBIÉN LOS DATOS DEL USUARIO
    return res.json({
      message: 'Login exitoso',
      user: token.user // Asegúrate de que tu authService.login devuelva también el usuario
    });
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'Logout exitoso' };
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // este viene del validate() en JwtStrategy
  }

  // === RUTAS PARA GOOGLE OAUTH ===
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Passport redirige automáticamente
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const googleUser = req.user;
      const { accessToken, user } = await this.authService.loginWithGoogle(googleUser);

      // Guardamos el token en una cookie httpOnly (igual que en login normal)
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Cambiamos a lax para permitir la redirección desde Google
        maxAge: 1000 * 60 * 60, // 1 hora
      });

      // Redirigimos al frontend según el rol
      const redirectUrl = (user.Role === Role.ADMINISTRADOR || user.Role === Role.BARBERO)
        ? 'http://localhost:5173/dashboard'
        : 'http://localhost:5173';

      return res.redirect(redirectUrl);
    } catch (error) {
      // Si la cuenta está desactivada, el error vendrá con el mensaje de penalización
      const errorMessage = error.response?.message || error.message || 'Error de autenticación';
      return res.redirect(`http://localhost:5173/login?error=account_deactivated&message=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Roles(Role.ADMINISTRADOR, Role.SUPER_ADMINISTRADOR)
  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Roles(Role.ADMINISTRADOR, Role.SUPER_ADMINISTRADOR)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(+id);
  }

  @Roles(Role.ADMINISTRADOR, Role.SUPER_ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.authService.update(id, updateDto);
  }

  @Roles(Role.ADMINISTRADOR, Role.SUPER_ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }

}