import { defineModule } from '@/common/http/define-module';
import { profilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

export const ProfilesModule = defineModule({
  name: 'profiles',
  controllers: [{ prefix: '/v1/children', router: profilesController }],
  providers: [ProfilesService],
});
