import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/ai/chat/route';

async function testRoute() {
  console.log('--- Testing /api/ai/chat POST handler ---');

  // Test 1: Valid query
  const req1 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What is my attendance?' }],
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Test 1 (Valid query):', res1.status, data1.success, !!data1.message?.content, data1.toolCalls?.length);

  // Test 2: Invalid JSON
  const req2 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: 'invalid-json-{',
    headers: { 'Content-Type': 'application/json' },
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log('Test 2 (Invalid JSON):', res2.status, data2.success, data2.error);

  // Test 3: Missing messages
  const req3 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });
  const res3 = await POST(req3);
  const data3 = await res3.json();
  console.log('Test 3 (Missing messages):', res3.status, data3.success, data3.error);

  // Test 4: Empty messages array
  const req4 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [] }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res4 = await POST(req4);
  const data4 = await res4.json();
  console.log('Test 4 (Empty messages):', res4.status, data4.success, data4.error);

  // Test 5: Last message content not string
  const req5 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 12345 }] }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res5 = await POST(req5);
  const data5 = await res5.json();
  console.log('Test 5 (Non-string content):', res5.status, data5.success, data5.error);

  // Test 6: Invalid session token (falls back gracefully)
  const req6 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Show my fee' }],
      sessionId: 'corrupted-invalid-session-token-12345',
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res6 = await POST(req6);
  const data6 = await res6.json();
  console.log('Test 6 (Corrupted session token):', res6.status, data6.success, !!data6.message?.content, data6.toolCalls?.length);

  // Test 7: Session via x-session-id header
  const req7 = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Show timetable' }],
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': 'b64.eyJ1c2VybmFtZSI6ImRlbW8ifQ==',
    },
  });
  const res7 = await POST(req7);
  const data7 = await res7.json();
  console.log('Test 7 (x-session-id header):', res7.status, data7.success, !!data7.message?.content);
}

testRoute();
