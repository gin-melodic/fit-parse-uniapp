# melodicgin-fitparse

适用于 UniApp 的 FIT 文件解析器，支持在多端（H5、微信小程序等）解析 FIT 运动数据文件。

## 简介

FIT (Flexible and Interoperable Data Transfer) 是 Garmin 开发的一种二进制文件格式，用于存储和传输运动和健身数据。本插件为 UniApp 平台提供了完整的 FIT 文件解析功能，支持解析各种运动设备生成的 FIT 文件。

## 功能特性

- 🌐 多端兼容：支持 H5、微信小程序、支付宝小程序等 UniApp 支持的所有平台
- 🚀 高性能：基于 TypeScript 开发，提供高效的解析能力
- 📦 完整解析：支持解析 FIT 文件中的所有数据类型
- ⚙️ 灵活配置：支持多种单位和数据格式配置
- 🔄 两种调用方式：支持回调和 Promise 两种调用方式
- 📊 数据结构化：将原始数据组织成易于使用的结构化数据

## 安装

### 通过 UniApp 插件市场安装（推荐）

1. 在 UniApp 插件市场中搜索 "melodicgin-fitparse"
2. 点击导入到项目中
3. 在需要使用的页面或组件中引入

### 手动安装

1. 下载插件包
2. 将插件文件夹复制到项目中的 `uni_modules` 目录下
3. 确保文件夹名为 `melodicgin-fitparse`

## 使用方法

### 基本使用

```typescript
import FitParser from '@/uni_modules/melodicgin-fitparse/js_sdk/melodicgin-fitparse';

// 创建解析器实例
const parser = new FitParser({
  force: true,
  speedUnit: 'km/h',
  lengthUnit: 'm',
  temperatureUnit: 'celsius',
  elapsedRecordField: false,
  mode: 'list'
});

// 解析 FIT 文件 (使用 Promise 方式)
try {
  const arrayBuffer = /* 你的 FIT 文件 ArrayBuffer 数据 */;
  const data = await parser.parseAsync(arrayBuffer);
  console.log('解析结果:', data);
} catch (error) {
  console.error('解析失败:', error);
}

// 解析 FIT 文件 (使用回调方式)
const arrayBuffer = /* 你的 FIT 文件 ArrayBuffer 数据 */;
parser.parse(arrayBuffer, (error, data) => {
  if (error) {
    console.error('解析失败:', error);
  } else {
    console.log('解析结果:', data);
  }
});
```

### 在 Vue 组件中使用

```vue
<template>
  <view>
    <fit-file-parser 
      :options="parserOptions"
      @parsed="handleParsed"
      @error="handleError"
    />
  </view>
</template>

<script setup>
import FitFileParser from '@/uni_modules/melodicgin-fitparse/components/fit-file-parser/fit-file-parser.vue';

const parserOptions = {
  speedUnit: 'km/h',
  lengthUnit: 'm',
  mode: 'both'
};

const handleParsed = (data) => {
  console.log('解析完成:', data);
};

const handleError = (error) => {
  console.error('解析错误:', error);
};
</script>
```

## 配置选项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| force | boolean | true | 强制解析，即使校验失败也继续解析 |
| speedUnit | 'm/s' \| 'km/h' \| 'mph' | 'm/s' | 速度单位 |
| lengthUnit | 'm' \| 'km' \| 'mi' | 'm' | 长度单位 |
| temperatureUnit | 'celsius' \| 'kelvin' \| 'fahrenheit' | 'celsius' | 温度单位 |
| elapsedRecordField | boolean | false | 是否包含经过时间字段 |
| pressureUnit | 'bar' \| 'cbar' \| 'psi' | 'bar' | 压力单位 |
| mode | 'cascade' \| 'list' \| 'both' | 'list' | 数据组织模式 |

### mode 选项说明

- `list`: 扁平化数据结构，各类型数据独立存储
- `cascade`: 层级化数据结构，数据按关联关系组织
- `both`: 同时提供两种数据结构

## 解析结果数据结构

解析完成后返回的数据包含以下主要字段：

| 字段 | 类型 | 描述 |
|------|------|------|
| protocolVersion | number | 协议版本 |
| profileVersion | number | 配置文件版本 |
| records | Array | 记录数据（时间序列数据） |
| laps | Array | 圈数据 |
| sessions | Array | 会话数据 |
| events | Array | 事件数据 |
| devices | Array | 设备信息 |
| sports | Array | 运动信息 |
| file_ids | Array | 文件标识信息 |

## API 参考

### FitParser 类

#### 构造函数

```typescript
new FitParser(options?: FitParserOptions)
```

#### parse 方法

```typescript
parse(content: ArrayBuffer | Uint8Array, callback: (error: string | null, data: FitData) => void): void
```

#### parseAsync 方法

```typescript
parseAsync(content: ArrayBuffer | Uint8Array): Promise<FitData>
```

## 支持的平台

- H5
- 微信小程序
- 支付宝小程序
- 百度小程序
- QQ 小程序
- 快手小程序
- 头条小程序
- 其他 UniApp 支持的小程序平台

## 注意事项

1. 输入数据必须是 ArrayBuffer 或 Uint8Array 格式
2. 在不同平台中读取文件的方式可能不同，需要根据具体平台适配
3. 大文件解析可能消耗较多内存和时间，请注意性能优化

## 示例项目

请参考项目中的 `src/pages/index/index.vue` 文件，其中包含了完整的使用示例，包括：
- 自动解析组件的使用
- 手动解析的实现
- 配置选项的动态调整

## 许可证

MIT