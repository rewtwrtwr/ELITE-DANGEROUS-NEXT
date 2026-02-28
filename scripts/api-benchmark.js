/**
 * API Performance Benchmark Script
 * 
 * Tests all critical API endpoints using autocannon
 * Reports latency percentiles and throughput
 */

import autocannon from 'autocannon';

const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { 
    url: '/health', 
    name: 'Health Check',
    connections: 10,
    duration: 30,
    targetP95: 50 
  },
  { 
    url: '/api/v1/status', 
    name: 'API Status',
    connections: 10,
    duration: 30,
    targetP95: 200 
  },
  { 
    url: '/api/v1/events?limit=50', 
    name: 'Events (50)',
    connections: 10,
    duration: 30,
    targetP95: 500 
  },
  { 
    url: '/api/v1/events?limit=500', 
    name: 'Events (500)',
    connections: 5,
    duration: 30,
    targetP95: 2000 
  },
  { 
    url: '/api/v1/events/count', 
    name: 'Events Count',
    connections: 10,
    duration: 30,
    targetP95: 100 
  },
  { 
    url: '/api/v1/stats', 
    name: 'Statistics',
    connections: 5,
    duration: 30,
    targetP95: 1000 
  },
];

async function runBenchmark(endpoint) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${endpoint.name}`);
  console.log(`URL: ${BASE_URL}${endpoint.url}`);
  console.log(`${'='.repeat(60)}`);
  
  return new Promise((resolve) => {
    const instance = autocannon({
      url: `${BASE_URL}${endpoint.url}`,
      connections: endpoint.connections,
      pipelining: 1,
      duration: endpoint.duration,
      bailOnNon2xx: false,
    });
    
    instance.on('done', (result) => {
      const p50 = result.latency.p50?.toFixed(2) || 'N/A';
      const p95 = result.latency.p95?.toFixed(2) || 'N/A';
      const p99 = result.latency.p99?.toFixed(2) || 'N/A';
      const reqSec = result.requests.average?.toFixed(2) || 'N/A';
      const status = p95 !== 'N/A' && parseFloat(p95) <= endpoint.targetP95 ? '✅ PASS' : '❌ FAIL';
      
      console.log(`\nResults:`);
      console.log(`  Requests/sec: ${reqSec}`);
      console.log(`  Latency p50:  ${p50}ms`);
      console.log(`  Latency p95:  ${p95}ms (target: <${endpoint.targetP95}ms) ${status}`);
      console.log(`  Latency p99:  ${p99}ms`);
      console.log(`  Total requests: ${result.requests.total}`);
      console.log(`  Errors: ${result.errors.total}`);
      
      resolve({
        ...endpoint,
        p50: p50 !== 'N/A' ? parseFloat(p50) : null,
        p95: p95 !== 'N/A' ? parseFloat(p95) : null,
        p99: p99 !== 'N/A' ? parseFloat(p99) : null,
        reqSec: reqSec !== 'N/A' ? parseFloat(reqSec) : null,
        totalRequests: result.requests.total,
        errors: result.errors.total,
        status: p95 !== 'N/A' && parseFloat(p95) <= endpoint.targetP95 ? 'PASS' : 'FAIL',
      });
    });
    
    instance.on('error', (err) => {
      console.error('Error:', err.message);
      resolve({ ...endpoint, error: err.message });
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     ELITE DANGEROUS NEXT - API Performance Benchmark     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await runBenchmark(endpoint);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  
  console.log('\n| Endpoint | p50 | p95 | Target p95 | Status |');
  console.log('|----------|-----|-----|------------|--------|');
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    if (result.error) {
      console.log(`| ${result.name.padEnd(8)} | ERROR: ${result.error} |`);
      failed++;
    } else {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`| ${result.name.padEnd(8)} | ${String(result.p50).padEnd(3)}ms | ${String(result.p95).padEnd(3)}ms | <${String(result.targetP95).padEnd(10)}ms | ${statusIcon} ${result.status.padEnd(4)} |`);
      
      if (result.status === 'PASS') passed++;
      else failed++;
    }
  }
  
  console.log(`\nTotal: ${passed + failed} tests, ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  // Save results to file
  const fs = await import('fs');
  const report = {
    date: new Date().toISOString(),
    target: BASE_URL,
    results,
    summary: {
      total: passed + failed,
      passed,
      failed,
      successRate: ((passed / (passed + failed)) * 100).toFixed(1),
    },
  };
  
  fs.writeFileSync(
    './scripts/api-benchmark-results.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\nResults saved to: ./scripts/api-benchmark-results.json`);
}

main().catch(console.error);
