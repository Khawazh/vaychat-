import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'http://82.147.67.216:4000';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = ${API_BASE}/api;
  const res = await fetch(url, { headers: request.headers });
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = ${API_BASE}/api;
  const body = await request.text();
  const res = await fetch(url, {
    method: 'POST',
    headers: request.headers,
    body,
  });
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function PUT(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = ${API_BASE}/api;
  const body = await request.text();
  const res = await fetch(url, {
    method: 'PUT',
    headers: request.headers,
    body,
  });
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function PATCH(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = ${API_BASE}/api;
  const body = await request.text();
  const res = await fetch(url, {
    method: 'PATCH',
    headers: request.headers,
    body,
  });
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}

export async function DELETE(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = ${API_BASE}/api;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: request.headers,
  });
  return new NextResponse(res.body, { status: res.status, headers: res.headers });
}