// 工具函数，替代Node.js Buffer等API

/**
 * 将Buffer转换为ArrayBuffer
 * @param buffer 输入的buffer或Uint8Array
 * @returns ArrayBuffer
 */
export function getArrayBuffer(buffer: any): ArrayBuffer {
  // 更可靠的ArrayBuffer检测方法
  if (Object.prototype.toString.call(buffer) === '[object ArrayBuffer]') {
    return buffer;
  }
  
  // 检查是否有ArrayBuffer属性（适用于某些平台）
  if (buffer && buffer.constructor && buffer.constructor.name === 'ArrayBuffer') {
    return buffer;
  }
  
  // 如果是uniapp文件系统返回的buffer
  if (buffer && typeof buffer.buffer === 'object') {
    return buffer.buffer;
  }
  
  // 处理Uint8Array或类似数组的对象
  const length = buffer.byteLength || buffer.length || 0;
  const ab = new ArrayBuffer(length);
  if (length > 0) {
    const view = new Uint8Array(ab);
    for (let i = 0; i < length; ++i) {
      view[i] = buffer[i];
    }
  }
  return ab;
}

/**
 * 字节数组转UTF-8字符串，替代Buffer.from().toString()
 * @param bytes 字节数组
 * @returns UTF-8字符串
 */
export function bytesToUtf8String(bytes: number[]): string {
  try {
    // 移除空字节
    const filteredBytes = bytes.filter(byte => byte !== 0);
    const uint8Array = new Uint8Array(filteredBytes);
    
    // 使用TextDecoder替代Buffer
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  } catch (error) {
    console.warn('UTF-8解码失败，使用fallback方法:', error);
    // fallback: 简单的ASCII转换
    return bytes
      .filter(byte => byte !== 0 && byte < 128)
      .map(byte => String.fromCharCode(byte))
      .join('');
  }
}

/**
 * 计算CRC校验码
 * @param blob 数据
 * @param start 开始位置
 * @param end 结束位置
 * @returns CRC值
 */
export function calculateCRC(blob: Uint8Array, start: number, end: number): number {
  const crcTable = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
  ];

  let crc = 0;
  for (let i = start; i < end; i++) {
    const byteVal = blob[i];
    let tmp = crcTable[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ crcTable[byteVal & 0xF];
    tmp = crcTable[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ crcTable[(byteVal >> 4) & 0xF];
  }

  return crc;
}

/**
 * 添加字节序处理
 * @param littleEndian 是否为小端序
 * @param bytes 字节数组
 * @returns 处理后的数值
 */
export function addEndian(littleEndian: boolean, bytes: number[]): number {
  let result = 0;
  if (!littleEndian) bytes.reverse();
  for (let i = 0; i < bytes.length; i++) {
    result += (bytes[i] << (i << 3)) >>> 0;
  }
  return result;
}

/**
 * uniapp文件选择wrapper
 * @param options 选择选项
 * @returns Promise
 */
export function chooseFile(options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    uni.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['fit'],
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * uniapp文件读取wrapper  
 * @param filePath 文件路径
 * @returns Promise<ArrayBuffer>
 */
export function readFile(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    // H5 平台使用 fetch API 读取文件
    // #ifdef H5
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
      fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => resolve(arrayBuffer))
        .catch(reject);
      return;
    }
    // #endif

    // 微信小程序等平台使用 FileSystemManager
    // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
    try {
      const fs = uni.getFileSystemManager();
      const result = fs.readFileSync(filePath);
      console.info('读取文件:', result);
      if (result) {
        const buffer = getArrayBuffer(result);
        console.info('转换成ArrayBuffer:', buffer);
        resolve(buffer);
      } else {
        reject(new Error('读取文件失败，返回结果为空'));
      }
    } catch (error) {
      reject(error);
    }
    return;
    // #endif

    // 其他平台默认实现
    // @ts-ignore
    uni.getFileSystemManager().readFile({
      filePath,
      success: (res: any) => {
        if (res.data) {
          resolve(getArrayBuffer(res.data));
        } else {
          reject(new Error('读取文件失败，返回结果为空'));
        }
      },
      fail: reject
    });
  });
}
