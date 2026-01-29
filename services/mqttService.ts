
import mqtt, { MqttClient } from 'mqtt';
import { MqttConfig } from '../types';

let client: MqttClient | null = null;

export const connectMqtt = (
  config: MqttConfig, 
  onMessage: (topic: string, message: string) => void,
  onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void
) => {
  if (client) {
    client.end();
  }

  if (!config.enabled || !config.brokerUrl) return null;

  try {
    // Note: In browsers, MQTT must use WebSockets (ws:// or wss://)
    client = mqtt.connect(config.brokerUrl, {
      keepalive: 60,
      clientId: `nurtureai_${Math.random().toString(16).slice(3)}`,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('MQTT Connected');
      onStatusChange('connected');
      client?.subscribe(config.topic);
    });

    client.on('message', (topic, message) => {
      onMessage(topic, message.toString());
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      onStatusChange('error');
    });

    client.on('close', () => {
      onStatusChange('disconnected');
    });

    return client;
  } catch (err) {
    console.error('MQTT Connection failed:', err);
    onStatusChange('error');
    return null;
  }
};

export const disconnectMqtt = () => {
  if (client) {
    client.end();
    client = null;
  }
};
