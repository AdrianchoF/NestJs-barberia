import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
   constructor(private readonly configService: ConfigService,
     private readonly authService: AuthService
   ) {
    
    // 1. Obten la clave secreta
    const secret = configService.get<string>('JWT_SECRET');

    // 2. Valida que exista. Si no, lanza un error.
    if (!secret) {
      throw new Error('JWT secret key is not defined in the configuration. Make sure to set the "hola" environment variable.');
    }

    // 3. Ahora TypeScript sabe que 'secret' es un string
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // <-- Aquí ya no hay error
    });

    
  }
  

  async validate(payload: any) {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email };
  }
}