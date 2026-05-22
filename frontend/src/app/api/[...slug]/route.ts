import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'http://82.147.67.216:4000';

async function proxy(request: NextRequest, method: string, body: string | null) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = API_BASE + '/api' + path + request.nextUrl.search;
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  const init: RequestInit = { method, headers };
  if (body) init.body = body;
  const res = await fetch(url, init);
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function GET(request: NextRequest) {
  return proxy(request, 'GET', null);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxy(request, 'POST', body);
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxy(request, 'PUT', body);
}

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxy(request, 'PATCH', body);
}

export async function DELETE(request: NextRequest) {
  return proxy(request, 'DELETE', null);
}