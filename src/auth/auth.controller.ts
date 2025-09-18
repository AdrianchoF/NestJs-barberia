import { Controller, Post, Body, Request, Get, Param, Patch, Delete, Res, ParseIntPipe } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Role } from './entities/user.entity';
//import { CreateUserDto } from './dto/create-user.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-barber')
  async registerBarber(@Body() registerDto: RegisterDto) {
    // fuerza role barbero
    registerDto.role = Role.BARBERO;
    return this.authService.register(registerDto);
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

  /* @Post('User')
  create(@Body() CreateUserDto: CreateUserDto) {
    return this.authService.create(CreateUserDto);
  } */

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(+id);
  }

  /* @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.authService.update(+id, updateClienteDto);
  } */  

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
  
}