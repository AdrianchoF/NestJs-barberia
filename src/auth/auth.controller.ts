import { Controller, Post, Body, Request, Get, Param, Patch, Delete, Res, ParseIntPipe, Req } from '@nestjs/common';
import { Response } from 'express';
import { AuthService, CreateBarberWithScheduleDto } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Role } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-barber')
  async registerBarber(@Body() dto: CreateBarberWithScheduleDto) {
    return this.authService.registerBarberWithSchedule(dto);
  }

  @Post('register-barber-with-schedule')
  async registerBarberWithSchedule(@Body() createBarberWithScheduleDto: any) {
    return this.authService.registerBarberWithSchedule(createBarberWithScheduleDto);
  }

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

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'Logout exitoso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // este viene del validate() en JwtStrategy
  }

  // === RUTAS PARA GOOGLE OAUTH ===
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Passport redirige automáticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const googleUser = req.user;
    const { accessToken } = await this.authService.loginWithGoogle(googleUser);

    // Guardamos el token en una cookie httpOnly (igual que en login normal)
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Cambiamos a lax para permitir la redirección desde Google
      maxAge: 1000 * 60 * 60, // 1 hora
    });

    // Redirigimos al frontend
    // Generalmente http://localhost:5173 en desarrollo de Vue
    return res.redirect('http://localhost:5173');
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.authService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }

}