<template>
  <view class="example-container">
    <view class="header">
      <text class="title">FIT Parser 基础使用示例</text>
    </view>

    <!-- 基础解析器组件 -->
    <fit-file-parser 
      :options="parserOptions"
      @parsed="handleParsed"
      @error="handleError"
    />

    <!-- 手动解析示例 -->
    <view class="manual-section">
      <view class="section-title">手动解析示例</view>
      
      <button class="demo-btn" @click="selectAndParseManually">
        手动选择并解析FIT文件
      </button>

      <view v-if="manualResult" class="manual-result">
        <text class="result-title">手动解析结果:</text>
        <view class="key-data">
          <view v-if="manualResult.records" class="data-item">
            <text class="label">总记录数:</text>
            <text class="value">{{ manualResult.records.length }}</text>
          </view>
          <view v-if="manualResult.sessions && manualResult.sessions.length > 0" class="data-item">
            <text class="label">运动类型:</text>
            <text class="value">{{ getSportName(manualResult.sessions[0].sport) }}</text>
          </view>
          <view v-if="getFirstRecord()" class="data-item">
            <text class="label">开始时间:</text>
            <text class="value">{{ formatDate(getFirstRecord().timestamp) }}</text>
          </view>
          <view v-if="getLastRecord()" class="data-item">
            <text class="label">结束时间:</text>
            <text class="value">{{ formatDate(getLastRecord().timestamp) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义配置示例 -->
    <view class="config-section">
      <view class="section-title">配置选项</view>
      
      <view class="config-item">
        <text class="config-label">速度单位:</text>
        <picker 
          :value="speedUnitIndex" 
          :range="speedUnits"
          @change="onSpeedUnitChange"
        >
          <text class="picker-text">{{ speedUnits[speedUnitIndex] }}</text>
        </picker>
      </view>

      <view class="config-item">
        <text class="config-label">长度单位:</text>
        <picker 
          :value="lengthUnitIndex" 
          :range="lengthUnits"
          @change="onLengthUnitChange"
        >
          <text class="picker-text">{{ lengthUnits[lengthUnitIndex] }}</text>
        </picker>
      </view>

      <view class="config-item">
        <text class="config-label">数据模式:</text>
        <picker 
          :value="modeIndex" 
          :range="modes"
          @change="onModeChange"
        >
          <text class="picker-text">{{ modes[modeIndex] }}</text>
        </picker>
      </view>

      <view class="config-item">
        <switch 
          :checked="parserOptions.elapsedRecordField" 
          @change="onElapsedFieldChange"
        />
        <text class="config-label">包含经过时间字段</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import FitFileParser from '@/components/fit-file-parser/fit-file-parser.vue';
import FitParser from '@/uni_modules/melodicgin-fitparse/js_sdk/melodicgin-fitparse';
import { chooseFile, readFile } from '@/uni_modules/melodicgin-fitparse/js_sdk/utils';
import type { FitData, FitParserOptions } from '@/uni_modules/melodicgin-fitparse/js_sdk/types';

// 配置选项
const speedUnits = ['m/s', 'km/h', 'mph'];
const lengthUnits = ['m', 'km', 'mi'];
const modes = ['list', 'cascade', 'both'];

const speedUnitIndex = ref(1); // 默认km/h
const lengthUnitIndex = ref(0); // 默认m
const modeIndex = ref(0); // 默认list

// 解析器选项
const parserOptions = reactive<FitParserOptions>({
  speedUnit: 'km/h',
  lengthUnit: 'm',
  temperatureUnit: 'celsius',
  pressureUnit: 'bar',
  mode: 'list',
  elapsedRecordField: false,
  force: true
});

// 手动解析结果
const manualResult = ref<FitData | null>(null);

// 事件处理
const handleParsed = (data: FitData) => {
  console.log('解析完成:', data);
  uni.showToast({
    title: '解析完成',
    icon: 'success'
  });
};

const handleError = (error: string) => {
  console.error('解析错误:', error);
  uni.showToast({
    title: '解析失败',
    icon: 'error'
  });
};

// 手动解析
const selectAndParseManually = async () => {
  try {
    // 选择文件
    const result = await chooseFile({
      extension: ['.fit']
    });
    
    if (result.tempFiles && result.tempFiles.length > 0) {
      const file = result.tempFiles[0];
      
      // 读取文件
      const arrayBuffer = await readFile(file.path);
      
      // 创建自定义配置的解析器
      const parser = new FitParser({
        ...parserOptions,
        mode: 'both' // 获取完整数据
      });
      
      // 解析
      const data = await parser.parseAsync(arrayBuffer);
      manualResult.value = data;
      
      uni.showToast({
        title: '手动解析完成',
        icon: 'success'
      });
    }
  } catch (error) {
    console.error('手动解析失败:', error);
    uni.showToast({
      title: '解析失败',
      icon: 'error'
    });
  }
};

// 配置变更处理
const onSpeedUnitChange = (e: any) => {
  speedUnitIndex.value = e.detail.value;
  parserOptions.speedUnit = speedUnits[e.detail.value] as any;
};

const onLengthUnitChange = (e: any) => {
  lengthUnitIndex.value = e.detail.value;
  parserOptions.lengthUnit = lengthUnits[e.detail.value] as any;
};

const onModeChange = (e: any) => {
  modeIndex.value = e.detail.value;
  parserOptions.mode = modes[e.detail.value] as any;
};

const onElapsedFieldChange = (e: any) => {
  parserOptions.elapsedRecordField = e.detail.value;
};

// 辅助方法
const getFirstRecord = () => {
  return manualResult.value?.records?.[0];
};

const getLastRecord = () => {
  const records = manualResult.value?.records;
  return records?.[records.length - 1];
};

const getSportName = (sportId: number): string => {
  const sportMap: { [key: number]: string } = {
    0: '通用',
    1: '跑步',
    2: '骑行',
    5: '游泳',
    // 添加更多运动类型...
  };
  return sportMap[sportId] || `运动类型${sportId}`;
};

const formatDate = (timestamp: Date | string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};
</script>

<style scoped>
.example-container {
  padding: 20rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.manual-section, .config-section {
  background: white;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.demo-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.manual-result {
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
}

.key-data {
  margin-top: 10rpx;
}

.data-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.config-label {
  font-size: 28rpx;
  color: #333;
}

.picker-text {
  font-size: 28rpx;
  color: #007aff;
  text-align: right;
}
</style>
