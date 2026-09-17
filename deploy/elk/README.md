# ELK Stack – SOS Points API

Intégration des logs structurés JSON avec Elasticsearch, Logstash et Kibana.

## Architecture recommandée

```
API (Winston)
  → logs/app-YYYY-MM-DD.log  (JSON)
  → Filebeat
  → Logstash :5044
  → Elasticsearch (sos-points-logs-YYYY.MM.DD)
  → Kibana :5601
```

Alternative sans Filebeat :

```
API (Winston HTTP transport)
  → Logstash :8080 (HTTP JSON)
  → Elasticsearch
  → Kibana
```

## Démarrage local

```bash
cd deploy/elk
docker compose up -d
```

- Elasticsearch : http://localhost:9200  
- Kibana : http://localhost:5601  
- Logstash Beats : localhost:5044  
- Logstash HTTP : localhost:8080  

## Index template

```bash
curl -X PUT "http://localhost:9200/_index_template/sos-points-logs" \
  -H "Content-Type: application/json" \
  -d @elasticsearch/index-template.json
```

## Configuration API

### Mode Filebeat (recommandé en prod)

```env
LOG_ELK_ENABLED=true
LOG_ELK_MODE=filebeat
LOG_FILE=true
LOG_ROTATE_DAILY=true
LOG_FORMAT=json
```

Filebeat lit les fichiers et les envoie à Logstash.

### Mode HTTP direct → Logstash

```env
LOG_ELK_ENABLED=true
LOG_ELK_MODE=http
LOG_ELK_HTTP_URL=http://localhost:8080
LOG_ELK_HTTP_LEVEL=info
```

### Mode Elasticsearch direct

```env
LOG_ELK_ENABLED=true
LOG_ELK_MODE=elasticsearch
LOG_ELK_ES_NODE=http://localhost:9200
LOG_ELK_ES_INDEX=sos-points-logs
LOG_ELK_ES_LEVEL=info
```

## Requêtes utiles (Kibana Dev Tools)

```
# Erreurs des dernières 24h
GET sos-points-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  }
}

# Tracer une requête
GET sos-points-logs-*/_search
{
  "query": { "term": { "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" } },
  "sort": [{ "@timestamp": "asc" }]
}

# Latence HTTP p95
GET sos-points-logs-*/_search
{
  "query": { "term": { "event": "http.request" } },
  "aggs": {
    "p95": { "percentiles": { "field": "durationMs", "percents": [95] } }
  }
}
```

## Data View Kibana

1. Stack Management → Data Views  
2. Create : `sos-points-logs-*`  
3. Time field : `@timestamp`  

Champs utiles : `requestId`, `level`, `event`, `httpPath`, `statusCode`, `durationMs`, `userId`.

## Optimisation des performances d'indexation

### Réglages appliqués

| Couche | Optimisation |
|--------|----------------|
| **Elasticsearch** | `refresh_interval: 30s`, translog async, 0 replica (dev), `best_compression`, mapping `dynamic: strict` |
| **ILM** | Rollover 1j / 25 Go, warm après 3j (forcemerge), delete après 30j |
| **Logstash** | batch 250, workers 2, queue persistante 1 Go, compression HTTP |
| **Filebeat** | queue 4096, bulk 2048, 2 workers, flush 512 events / 1s |

### Appliquer template + ILM

```bash
# ILM policy
curl -X PUT "http://localhost:9200/_ilm/policy/sos-points-logs-policy" \
  -H "Content-Type: application/json" \
  -d @elasticsearch/ilm-policy.json

# Index template
curl -X PUT "http://localhost:9200/_index_template/sos-points-logs" \
  -H "Content-Type: application/json" \
  -d @elasticsearch/index-template.json
```

### Conseils throughput

1. **Ne pas** utiliser `refresh_interval: 1s` en écriture pure – 15–30s est bien meilleur.
2. Replicas à **0** le temps du bulk massif, puis repasser à 1.
3. Mapping **strict** + types `keyword` / `short` / `integer` = moins de CPU et de stockage.
4. `stack` non indexé (`index: false`) pour éviter d’indexer les stack traces.
5. Filebeat `bulk_max_size` et Logstash `pipeline.batch.size` doivent rester alignés (ordre de grandeur 500–2000).
6. Surveiller `_nodes/stats/indexing` et `thread_pool.write.queue` sous charge.

### Scaling prod

- Augmenter `pipeline.workers` Logstash (= CPU cores utiles)
- ES : data nodes dédiés, `indices.memory.index_buffer_size: 20–30%` sur nœuds d’ingestion
- Séparer hot/warm via ILM + node attributes
