declare global {
  namespace Express {
    interface Request {
      telemetryMetadata: Record<string, any>;
    }
  }
}

export interface ITrace {
  scope?: Scope;
  data?: ITraceData;
}

export interface Scope {
  attributes?: Attributes;
}

export interface Attributes {
  [key: string]: any;
}

export interface ITraceData {
  attributes: Attributes;
  events?: Events[];
}

export interface Events {
  name: string;
  time: string;
  attributes: Attributes;
}

export interface IAudit {
  traceId: string;
  timestamp: string | number | Date;
  severityNumber: string | number;
  message: string;
  object?: Record<string, any>;
  attributes?: Attributes;
  scope?: Scope;
}

export interface IMetric {
  key: string
  unit: string
  description?: string
  metric: Metric
}

export interface Metric {
  type?: string
  aggregationTemporality: number
  isMonotonic?: boolean;
  dataPoints: DataPoint[];
}

export interface DataPoint {
  value: number;
  start: string;
  end: string;
  metric: Record<string, any>;
  attributes?: Attributes
}

export interface AdditionalData {
  domain?: string;
  attributes?: Attributes;
  [key: string]: any
}