import { config } from 'dotenv';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

config({ path: path.join(PROJECT_ROOT, '.env') });
config({ path: path.join(PROJECT_ROOT, '.env.local'), override: true });
