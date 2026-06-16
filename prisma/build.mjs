import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config({ path: '.env' });

execSync('npm run build', { stdio: 'inherit' });