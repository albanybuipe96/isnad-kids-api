import { defineModule } from '@/common/http/define-module';
import { packsAdminController } from './packs.admin.controller';
import { packsPublicController } from './packs.public.controller';
import { PacksService } from './packs.service';

export const PacksModule = defineModule({
  name: 'packs',
  controllers: [
    { prefix: '/admin/packs', router: packsAdminController },
    { prefix: '/v1/packs', router: packsPublicController },
  ],
  providers: [PacksService],
});
