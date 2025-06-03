import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    // Read package.json
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    // Get git info
    const getGitInfo = () => {
      try {
        const commitHash = execSync('git rev-parse HEAD').toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
        const commitDate = execSync('git log -1 --format=%cd').toString().trim();
        
        return {
          commitHash,
          branch,
          commitMessage,
          commitDate,
          lastUpdated: new Date().toISOString()
        };
      } catch (e) {
        return { error: 'Git info not available' };
      }
    };

    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      buildTime: new Date().toISOString(),
      node: process.version,
      ...getGitInfo()
    };

    return new Response(JSON.stringify(versionInfo, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting version info:', error);
    return new Response(JSON.stringify({ error: 'Failed to get version info' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
