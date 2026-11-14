import { defineModule } from '@/common/http/define-module';
import { mediaAdminController } from './media.admin.controller';
import { mediaPublicController } from './media.public.controller';
import { MediaService } from './media.service';

export const MediaModule = defineModule({
  name: 'media',
  controllers: [
    { prefix: '/admin/media', router: mediaAdminController },
    { prefix: '/v1/media', router: mediaPublicController },
  ],
  providers: [MediaService],
});
