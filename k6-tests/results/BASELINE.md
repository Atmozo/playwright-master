# Dogs API Performance Baseline

**Date:** April 18, 2026
**Test:** Smoke Test (5 VUs, 2 minutes)

## Results

- Total Requests: 374
- Success Rate: 100%
- Error Rate: 0%
- RPS: 3.1 req/s
- Avg Response: 237ms
- P95: 254ms
- P99: 406ms

## Thresholds

✅ http_req_duration p(95)<500ms - PASSED (254ms)
✅ http_req_duration p(99)<1000ms - PASSED (406ms)  
✅ http_req_failed rate<0.01 - PASSED (0%)

## Status: EXCELLENT ✅

API is performing well with consistent response times and zero errors.
