import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import {
  NetworkUnavailableError,
  VercelInvalidTokenError,
  VercelInvalidProjectNameError,
} from '../entities';

type FileEntry = {
  file: string; // posix-style relative path in the deployment
  sha: string;
  size: number;
  absPath: string; // local absolute path (not sent to Vercel)
};

type HttpJsonResponse = {
  ok: boolean;
  status: number;
  body: unknown;
  raw?: Response;
  error?: string;
};

type HttpBinaryResponse = {
  ok: boolean;
  status: number;
  error?: string;
  raw?: Response;
};

const API_BASE = 'https://api.vercel.com';

/**
 * Recursively walk a directory and return all file paths (absolute) and their POSIX-style relative paths.
 */
function collectFiles(rootDir: string): FileEntry[] {
  const results: FileEntry[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        const rel = path.relative(rootDir, abs).split(path.sep).join('/');
        const buf = fs.readFileSync(abs);
        const sha = createHash('sha1').update(buf).digest('hex');
        results.push({ file: rel, sha, size: buf.length, absPath: abs });
      }
    }
  }

  walk(rootDir);
  return results;
}

async function httpJson(
  url: string,
  init: RequestInit,
): Promise<HttpJsonResponse> {
  return new Promise<HttpJsonResponse>((resolve) => {
    fetch(url, init)
      .then(async (res: Response) => {
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          // non-JSON body, try text
          try {
            body = await res.text();
          } catch {
            body = null;
          }
        }
        resolve({
          ok: res.ok,
          status: res.status,
          body,
          raw: res,
        });
      })
      .catch((error: Error) => {
        resolve({
          ok: false,
          status: 0,
          body: null,
          error: error.message,
        });
      });
  });
}

async function httpBinary(
  url: string,
  init: RequestInit,
): Promise<HttpBinaryResponse> {
  return new Promise<HttpBinaryResponse>((resolve) => {
    fetch(url, init)
      .then((res: Response) => {
        resolve({
          ok: res.ok,
          status: res.status,
          raw: res,
        });
      })
      .catch((error: Error) => {
        resolve({
          ok: false,
          status: 0,
          error: error.message,
        });
      });
  });
}

async function uploadMissingFiles(
  token: string,
  filesBySha: Map<string, FileEntry>,
  missing: string[],
): Promise<void> {
  for (const sha of missing) {
    const entry = filesBySha.get(sha);
    if (!entry) continue; // skip unknown
    const data = fs.readFileSync(entry.absPath);
    const response = await httpBinary(`${API_BASE}/v2/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-vercel-digest': sha,
        'Content-Type': 'application/octet-stream',
      },
      body: data,
    });

    if (response.error) {
      throw new NetworkUnavailableError(
        `Network error during file upload: ${response.error}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new VercelInvalidTokenError('Invalid token during file upload');
    }

    if (!response.ok && response.status !== 409) {
      // 409 means file already exists on Vercel
      const text = await response.raw?.text();
      throw new Error(
        `Failed to upload file (sha: ${sha}) to Vercel: ${response.status} ${text}`,
      );
    }
  }
}

type CreateDeploymentResponse = {
  id: string;
  url?: string;
  readyState?: string;
  error?: { code?: string; missing?: string[]; message?: string };
  missing?: string[];
};

async function createDeployment(
  token: string,
  projectName: string,
  files: FileEntry[],
): Promise<CreateDeploymentResponse> {
  const payload = {
    name: projectName,
    target: 'production',
    files: files.map((f) => ({ file: f.file, sha: f.sha, size: f.size })),
    // Mark as an output-only static deployment
    projectSettings: { framework: null },
  };

  const response = await httpJson(`${API_BASE}/v13/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = response.body as Partial<CreateDeploymentResponse> | undefined;

  if (!response.ok) {
    if (response.status === 400) {
      // If API replies with missing files (varies across versions), extract them
      if (
        (body?.error?.code === 'missing_files' &&
          Array.isArray(body?.error?.missing)) ||
        Array.isArray(body?.error?.missing)
      ) {
        return {
          id: String(body?.id),
          missing: body?.error?.missing,
        } as CreateDeploymentResponse;
      }

      if (body?.error?.code === 'invalid_project_name') {
        throw new VercelInvalidProjectNameError(
          body?.error?.message || 'Invalid project name',
        );
      }
    }

    if (response.status === 401 || response.status === 403) {
      throw new VercelInvalidTokenError(
        body?.error?.message || 'Invalid or expired token',
      );
    }

    if (response.error) {
      throw new NetworkUnavailableError(
        `Network error during deployment creation: ${response.error}`,
      );
    }

    throw new Error(
      `Vercel deployment failed: ${body?.error?.message || `HTTP ${response.status}`}`,
    );
  }

  return {
    id: String(body?.id),
    url: body?.url,
    readyState: body?.readyState,
  } as CreateDeploymentResponse;
}

async function pollDeploymentReady(
  token: string,
  id: string,
  timeoutMs = 120_000,
): Promise<{ url?: string; readyState?: string }> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await httpJson(`${API_BASE}/v13/deployments/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.error) {
      throw new NetworkUnavailableError(
        `Network error during polling: ${response.error}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      const errorBody = response.body as { error?: { message?: string } };
      const message =
        errorBody?.error?.message || 'Invalid or expired token during polling';
      throw new VercelInvalidTokenError(message);
    }
    const b = response.body as {
      url?: string;
      readyState?: string;
      error?: { message?: string };
    } | null;
    const state = b?.readyState;
    if (state === 'READY') return { url: b?.url, readyState: state };
    if (state === 'ERROR' || state === 'CANCELED') {
      const err = b?.error?.message || JSON.stringify(b);
      throw new Error(`Vercel deployment failed: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return {};
}

/**
 * Deploy a static folder to Vercel (production) using the REST API, returning the deployment URL.
 * Keeps the current DTO contract: token + projectName -> URL.
 */
export async function deployToVercelViaApi(
  token: string,
  projectName: string,
  outDirPath: string,
): Promise<string> {
  const files = collectFiles(outDirPath);
  const bySha = new Map(files.map((f) => [f.sha, f] as const));

  // 1) Create deployment (may return missing files)
  let resp = await createDeployment(token, projectName, files);

  // 2) If missing files, upload them and retry create
  if (resp.missing?.length) {
    await uploadMissingFiles(token, bySha, resp.missing);
    resp = await createDeployment(token, projectName, files);
  }

  // 3) If not ready, poll until ready
  let url = resp.url;
  if (!url) {
    const polled = await pollDeploymentReady(token, resp.id);
    url = polled.url;
  }

  if (!url) return '';
  // Ensure https:// prefix
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}
