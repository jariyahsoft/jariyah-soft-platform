const baseUrl = process.env.DEPLOY_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;

if (!baseUrl) {
  console.error('DEPLOY_BASE_URL or NEXT_PUBLIC_BASE_URL is required');
  process.exit(1);
}

async function fetchWithSummary(pathname) {
  const target = new URL(pathname, baseUrl).toString();
  const startedAt = Date.now();
  const response = await fetch(target, {
    headers: {
      'cache-control': 'no-cache',
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return {
    target,
    status: response.status,
    durationMs: Date.now() - startedAt,
    body,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`Running post-deploy checks against ${baseUrl}`);

  const homepage = await fetchWithSummary('/');
  assert(
    homepage.status >= 200 && homepage.status < 400,
    `Homepage failed with status ${homepage.status}`,
  );

  const health = await fetchWithSummary('/api/health');
  assert(health.status === 200, `Health endpoint failed with status ${health.status}`);

  const services = health.body?.data?.services;
  assert(health.body?.data?.status === 'ok', 'Health endpoint returned degraded status');
  assert(services?.firestore?.ok === true, 'Firestore connectivity check failed');
  assert(services?.typesense?.ok === true, 'Typesense connectivity check failed');

  console.log('Post-deploy verification summary');
  console.log(
    JSON.stringify(
      {
        homepage: {
          target: homepage.target,
          status: homepage.status,
          durationMs: homepage.durationMs,
        },
        health: {
          target: health.target,
          status: health.status,
          durationMs: health.durationMs,
          services,
        },
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error('Post-deploy verification failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
