<template>
  <view class="fit-parser-container">
    <view class="upload-section">
      <button 
        class="upload-btn" 
        @click="selectFile"
        :disabled="parsing"
      >
        {{ parsing ? '解析中...' : '选择FIT文件' }}
      </button>
      
      <view v-if="selectedFile" class="file-info">
        <text class="file-name">{{ selectedFile.name }}</text>
        <text class="file-size">大小: {{ formatFileSize(selectedFile.size) }}</text>
      </view>
    </view>

    <view v-if="parseResult" class="result-section">
      <view class="result-header">
        <text class="result-title">解析结果</text>
        <button class="copy-btn" @click="copyResult">复制</button>
      </view>
      
      <scroll-view class="result-content" scroll-y>
        <view class="data-summary">
          <view class="summary-item">
            <text class="summary-label">协议版本:</text>
            <text class="summary-value">{{ parseResult.protocolVersion }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">配置文件版本:</text>
            <text class="summary-value">{{ parseResult.profileVersion }}</text>
          </view>
          <view v-if="parseResult.records" class="summary-item">
            <text class="summary-label">记录数量:</text>
            <text class="summary-value">{{ parseResult.records.length }}</text>
          </view>
          <view v-if="parseResult.laps" class="summary-item">
            <text class="summary-label">圈数:</text>
            <text class="summary-value">{{ parseResult.laps.length }}</text>
          </view>
        </view>

        <view class="json-display">
          <text class="json-text">{{ formattedResult }}</text>
        </view>
      </scroll-view>
    </view>

    <view v-if="errorMessage" class="error-section">
      <text class="error-text">{{ errorMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import FitParser from '@/uni_modules/melodicgin-fitparse/js_sdk/melodicgin-fitparse';
import type { FitData, FitParserOptions } from '@/uni_modules/melodicgin-fitparse/js_sdk/types';
import { chooseFile, readFile } from '@/uni_modules/melodicgin-fitparse/js_sdk/utils';

// Props定义
interface Props {
  options?: FitParserOptions;
  autoFormat?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
  autoFormat: true
});

// Emits定义
interface Emits {
  (e: 'parsed', data: FitData): void;
  (e: 'error', error: string): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const selectedFile = ref<{ name: string; size: number; path: string } | null>(null);
const parsing = ref(false);
const parseResult = ref<FitData | null>(null);
const errorMessage = ref('');

// 计算属性
const formattedResult = computed(() => {
  if (!parseResult.value) return '';
  return props.autoFormat 
    ? JSON.stringify(parseResult.value, null, 2)
    : JSON.stringify(parseResult.value);
});

// 方法定义
const selectFile = async () => {
  try {
    const result = await chooseFile({
      extension: ['.fit']
    });
    
    if (result.tempFiles && result.tempFiles.length > 0) {
      const file = result.tempFiles[0];
      selectedFile.value = {
        name: file.name || 'unknown.fit',
        size: file.size || 0,
        path: file.path
      };

      console.info('开始解析文件:', selectedFile.value);
      // 检查是否超过100MB
      if (selectedFile.value.size > 100 * 1024 * 1024) {
        errorMessage.value = '文件过大，请选择小于100MB的文件';
        return;
      }
      
      // 自动开始解析
      await parseFile();
    }
  } catch (error) {
    console.error('选择文件失败:', error);
    errorMessage.value = '选择文件失败，请重试';
  }
};

const parseFile = async () => {
  if (!selectedFile.value) return;
  
  parsing.value = true;
  errorMessage.value = '';
  parseResult.value = null;
  
  try {
    // 读取文件内容
    console.info('读取文件内容:', selectedFile.value);
    const arrayBuffer = await readFile(selectedFile.value.path);
    
    // 创建解析器实例
    const parser = new FitParser(props.options);
    
    // 解析文件
    // console and check arrayBuffer
    console.info('解析文件:', arrayBuffer);
    console.info('解析文件:', arrayBuffer.byteLength);

    if (!arrayBuffer || arrayBuffer.byteLength <= 0) {
      throw new Error('读取文件失败，返回结果为空');
    }

    const result = await parser.parseAsync(arrayBuffer);
    
    parseResult.value = result;
    emit('parsed', result);
    
  } catch (error) {
    console.error('解析FIT文件失败:', error);
    const message = error instanceof Error ? error.message : '解析失败，请检查文件格式';
    errorMessage.value = message;
    emit('error', message);
  } finally {
    parsing.value = false;
  }
};

const copyResult = () => {
  if (!parseResult.value) return;
  
  // #ifdef H5
  navigator.clipboard.writeText(formattedResult.value).then(() => {
    uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
  });
  // #endif
  
  // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
  uni.setClipboardData({
    data: formattedResult.value,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }
  });
  // #endif
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 公开方法（供父组件调用）
const parse = (arrayBuffer: ArrayBuffer) => {
  const parser = new FitParser(props.options);
  return parser.parseAsync(arrayBuffer);
};

defineExpose({
  parse,
  selectFile,
  parseFile
});
</script>

<style scoped>
.fit-parser-container {
  padding: 20rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.upload-section {
  background: white;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.upload-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 500;
}

.upload-btn:disabled {
  background: #ccc;
}

.file-info {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
}

.file-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.file-size {
  font-size: 24rpx;
  color: #666;
}

.result-section {
  background: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.result-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.copy-btn {
  padding: 12rpx 24rpx;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.result-content {
  height: 800rpx;
}

.data-summary {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  margin: 0 20rpx 20rpx;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.summary-label {
  font-size: 28rpx;
  color: #666;
}

.summary-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.json-display {
  background-color: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
}

.json-text {
  font-size: 24rpx;
  font-family: 'Courier New', monospace;
  color: #333;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.error-section {
  background: #fff5f5;
  border: 1rpx solid #feb2b2;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-top: 20rpx;
}

.error-text {
  color: #e53e3e;
  font-size: 28rpx;
}
</style>
