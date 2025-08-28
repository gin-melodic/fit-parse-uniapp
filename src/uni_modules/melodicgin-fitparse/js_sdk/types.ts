// TypeScript 类型定义文件

export interface FitParserOptions {
  force?: boolean;
  speedUnit?: 'm/s' | 'km/h' | 'mph';
  lengthUnit?: 'm' | 'km' | 'mi';
  temperatureUnit?: 'celsius' | 'kelvin' | 'fahrenheit';
  elapsedRecordField?: boolean;
  pressureUnit?: 'bar' | 'cbar' | 'psi';
  mode?: 'cascade' | 'list' | 'both';
}

export interface FitMessage {
  name: string;
  getAttributes: (fieldNum: number) => FieldObject;
}

export interface FieldObject {
  field: string;
  type: string;
  scale?: number | null;
  offset?: number | string;
  units?: string;
}

export interface FieldDefinition {
  type: string;
  fDefNo: number;
  size: number;
  endianAbility: boolean;
  littleEndian: boolean;
  baseTypeNo: number;
  name: string;
  dataType: any;
  scale?: number;
  offset?: number;
  developerDataIndex?: number;
  isDeveloperField?: boolean;
}

export interface MessageTypeDefinition {
  littleEndian: boolean;
  globalMessageNumber: number;
  numberOfFields: number;
  fieldDefs: FieldDefinition[];
}

export interface ReadRecordResult {
  messageType: string;
  nextIndex: number;
  message?: any;
}

export interface FitData {
  protocolVersion?: number;
  profileVersion?: number;
  sessions?: any[];
  laps?: any[];
  records?: any[];
  events?: any[];
  hrv?: any[];
  devices?: any[];
  applications?: any[];
  fieldDescriptions?: any[];
  dive_gases?: any[];
  course_points?: any[];
  sports?: any[];
  monitors?: any[];
  stress?: any[];
  definitions?: any[];
  file_ids?: any[];
  monitor_info?: any[];
  lengths?: any[];
  tank_updates?: any[];
  tank_summaries?: any[];
  activity?: {
    sessions?: any[];
    events?: any[];
    hrv?: any[];
    device_infos?: any[];
    developer_data_ids?: any[];
    field_descriptions?: any[];
    sports?: any[];
  };
  software?: any;
  [key: string]: any;
}

export type FitParseCallback = (error: string | null, data: FitData) => void;
