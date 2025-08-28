/**
 * uniapp FIT Parser - 主入口文件
 * 适用于uniapp的FIT文件解析器
 */

export { FitData } from './fit-data';
export { default as FitParser } from './fit-parser';
export { mapDataIntoLap, mapDataIntoSession } from './helper';
export { getFitMessage, getFitMessageBaseType } from './messages';
export * from './types';
export * from './utils';

// 默认导出
export { default } from './fit-parser';
