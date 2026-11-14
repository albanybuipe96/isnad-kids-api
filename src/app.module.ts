import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { httpExceptionFilter } from '@/common/filters/http-exception.filter';
import type { ModuleDefinition } from '@/common/http/define-module';
import { containerMiddleware } from '@/common/middleware/container.middleware';
import type { AppEnv } from '@/common/types';
import { AuthModule } from '@/modules/auth/auth.module';
import { ContentModule } from '@/modules/content/content.module';
import { HealthModule } from '@/modules/health/health.module';
import { MediaModule } from '@/modules/media/media.module';
import { PacksModule } from '@/modules/packs/packs.module';
import { ProfilesModule } from '@/modules/profiles/profiles.module';
import { ProgressModule } from '@/modules/progress/progress.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';

/** Every feature module, like the `imports` of a NestJS AppModule. */
export const APP_MODULES: ModuleDefinition[] = [
  HealthModule,
  AuthModule,
  ProfilesModule,
  ProgressModule,
  MediaModule,
  ContentModule,
  ReviewsModule,
  PacksModule,
];

export function createApp() {
  const app = new OpenAPIHono<AppEnv>();

  // Global middleware
  app.use('*', logger());
  app.use('*', secureHeaders({ crossOriginResourcePolicy: false }));
  app.use('/admin/*', async (c, next) =>
    cors({ origin: c.env.ADMIN_ORIGIN, credentials: true, allowHeaders: ['content-type', 'cf-access-jwt-assertion'] })(
      c,
      next,
    ),
  );
  app.use('*', containerMiddleware);

  // Feature modules
  for (const module of APP_MODULES) {
    for (const controller of module.controllers) {
      app.route(controller.prefix, controller.router);
    }
  }

  // OpenAPI spec (used to generate the Dart client) and interactive docs
  app.openAPIRegistry.registerComponent('securitySchemes', 'ParentBearer', {
    type: 'http',
    scheme: 'bearer',
    description: 'Session token from POST /v1/auth/sign-in/email (the `set-auth-token` response header)',
  });
  app.openAPIRegistry.registerComponent('securitySchemes', 'CloudflareAccess', {
    type: 'apiKey',
    in: 'header',
    name: 'Cf-Access-Jwt-Assertion',
    description: 'Added automatically by Cloudflare Access in front of the admin portal',
  });
  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Isnād Kids API',
      version: '0.1.0',
      description:
        'Parent accounts, child profiles, progress sync, content packs, and the admin content workflow. ' +
        'Parent auth endpoints live under /v1/auth (Better Auth).',
    },
  });
  app.get('/docs', swaggerUI({ url: '/openapi.json' }));

  app.notFound((c) => c.json({ statusCode: 404, error: 'Not Found', message: 'Route not found' }, 404));
  app.onError(httpExceptionFilter);

  return app;
}
