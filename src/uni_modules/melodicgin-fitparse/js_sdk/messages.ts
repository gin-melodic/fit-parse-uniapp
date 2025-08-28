import { FitData } from './fit-data';
import type { FieldObject, FitMessage } from './types';

/**
 * 获取FIT消息定义
 * @param messageNum 消息编号
 * @returns FIT消息对象
 */
export function getFitMessage(messageNum: number): FitMessage {
  return {
    name: FitData.getMessageName(messageNum),
    getAttributes: (fieldNum: number): FieldObject => FitData.getFieldObject(fieldNum, messageNum),
  };
}

/**
 * 获取FIT消息基础类型
 * @param typeId 类型ID
 * @returns 基础类型
 */
export function getFitMessageBaseType(typeId: number): any {
  return typeId;
}
