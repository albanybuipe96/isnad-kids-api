/**
 * Writes openapi.json without starting the Worker. Use it to generate the Flutter (Dart) client:
 *   npm run openapi:export
 *   npx @openapitools/openapi-generator-cli generate -i openapi.json -g dart-dio -o ../isnad_kids_api_client
 */
import { writeFileSync } from 'node:fs';
import { createApp } from '../src/app.module';

const app = createApp();
const response = await app.request('/openapi.json', {}, {
  ADMIN_ORIGIN: 'http://localhost',
} as never);
const spec = await response.json();
writeFileSync('openapi.json', `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote openapi.json (${Object.keys((spec as { paths: object }).paths).length} paths)`);
