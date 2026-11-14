import { defineModule } from '@/common/http/define-module';
import { authController } from './auth.controller';
import { AUTH_BASE_PATH, AuthService } from './auth.service';

export const AuthModule = defineModule({
  name: 'auth',
  controllers: [{ prefix: AUTH_BASE_PATH, router: authController }],
  providers: [AuthService],
});
