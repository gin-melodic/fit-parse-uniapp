/**
 * 辅助函数 - 数据映射和组织
 */

/**
 * 将数据映射到圈（lap）中
 * @param inputLaps 输入的圈数据
 * @param lapKey 圈键名
 * @param data 要映射的数据
 * @returns 映射后的圈数据
 */
export function mapDataIntoLap<T extends { start_time: Date | string }>(
  inputLaps: T[], 
  lapKey: string, 
  data: Array<{ timestamp: Date | string }>
): T[] {
  const laps = [...inputLaps];
  let index = 0;

  for (let i = 0; i < laps.length; i++) {
    const lap = laps[i];
    const nextLap = laps[i + 1];
    const tempData: any[] = [];
    const lapStartTime = new Date(lap.start_time).getTime();
    const nextLapStartTime = nextLap ? new Date(nextLap.start_time).getTime() : null;

    for (let j = index; j < data.length; j++) {
      const row = data[j];
      if (nextLap) {
        const timestamp = new Date(row.timestamp).getTime();
        if (lapStartTime <= timestamp && nextLapStartTime! > timestamp) {
          tempData.push(row);
        } else if (nextLapStartTime! <= timestamp) {
          index = j;
          break;
        }
      } else {
        tempData.push(row);
      }
    }

    if (!(laps[i] as any)[lapKey]) {
      (laps[i] as any)[lapKey] = tempData;
    }
  }

  return laps;
}

/**
 * 将圈数据映射到会话（session）中
 * @param inputSessions 输入的会话数据
 * @param laps 圈数据
 * @returns 映射后的会话数据
 */
export function mapDataIntoSession<T extends { start_time: Date | string }>(
  inputSessions: T[], 
  laps: Array<{ start_time: Date | string }>
): T[] {
  const sessions = [...inputSessions];
  let lapIndex = 0;

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const nextSession = sessions[i + 1];
    const tempLaps: any[] = [];
    const sessionStartTime = new Date(session.start_time).getTime();
    const nextSessionStartTime = nextSession ? new Date(nextSession.start_time).getTime() : null;

    for (let j = lapIndex; j < laps.length; j++) {
      const lap = laps[j];
      if (nextSession) {
        const lapStartTime = new Date(lap.start_time).getTime();
        if (sessionStartTime <= lapStartTime && nextSessionStartTime! > lapStartTime) {
          tempLaps.push(lap);
        } else if (nextSessionStartTime! <= lapStartTime) {
          lapIndex = j;
          break;
        }
      } else {
        tempLaps.push(lap);
      }
    }

    if (!(sessions[i] as any).laps) {
      (sessions[i] as any).laps = tempLaps;
    }
  }
  
  return sessions;
}
