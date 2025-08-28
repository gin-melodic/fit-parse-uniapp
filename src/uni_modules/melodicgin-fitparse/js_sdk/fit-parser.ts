import { readRecord } from './binary';
import { mapDataIntoLap, mapDataIntoSession } from './helper';
import type {
    FitData,
    FitParseCallback,
    FitParserOptions,
    MessageTypeDefinition
} from './types';
import { calculateCRC, getArrayBuffer } from './utils';

/**
 * FIT文件解析器 - uniapp TypeScript版本
 */
export default class FitParser {
  private options: Required<FitParserOptions>;

  constructor(options: FitParserOptions = {}) {
    this.options = {
      force: options.force != null ? options.force : true,
      speedUnit: options.speedUnit || 'm/s',
      lengthUnit: options.lengthUnit || 'm',
      temperatureUnit: options.temperatureUnit || 'celsius',
      elapsedRecordField: options.elapsedRecordField || false,
      pressureUnit: options.pressureUnit || 'bar',
      mode: options.mode || 'list',
    };
  }

  /**
   * 解析FIT文件
   * @param content 文件内容（ArrayBuffer或Uint8Array）
   * @param callback 解析完成回调
   */
  parse(content: ArrayBuffer | Uint8Array, callback: FitParseCallback): void {
    try {
      const blob = new Uint8Array(getArrayBuffer(content));

      // 检查文件最小长度
      if (blob.length < 12) {
        callback('File to small to be a FIT file', {} as FitData);
        if (!this.options.force) {
          return;
        }
      }

      // 检查头部长度
      const headerLength = blob[0];
      if (headerLength !== 14 && headerLength !== 12) {
        callback('Incorrect header size', {} as FitData);
        if (!this.options.force) {
          return;
        }
      }

      // 检查文件类型标识
      let fileTypeString = '';
      for (let i = 8; i < 12; i++) {
        fileTypeString += String.fromCharCode(blob[i]);
      }
      if (fileTypeString !== '.FIT') {
        callback('Missing \'.FIT\' in header', {} as FitData);
        if (!this.options.force) {
          return;
        }
      }

      // 验证头部CRC（如果存在）
      if (headerLength === 14) {
        const crcHeader = blob[12] + (blob[13] << 8);
        const crcHeaderCalc = calculateCRC(blob, 0, 12);
        if (crcHeader !== crcHeaderCalc) {
          // Header CRC验证暂时跳过
          if (!this.options.force) {
            return;
          }
        }
      }

      // 读取文件头信息
      const protocolVersion = blob[1];
      const profileVersion = blob[2] + (blob[3] << 8);
      const dataLength = blob[4] + (blob[5] << 8) + (blob[6] << 16) + (blob[7] << 24);
      const crcStart = dataLength + headerLength;
      const crcFile = blob[crcStart] + (blob[crcStart + 1] << 8);
      const crcFileCalc = calculateCRC(blob, headerLength === 12 ? 0 : headerLength, crcStart);

      // 验证文件CRC
      if (crcFile !== crcFileCalc) {
        // File CRC验证暂时跳过
        if (!this.options.force) {
          return;
        }
      }

      // 初始化解析结果
      const fitObj: FitData = {
        protocolVersion,
        profileVersion,
      };

      // 初始化数据数组
      let sessions: any[] = [];
      let laps: any[] = [];
      const records: any[] = [];
      const events: any[] = [];
      const hrv: any[] = [];
      const devices: any[] = [];
      const applications: any[] = [];
      const fieldDescriptions: any[] = [];
      const dive_gases: any[] = [];
      const course_points: any[] = [];
      const sports: any[] = [];
      const monitors: any[] = [];
      const stress: any[] = [];
      const definitions: any[] = [];
      const file_ids: any[] = [];
      const monitor_info: any[] = [];
      const lengths: any[] = [];
      const tank_updates: any[] = [];
      const tank_summaries: any[] = [];

      // 解析状态变量
      let loopIndex = headerLength;
      const messageTypes: MessageTypeDefinition[] = [];
      const developerFields: any[] = [];

      const isModeCascade = this.options.mode === 'cascade';
      const isCascadeNeeded = isModeCascade || this.options.mode === 'both';

      let startDate: Date | undefined;
      let lastStopTimestamp: number | undefined;
      let pausedTime = 0;

      // 解析数据记录
      while (loopIndex < crcStart) {
        const { nextIndex, messageType, message } = readRecord(
          blob, 
          messageTypes, 
          developerFields, 
          loopIndex, 
          this.options, 
          startDate, 
          pausedTime
        );
        loopIndex = nextIndex;

        // 根据消息类型分类处理
        switch (messageType) {
          case 'lap':
            laps.push(message);
            break;
          case 'session':
            sessions.push(message);
            break;
          case 'event':
            if (message?.event === 'timer') {
              if (message.event_type === 'stop_all') {
                lastStopTimestamp = message.timestamp;
              } else if (message.event_type === 'start' && lastStopTimestamp) {
                pausedTime += (message.timestamp - lastStopTimestamp) / 1000;
              }
            }
            events.push(message);
            break;
          case 'length':
            lengths.push(message);
            break;
          case 'hrv':
            hrv.push(message);
            break;
          case 'record':
            if (!startDate && message?.timestamp) {
              startDate = message.timestamp;
              message.elapsed_time = 0;
              message.timer_time = 0;
            }
            records.push(message);
            break;
          case 'field_description':
            fieldDescriptions.push(message);
            break;
          case 'device_info':
            devices.push(message);
            break;
          case 'developer_data_id':
            applications.push(message);
            break;
          case 'dive_gas':
            dive_gases.push(message);
            break;
          case 'course_point':
            course_points.push(message);
            break;
          case 'sport':
            sports.push(message);
            break;
          case 'file_id':
            if (message) {
              file_ids.push(message);
            }
            break;
          case 'definition':
            if (message) {
              definitions.push(message);
            }
            break;
          case 'monitoring':
            monitors.push(message);
            break;
          case 'monitoring_info':
            monitor_info.push(message);
            break;
          case 'stress_level':
            stress.push(message);
            break;
          case 'software':
            fitObj.software = message;
            break;
          case 'tank_update':
            tank_updates.push(message);
            break;
          case 'tank_summary':
            tank_summaries.push(message);
            break;
          default:
            if (messageType !== '') {
              fitObj[messageType] = message;
            }
            break;
        }
      }

      // 组织数据结构
      if (isCascadeNeeded) {
        fitObj.activity = fitObj.activity || {};
        laps = mapDataIntoLap(laps, 'records', records);
        laps = mapDataIntoLap(laps, 'lengths', lengths);
        sessions = mapDataIntoSession(sessions, laps);
        fitObj.activity.sessions = sessions;
        fitObj.activity.events = events;
        fitObj.activity.hrv = hrv;
        fitObj.activity.device_infos = devices;
        fitObj.activity.developer_data_ids = applications;
        fitObj.activity.field_descriptions = fieldDescriptions;
        fitObj.activity.sports = sports;
      }

      if (!isModeCascade) {
        fitObj.sessions = sessions;
        fitObj.laps = laps;
        fitObj.lengths = lengths;
        fitObj.records = records;
        fitObj.events = events;
        fitObj.device_infos = devices;
        fitObj.developer_data_ids = applications;
        fitObj.field_descriptions = fieldDescriptions;
        fitObj.hrv = hrv;
        fitObj.dive_gases = dive_gases;
        fitObj.course_points = course_points;
        fitObj.sports = sports;
        fitObj.devices = devices;
        fitObj.monitors = monitors;
        fitObj.stress = stress;
        fitObj.file_ids = file_ids;
        fitObj.monitor_info = monitor_info;
        fitObj.definitions = definitions;
        fitObj.tank_updates = tank_updates;
        fitObj.tank_summaries = tank_summaries;
      }

      callback(null, fitObj);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      callback(errorMessage, {} as FitData);
    }
  }

  /**
   * Promise版本的解析方法
   * @param content 文件内容
   * @returns Promise<FitData>
   */
  parseAsync(content: ArrayBuffer | Uint8Array): Promise<FitData> {
    return new Promise((resolve, reject) => {
      this.parse(content, (error, data) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      });
    });
  }
}
