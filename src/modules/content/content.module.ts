import { defineModule } from '@/common/http/define-module';
import { contentController } from './content.controller';
import { ContentService } from './content.service';

export const ContentModule = defineModule({
  name: 'content',
  controllers: [{ prefix: '/admin/content', router: contentController }],
  providers: [ContentService],
});
