import { defineModule } from '@/common/http/define-module';
import { progressController } from './progress.controller';
import { ProgressService } from './progress.service';

export const ProgressModule = defineModule({
  name: 'progress',
  controllers: [{ prefix: '/v1/progress', router: progressController }],
  providers: [ProgressService],
});
