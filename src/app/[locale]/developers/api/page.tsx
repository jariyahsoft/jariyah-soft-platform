'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Check,
  ExternalLink,
  Key,
  Lock,
  Server,
  Zap,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

/** API Endpoint definition */
interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  auth: 'api_key' | 'bearer' | 'none';
  params?: { name: string; type: string; required: boolean; description: string }[];
  responseExample: string;
}

const API_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/software',
    summary: 'List published software',
    description: 'Returns a paginated list of all published software. Supports filtering by category, platform, and sort order.',
    auth: 'api_key',
    params: [
      { name: 'limit', type: 'number', required: false, description: 'Max items per page (default: 20, max: 100)' },
      { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor from previous response' },
      { name: 'category', type: 'string', required: false, description: 'Filter by category ID' },
      { name: 'platform', type: 'string', required: false, description: 'Filter by platform (windows, mac, web, mobile, linux)' },
      { name: 'sort', type: 'string', required: false, description: 'Sort order: recency, popularity, relevance' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "abc123",
      "name": "TaskFlow Pro",
      "slug": "taskflow-pro",
      "shortDescription": "Premium task management...",
      "categoryName": "Productivity",
      "platforms": ["windows", "mac", "web"],
      "ratingAverage": 4.6,
      "downloadCount": 12500,
      "certifications": ["verified", "open_source_verified"]
    }
  ],
  "meta": {
    "requestId": "req_a1b2c3d4...",
    "nextCursor": "def456"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/software/:id',
    summary: 'Get software details',
    description: 'Returns full details for a single software item by its document ID.',
    auth: 'api_key',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Software document ID (path parameter)' },
    ],
    responseExample: `{
  "data": {
    "id": "abc123",
    "name": "TaskFlow Pro",
    "description": "Full markdown description...",
    "platforms": ["windows", "mac"],
    "certifications": ["verified"],
    "ratingAverage": 4.6,
    "ratingCount": 234,
    "downloadCount": 12500
  },
  "meta": { "requestId": "req_..." }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/articles',
    summary: 'List published articles',
    description: 'Returns a paginated list of published articles.',
    auth: 'api_key',
    params: [
      { name: 'limit', type: 'number', required: false, description: 'Max items per page (default: 20)' },
      { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "art_123",
      "title": "Getting Started with React",
      "slug": "getting-started-react",
      "authorName": "Somchai Dev",
      "publishedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": { "requestId": "req_...", "nextCursor": null }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/developers/:id',
    summary: 'Get developer profile',
    description: 'Returns the public developer profile including reputation score and badges.',
    auth: 'api_key',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Developer UID (path parameter)' },
    ],
    responseExample: `{
  "data": {
    "displayName": "Somchai Dev",
    "slug": "somchai-dev",
    "reputationScore": 1250,
    "verificationStatus": "verified",
    "badges": ["first_software", "top_developer"]
  },
  "meta": { "requestId": "req_..." }
}`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function CodeSnippet({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-md bg-text-secondary/10 p-1.5 text-text-secondary hover:bg-text-secondary/20 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-bg-secondary/80 p-4 text-xs leading-6 text-text-primary">
        <code>{code}</code>
      </pre>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-text-secondary">{language}</div>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const [snippetTab, setSnippetTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  const snippets = {
    curl: `curl -X ${endpoint.method} \\
  "https://jariyahsoft.com${endpoint.path}" \\
  -H "X-API-Key: js_live_your_key_here"`,
    javascript: `const response = await fetch("https://jariyahsoft.com${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "X-API-Key": "js_live_your_key_here",
  },
});
const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "https://jariyahsoft.com${endpoint.path}",
    headers={"X-API-Key": "js_live_your_key_here"}
)
data = response.json()
print(data)`,
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-text-secondary/5 transition-colors"
      >
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="flex-1 text-sm font-semibold text-text-primary">{endpoint.path}</code>
        <span className="text-sm text-text-secondary">{endpoint.summary}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        )}
      </button>

      {expanded && (
        <CardContent className="space-y-5 border-t border-text-secondary/10 px-6 py-5">
          <p className="text-sm text-text-secondary">{endpoint.description}</p>

          {/* Auth */}
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">Auth:</span>
            <Badge variant={endpoint.auth === 'api_key' ? 'info' : 'default'} size="sm">
              {endpoint.auth === 'api_key' ? 'X-API-Key' : endpoint.auth}
            </Badge>
          </div>

          {/* Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Parameters</h4>
              <div className="overflow-x-auto rounded-lg border border-text-secondary/10">
                <table className="w-full text-xs">
                  <thead className="bg-text-secondary/5">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Required</th>
                      <th className="px-4 py-2 text-left font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-secondary/10">
                    {endpoint.params.map((param) => (
                      <tr key={param.name}>
                        <td className="px-4 py-2 font-mono text-accent">{param.name}</td>
                        <td className="px-4 py-2 text-text-secondary">{param.type}</td>
                        <td className="px-4 py-2">
                          {param.required ? (
                            <Badge variant="warning" size="sm">Required</Badge>
                          ) : (
                            <span className="text-text-secondary">Optional</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Code Snippets */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Code Examples</h4>
            <div className="mb-3 flex gap-1">
              {(['curl', 'javascript', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSnippetTab(lang)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    snippetTab === lang
                      ? 'bg-accent text-white'
                      : 'bg-text-secondary/10 text-text-secondary hover:bg-text-secondary/20'
                  }`}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : 'Python'}
                </button>
              ))}
            </div>
            <CodeSnippet language={snippetTab} code={snippets[snippetTab]} />
          </div>

          {/* Response Example */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Response Example</h4>
            <CodeSnippet language="json" code={endpoint.responseExample} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ApiDocsPage() {
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,120,255,0.16),transparent_34rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center">
          <Badge variant="info" size="md">
            <Zap className="mr-1 h-3 w-3" />
            {locale === 'th' ? 'สำหรับนักพัฒนา' : 'For Developers'}
          </Badge>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-text-primary">
            {locale === 'th' ? 'Jariyah Soft API' : 'Jariyah Soft API'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            {locale === 'th'
              ? 'เข้าถึงข้อมูลซอฟต์แวร์ บทความ และโปรไฟล์นักพัฒนาผ่าน REST API ที่ปลอดภัยด้วย API Key'
              : 'Access software listings, articles, and developer profiles through our secure REST API authenticated with API Keys.'}
          </p>
        </div>

        {/* Quick Start */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary">
                {locale === 'th' ? '1. สร้าง API Key' : '1. Get an API Key'}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ไปที่ Dashboard → API Keys เพื่อสร้าง key ใหม่'
                  : 'Go to Dashboard → API Keys to generate a new key.'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary">
                {locale === 'th' ? '2. ส่ง Request' : '2. Make a Request'}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ใส่ X-API-Key header ในทุก request'
                  : 'Include the X-API-Key header in every request.'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary">
                {locale === 'th' ? '3. อ่าน Response' : '3. Parse Response'}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ข้อมูลอยู่ใน data field พร้อม cursor สำหรับ pagination'
                  : 'Data is in the data field with cursor-based pagination.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {locale === 'th' ? 'การยืนยันตัวตน' : 'Authentication'}
            </CardTitle>
            <CardDescription>
              {locale === 'th'
                ? 'ทุก request ต้องมี API Key ใน header'
                : 'All requests must include your API Key in the header.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeSnippet
              language="http"
              code={`GET /api/v1/software HTTP/1.1
Host: jariyahsoft.com
X-API-Key: js_live_your_key_here`}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-text-secondary/10 p-4">
                <div className="text-xs font-semibold text-text-secondary">Free Tier</div>
                <div className="mt-1 text-2xl font-black text-text-primary">60</div>
                <div className="text-xs text-text-secondary">requests/minute</div>
              </div>
              <div className="rounded-xl border border-text-secondary/10 p-4">
                <div className="text-xs font-semibold text-text-secondary">Rate Limit Headers</div>
                <code className="mt-1 block text-xs text-accent">RateLimit-Remaining</code>
                <code className="block text-xs text-accent">RateLimit-Limit</code>
              </div>
              <div className="rounded-xl border border-text-secondary/10 p-4">
                <div className="text-xs font-semibold text-text-secondary">Key Format</div>
                <code className="mt-1 block text-xs text-accent">js_live_</code>
                <div className="text-xs text-text-secondary">+ 32 hex characters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div>
          <h2 className="mb-4 text-2xl font-black text-text-primary">
            <Code className="mr-2 inline h-6 w-6" />
            {locale === 'th' ? 'Endpoints' : 'Endpoints'}
          </h2>
          <div className="space-y-3">
            {API_ENDPOINTS.map((ep) => (
              <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
            ))}
          </div>
        </div>

        {/* OpenAPI Link */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="flex items-center gap-4 p-5">
            <BookOpen className="h-6 w-6 shrink-0 text-accent" />
            <div className="flex-1">
              <h3 className="font-bold text-text-primary">OpenAPI Specification</h3>
              <p className="text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ดาวน์โหลดไฟล์ OpenAPI 3.1 spec สำหรับเครื่องมือ auto-generation เช่น Swagger, Postman'
                  : 'Download the full OpenAPI 3.1 spec for tools like Swagger, Postman, and code generators.'}
              </p>
            </div>
            <a href="/docs/openapi.yaml" download>
              <Button variant="secondary">
                <ExternalLink className="mr-2 h-4 w-4" />
                openapi.yaml
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
