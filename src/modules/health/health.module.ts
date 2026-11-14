import { defineModule } from '@/common/http/define-module';
import { healthController } from './health.controller';

export const HealthModule = defineModule({
  name: 'health',
  controllers: [{ prefix: '/health', router: healthController }],
});
