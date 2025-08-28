import { FitData } from './fit-data';
import { getFitMessage, getFitMessageBaseType } from './messages';
import type {
    FieldDefinition,
    FitParserOptions,
    MessageTypeDefinition,
    ReadRecordResult
} from './types';
import { addEndian, bytesToUtf8String } from './utils';

// 常量定义
const CompressedTimeMask = 31;
const CompressedLocalMesgNumMask = 0x60;
const CompressedHeaderMask = 0x80;
const GarminTimeOffset = 631065600000;

// 全局变量
let timestamp = 0;
let lastTimeOffset = 0;
let monitoring_timestamp = 0;

/**
 * 读取数据字段
 * @param blob 数据缓冲区
 * @param fDef 字段定义
 * @param startIndex 开始索引
 * @param options 解析选项
 * @returns 解析后的数据
 */
function readData(
  blob: Uint8Array, 
  fDef: FieldDefinition, 
  startIndex: number, 
  options: FitParserOptions
): any {
  if (fDef.endianAbility === true) {
    const temp: number[] = [];
    for (let i = 0; i < fDef.size; i++) {
      temp.push(blob[startIndex + i]);
    }

    const buffer = new Uint8Array(temp).buffer;
    const dataView = new DataView(buffer);

    try {
      switch (fDef.type) {
        case 'sint16':
          return dataView.getInt16(0, fDef.littleEndian);
        case 'uint16':
        case 'uint16z':
          return dataView.getUint16(0, fDef.littleEndian);
        case 'sint32':
          return dataView.getInt32(0, fDef.littleEndian);
        case 'uint32':
        case 'uint32z':
          return dataView.getUint32(0, fDef.littleEndian);
        case 'float32':
          return dataView.getFloat32(0, fDef.littleEndian);
        case 'float64':
          return dataView.getFloat64(0, fDef.littleEndian);
        case 'uint32_array':
          const array32: number[] = [];
          for (let i = 0; i < fDef.size; i += 4) {
            array32.push(dataView.getUint32(i, fDef.littleEndian));
          }
          return array32;
        case 'uint16_array':
          const array: number[] = [];
          for (let i = 0; i < fDef.size; i += 2) {
            array.push(dataView.getUint16(i, fDef.littleEndian));
          }
          return array;
      }
    } catch (e) {
      if (!options.force) {
        throw e;
      }
    }

    return addEndian(fDef.littleEndian, temp);
  }

  if (fDef.type === 'string') {
    const temp: number[] = [];
    for (let i = 0; i < fDef.size; i++) {
      if (blob[startIndex + i]) {
        temp.push(blob[startIndex + i]);
      }
    }
    // 使用自定义的bytesToUtf8String替代Buffer.from()
    return bytesToUtf8String(temp);
  }

  if (fDef.type === 'byte_array') {
    const temp: number[] = [];
    for (let i = 0; i < fDef.size; i++) {
      temp.push(blob[startIndex + i]);
    }
    return temp;
  }

  return blob[startIndex];
}

/**
 * 根据类型格式化数据
 * @param data 原始数据
 * @param type 数据类型
 * @param scale 缩放因子
 * @param offset 偏移量
 * @returns 格式化后的数据
 */
function formatByType(data: any, type: string, scale?: number, offset: number = 0): any {
  switch (type) {
    case 'date_time':
    case 'local_date_time':
      return new Date((data * 1000) + GarminTimeOffset);
    case 'sint32':
      return data * FitData.scConst;
    case 'uint8':
    case 'sint16':
    case 'uint32':
    case 'uint16':
      return scale ? data / scale + offset : data;
    case 'uint32_array':
    case 'uint16_array':
      return data.map((dataItem: number) => scale ? dataItem / scale + offset : dataItem);
    default:
      if (!FitData.types[type]) {
        return data;
      }
      // 检查mask
      const values: string[] = [];
      for (const key in FitData.types[type]) {
        if (FitData.types[type].hasOwnProperty(key)) {
          values.push(FitData.types[type][key]);
        }
      }
      if (values.indexOf('mask') === -1) {
        return FitData.types[type][data];
      }
      const dataItem: any = {};
      for (const key in FitData.types[type]) {
        if (FitData.types[type].hasOwnProperty(key)) {
          if (FitData.types[type][key] === 'mask') {
            dataItem.value = data & parseInt(key);
          } else {
            dataItem[FitData.types[type][key]] = !!((data & parseInt(key)) >> 7);
          }
        }
      }
      return dataItem;
  }
}

/**
 * 检查是否为无效值
 * @param data 数据
 * @param type 类型
 * @returns 是否无效
 */
