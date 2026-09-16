/**
 * ELK Stack integration configuration.
 *
 * Modes:
 *   1) Filebeat → reads logs/*.log → Logstash or Elasticsearch
 *   2) Direct HTTP → Winston posts JSON to Logstash HTTP input
 *   3) Direct Elasticsearch → winston-elasticsearch transport
 *
 * Environment:
 *   LOG_ELK_ENABLED=true
 *   LOG_ELK_MODE=http|elasticsearch|filebeat
 *
 *   # HTTP → Logstash
 *   LOG_ELK_HTTP_URL=http://logstash:8080
 *   LOG_ELK_HTTP_LEVEL=info
 *
 *   # Direct Elasticsearch
 *   LOG_ELK_ES_NODE=http://elasticsearch:9200
 *   LOG_ELK_ES_INDEX=sos-points-logs
 *   LOG_ELK_ES_USERNAME=
 *   LOG_ELK_ES_PASSWORD=
 *   LOG_ELK_ES_LEVEL=info
 */

export type ElkMode = 'http' | 'elasticsearch' | 'filebeat' | 'none';

export interface ElkConfig {
  enabled: boolean;
  mode: ElkMode;
  http: {
    url: string;
    level: string;
  };
  elasticsearch: {
    node: string;
    index: string;
    username?: string;
    password?: string;
    level: string;
  };
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  return v === '1' || v.toLowerCase() === 'true' || v === 'yes';
}

export function getElkConfig(): ElkConfig {
  const mode = (process.env.LOG_ELK_MODE || 'filebeat') as ElkMode;
  const enabled = envBool('LOG_ELK_ENABLED', false);

  return {
    enabled,
    mode: enabled ? mode : 'none',
    http: {
      url: process.env.LOG_ELK_HTTP_URL || process.env.LOG_HTTP_URL || '',
      level: process.env.LOG_ELK_HTTP_LEVEL || 'info',
    },
    elasticsearch: {
      node: process.env.LOG_ELK_ES_NODE || 'http://localhost:9200',
      index: process.env.LOG_ELK_ES_INDEX || 'sos-points-logs',
      username: process.env.LOG_ELK_ES_USERNAME || undefined,
      password: process.env.LOG_ELK_ES_PASSWORD || undefined,
      level: process.env.LOG_ELK_ES_LEVEL || 'info',
    },
  };
}
