import { defineModule } from '@/common/http/define-module';
import { reviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

export const ReviewsModule = defineModule({
  name: 'reviews',
  controllers: [{ prefix: '/admin/reviews', router: reviewsController }],
  providers: [ReviewsService],
});