function isInvalidValue(data: any, type: string): boolean {
  switch (type) {
    case 'enum':
      return data === 0xFF;
    case 'sint8':
      return data === 0x7F;
    case 'uint8':
      return data === 0xFF;
    case 'sint16':
      return data === 0x7FFF;
    case 'uint16':
      return data === 0xFFFF;
    case 'sint32':
      return data === 0x7FFFFFFF;
    case 'uint32':
      return data === 0xFFFFFFFF;
    case 'string':
      return data === 0x00;
    case 'float32':
      return data === 0xFFFFFFFF;
    case 'float64':
      return data === 0xFFFFFFFFFFFFFFFF;
    case 'uint8z':
      return data === 0x00;
    case 'uint16z':
      return data === 0x0000;
    case 'uint32z':
      return data === 0x000000;
    case 'byte':
      return data === 0xFF;
    case 'sint64':
      return data === 0x7FFFFFFFFFFFFFFF;
    case 'uint64':
      return data === 0xFFFFFFFFFFFFFFFF;
    case 'uint64z':
      return data === 0x0000000000000000;
    default:
      return false;
  }
}

/**
 * 单位转换
 * @param data 数据
 * @param unitsList 单位列表
 * @param unit 目标单位
 * @returns 转换后的数据
 */
function convertTo(data: number, unitsList: string, unit: string): number {
  const unitObj = FitData.options[unitsList]?.[unit];
  return unitObj ? data * unitObj.multiplier + unitObj.offset : data;
}

/**
 * 应用选项设置
 * @param data 数据
 * @param field 字段名
 * @param options 选项
 * @returns 处理后的数据
 */
function applyOptions(data: any, field: string, options: FitParserOptions): any {
  switch (field) {
    case 'speed':
    case 'enhanced_speed':
    case 'vertical_speed':
    case 'avg_speed':
    case 'max_speed':
    case 'speed_1s':
    case 'ball_speed':
    case 'enhanced_avg_speed':
    case 'enhanced_max_speed':
    case 'avg_pos_vertical_speed':
    case 'max_pos_vertical_speed':
    case 'avg_neg_vertical_speed':
    case 'max_neg_vertical_speed':
      return convertTo(data, 'speedUnits', options.speedUnit || 'm/s');
    case 'distance':
    case 'total_distance':
    case 'enhanced_avg_altitude':
    case 'enhanced_min_altitude':
    case 'enhanced_max_altitude':
    case 'enhanced_altitude':
    case 'height':
    case 'odometer':
    case 'avg_stroke_distance':
    case 'min_altitude':
    case 'avg_altitude':
    case 'max_altitude':
    case 'total_ascent':
    case 'total_descent':
    case 'altitude':
    case 'cycle_length':
    case 'auto_wheelsize':
    case 'custom_wheelsize':
    case 'gps_accuracy':
      return convertTo(data, 'lengthUnits', options.lengthUnit || 'm');
    case 'temperature':
    case 'avg_temperature':
    case 'max_temperature':
      return convertTo(data, 'temperatureUnits', options.temperatureUnit || 'celsius');
    case 'pressure':
    case 'start_pressure':
    case 'end_pressure':
      return convertTo(data, 'pressureUnits', options.pressureUnit || 'bar');
    default:
      return data;
  }
}

/**
 * 读取记录
 * @param blob 数据
 * @param messageTypes 消息类型
 * @param developerFields 开发者字段
 * @param startIndex 开始索引
 * @param options 选项
 * @param startDate 开始日期
 * @param pausedTime 暂停时间
 * @returns 读取结果
 */
