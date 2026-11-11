# Лаборатори 13 — Prometheus, Grafana ашиглан хяналтын самбар байгуулах

F.CSA316 · 14-р долоо хоног · CLO4 · Баг 11

## Бүтэц

```
API (Express) ──/metrics──▶ Prometheus (9090) ──PromQL──▶ Grafana (3001)
   prom-client                scrape 5 с, alert rule        dashboard (8 panel)
```

| Файл | Агуулга |
| --- | --- |
| [`src/metrics.js`](../src/metrics.js) | `http_requests_total` (counter), `http_request_duration_seconds` (histogram), Node.js-ийн суурь metrics |
| [`docker-compose.yml`](../docker-compose.yml) | `api`, `db`, `prometheus`, `grafana` |
| [`monitoring/prometheus/prometheus.yml`](../monitoring/prometheus/prometheus.yml) | Scrape target: `api:3000/metrics`, 5 секунд тутам |
| [`monitoring/prometheus/alerts.yml`](../monitoring/prometheus/alerts.yml) | `HighRequestRate`, `HighLatencyP95`, `ApiDown` |
| [`monitoring/grafana/provisioning/`](../monitoring/grafana/provisioning/) | Prometheus data source + dashboard-ыг автоматаар ачаална |
| [`monitoring/grafana/dashboards/careerbridge-api.json`](../monitoring/grafana/dashboards/careerbridge-api.json) | «CareerBridge API» dashboard |
| [`scripts/load-test.js`](../scripts/load-test.js) | Хиймэл ачаалал (нэмэлт сангүй) |

## Ажиллуулах

```bash
git pull
docker compose up -d --build
docker compose ps                       # api, db (healthy), prometheus, grafana (running)
```

| Хаяг | Юу харах вэ |
| --- | --- |
| http://localhost:3000/metrics | Аппын metrics (Prometheus text формат) |
| http://localhost:9090/targets | `careerbridge-api` → **UP** |
| http://localhost:9090/alerts | Alert rule-уудын төлөв |
| http://localhost:3001 | Grafana (`admin` / `admin`). Нүүр хуудсанд «CareerBridge API» dashboard нээгдэнэ |

## Dashboard (8 panel, 5 секунд тутам шинэчлэгдэнэ)

| Panel | PromQL |
| --- | --- |
| Хүсэлтийн хурд | `sum(rate(http_requests_total[1m]))` |
| Нийт хүсэлт (15 мин) | `sum(increase(http_requests_total[15m]))` |
| p95 хариу өгөх хугацаа | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[1m])))` |
| Алдааны хувь (5xx) | 5xx хүсэлтийн хурд / нийт хүсэлтийн хурд |
| Хүсэлтийн хурд (route-аар) | `sum by (route) (rate(http_requests_total[1m]))` |
| Хариу өгөх хугацаа p50/p95/p99 | `histogram_quantile(…)` |
| HTTP status code | `sum by (status) (rate(http_requests_total[1m]))` |
| Node.js процесс | `process_resident_memory_bytes`, `nodejs_heap_size_used_bytes` |

## Alert

| Alert | Нөхцөл | `for` |
| --- | --- | --- |
| `HighRequestRate` | `sum(rate(http_requests_total[1m])) > 5` req/s | 30 с |
| `HighLatencyP95` | p95 > 0.5 с | 1 мин |
| `ApiDown` | `up == 0` | 30 с |

## Хиймэл ачаалал → real-time өөрчлөлт

```bash
node scripts/load-test.js --rps 10 --duration 90
```

1. Grafana-ийн dashboard-ыг нээлттэй байлгаад ачааллыг эхлүүлнэ.
2. «Хүсэлтийн хурд» 0-ээс ойролцоогоор 10 req/s хүртэл өсч, босго (5) давахад улаан болно.
3. Prometheus → Alerts: `HighRequestRate` нь **inactive → pending → firing** болно. Ачаалал зогссоноос хойш 1 минут орчмын дараа буцаж inactive болно.

## CI-ийн баталгаажуулалт (`monitoring` job)

`promtool check config` → `docker compose up --wait` → Prometheus target `up` эсэх → 75 секунд ачаалал → Prometheus-ийн query (≥ 500 хүсэлт) → `HighRequestRate` **firing** → Grafana-д data source болон dashboard (≥ 3 panel) provision хийгдсэн эсэх.

## Хүлээлгэж өгөх зүйл (deliverable)

- [x] `docker-compose.yml` (api, db, prometheus, grafana)
- [x] 2-оос олон metric: хүсэлтийн тоо, хариу өгөх хугацаа, Node.js процесс
- [x] 3-аас олон panel-тай dashboard (8)
- [ ] Screenshot: ачааллын үед dashboard real-time өөрчлөгдөж байгаа байдал