export function readRecord(
  blob: Uint8Array,
  messageTypes: MessageTypeDefinition[],
  developerFields: any[],
  startIndex: number,
  options: FitParserOptions,
  startDate?: Date,
  pausedTime: number = 0
): ReadRecordResult {
  const recordHeader = blob[startIndex];
  let localMessageType = recordHeader & 15;

  if ((recordHeader & CompressedHeaderMask) === CompressedHeaderMask) {
    // 压缩时间戳
    const timeoffset = recordHeader & CompressedTimeMask;
    timestamp += ((timeoffset - lastTimeOffset) & CompressedTimeMask);
    lastTimeOffset = timeoffset;

    localMessageType = ((recordHeader & CompressedLocalMesgNumMask) >> 5);
  } else if ((recordHeader & 64) === 64) {
    // 定义消息
    const hasDeveloperData = (recordHeader & 32) === 32;
    const lEnd = blob[startIndex + 2] === 0;
    const numberOfFields = blob[startIndex + 5];
    const numberOfDeveloperDataFields = hasDeveloperData ? blob[startIndex + 5 + numberOfFields * 3 + 1] : 0;

    const mTypeDef: MessageTypeDefinition = {
      littleEndian: lEnd,
      globalMessageNumber: addEndian(lEnd, [blob[startIndex + 3], blob[startIndex + 4]]),
      numberOfFields: numberOfFields + numberOfDeveloperDataFields,
      fieldDefs: [],
    };

    const message = getFitMessage(mTypeDef.globalMessageNumber);

    // 处理字段定义
    for (let i = 0; i < numberOfFields; i++) {
      const fDefIndex = startIndex + 6 + (i * 3);
      const baseType = blob[fDefIndex + 2];
      const { field, type } = message.getAttributes(blob[fDefIndex]);
      const fDef: FieldDefinition = {
        type,
        fDefNo: blob[fDefIndex],
        size: blob[fDefIndex + 1],
        endianAbility: (baseType & 128) === 128,
        littleEndian: lEnd,
        baseTypeNo: (baseType & 15),
        name: field,
        dataType: getFitMessageBaseType(baseType & 15),
      };

      mTypeDef.fieldDefs.push(fDef);
    }

    // 处理开发者数据字段
    for (let i = 0; i < numberOfDeveloperDataFields; i++) {
      try {
        const fDefIndex = startIndex + 6 + (numberOfFields * 3) + 1 + (i * 3);

        const fieldNum = blob[fDefIndex];
        const size = blob[fDefIndex + 1];
        const devDataIndex = blob[fDefIndex + 2];

        const devDef = developerFields[devDataIndex]?.[fieldNum];
        if (!devDef) continue;

        const baseType = devDef.fit_base_type_id;

        const fDef: FieldDefinition = {
          type: FitData.types.fit_base_type[baseType],
          fDefNo: fieldNum,
          size: size,
          endianAbility: (baseType & 128) === 128,
          littleEndian: lEnd,
          baseTypeNo: (baseType & 15),
          name: devDef.field_name,
          dataType: getFitMessageBaseType(baseType & 15),
          scale: devDef.scale || 1,
          offset: devDef.offset || 0,
          developerDataIndex: devDataIndex,
          isDeveloperField: true,
        };

        mTypeDef.fieldDefs.push(fDef);
      } catch (e) {
        if (options.force) {
          continue;
        }
        throw e;
      }
    }

    messageTypes[localMessageType] = mTypeDef;

    const nextIndex = startIndex + 6 + (mTypeDef.numberOfFields * 3);
    const nextIndexWithDeveloperData = nextIndex + 1;

    return {
      messageType: 'definition',
      nextIndex: hasDeveloperData ? nextIndexWithDeveloperData : nextIndex
    };
  }

  const messageType = messageTypes[localMessageType] || messageTypes[0];
  if (!messageType) {
    return {
      messageType: '',
      nextIndex: startIndex + 1
    };
  }

  // 读取数据
  let messageSize = 0;
  let readDataFromIndex = startIndex + 1;
  const fields: any = {};
  const message = getFitMessage(messageType.globalMessageNumber);

  for (let i = 0; i < messageType.fieldDefs.length; i++) {
    const fDef = messageType.fieldDefs[i];
    const data = readData(blob, fDef, readDataFromIndex, options);

    if (!isInvalidValue(data, fDef.type)) {
      if (fDef.isDeveloperField) {
        const field = fDef.name;
        const type = fDef.type;
        const scale = fDef.scale;
        const offset = fDef.offset || 0;

        fields[fDef.name] = applyOptions(formatByType(data, type, scale, offset), field, options);
      } else {
        const { field, type, scale, offset } = message.getAttributes(fDef.fDefNo);

        if (field !== 'unknown' && field !== '' && field !== undefined) {
          const numOffset = typeof offset === 'string' ? 0 : (offset || 0);
        fields[field] = applyOptions(formatByType(data, type, scale || undefined, numOffset), field, options);
        }
      }

      if (message.name === 'record' && options.elapsedRecordField && startDate) {
        fields.elapsed_time = (fields.timestamp - startDate.getTime()) / 1000;
        fields.timer_time = fields.elapsed_time - pausedTime;
      }
    }

    readDataFromIndex += fDef.size;
    messageSize += fDef.size;
  }

  // 处理字段描述
  if (message.name === 'field_description') {
    if (!developerFields[fields.developer_data_index]) {
      developerFields[fields.developer_data_index] = [];
    }
    developerFields[fields.developer_data_index][fields.field_definition_number] = fields;
  }

  // 处理监控数据时间戳
  if (message.name === 'monitoring') {
    if (fields.timestamp) {
      monitoring_timestamp = fields.timestamp;
      fields.timestamp = new Date(fields.timestamp * 1000 + GarminTimeOffset);
    }
    if (fields.timestamp16 && !fields.timestamp) {
      monitoring_timestamp += (fields.timestamp16 - (monitoring_timestamp & 0xFFFF)) & 0xFFFF;
      fields.timestamp = new Date(monitoring_timestamp * 1000 + GarminTimeOffset);
    }
  }

  return {
    messageType: message.name,
    nextIndex: startIndex + messageSize + 1,
    message: fields,
  };
}
