// FIT数据格式定义和常量 - TypeScript版本

// 单位转换常量
const metersInOneKilometer = 1000;
const secondsInOneHour = 3600;
const metersInOneMile = 1609.344;
const centiBarsInOneBar = 100;
const psiInOneBar = 14.5037738;

export interface UnitDefinition {
  multiplier: number;
  offset: number;
}

export interface UnitOptions {
  [key: string]: UnitDefinition;
}

export interface FieldDefinition {
  field: string;
  type: string;
  scale: number | null;
  offset: string | number;
  units: string;
}

export interface MessageDefinition {
  name: string;
  [fieldNumber: number]: FieldDefinition;
}

export class FitData {
  static scConst = 180 / Math.pow(2, 31);
  
  static options: { [key: string]: UnitOptions } = {
    speedUnits: {
      'm/s': {
        multiplier: 1,
        offset: 0,
      },
      'mph': {
        multiplier: secondsInOneHour / metersInOneMile,
        offset: 0,
      },
      'km/h': {
        multiplier: secondsInOneHour / metersInOneKilometer,
        offset: 0,
      },
    },
    lengthUnits: {
      'm': {
        multiplier: 1,
        offset: 0,
      },
      'mi': {
        multiplier: 1 / metersInOneMile,
        offset: 0,
      },
      'km': {
        multiplier: 1 / metersInOneKilometer,
        offset: 0,
      },
    },
    temperatureUnits: {
      'celsius': {
        multiplier: 1,
        offset: 0,
      },
      'kelvin': {
        multiplier: 1,
        offset: -273.15,
      },
      'fahrenheit': {
        multiplier: 9/5,
        offset: 32
      }
    },
    pressureUnits: {
      'cbar': {
        multiplier: 1,
        offset: 0,
      },
      'bar': {
        multiplier: 1 / centiBarsInOneBar,
        offset: 0,
      },
      'psi': {
        multiplier: (1 / centiBarsInOneBar) * psiInOneBar,
        offset: 0,
      },
    },
  };

  static messages: { [key: number]: MessageDefinition } = {
    0: {
      name: 'file_id',
      0: { field: 'type', type: 'file', scale: null, offset: '', units: '' },
      1: { field: 'manufacturer', type: 'manufacturer', scale: null, offset: '', units: '' },
      2: { field: 'product', type: 'uint16', scale: null, offset: '', units: '' },
      3: { field: 'serial_number', type: 'uint32z', scale: null, offset: '', units: '' },
      4: { field: 'time_created', type: 'date_time', scale: null, offset: '', units: '' },
      5: { field: 'number', type: 'uint16', scale: null, offset: '', units: '' },
      8: { field: 'product_name', type: 'string', scale: null, offset: '', units: '' },
    },
    1: {
      name: 'capabilities',
      0: { field: 'languages', type: 'uint8z', scale: null, offset: '', units: '' },
      1: { field: 'sports', type: 'sport_bits_0', scale: null, offset: '', units: '' },
      21: { field: 'workouts_supported', type: 'workout_capabilities', scale: null, offset: '', units: '' },
      23: { field: 'connectivity_supported', type: 'connectivity_capabilities', scale: null, offset: '', units: '' },
    },
    2: {
      name: 'device_settings',
      0: { field: 'active_time_zone', type: 'uint8', scale: null, offset: '', units: '' },
      1: { field: 'utc_offset', type: 'uint32', scale: null, offset: '', units: '' },
      2: { field: 'time_offset', type: 'uint32', scale: null, offset: '', units: 's' },
      5: { field: 'time_zone_offset', type: 'sint8', scale: 4, offset: '', units: 'hr' },
      55: { field: 'display_orientation', type: 'display_orientation', scale: null, offset: '', units: '' },
      56: { field: 'mounting_side', type: 'side', scale: null, offset: '', units: '' },
      94: { field: 'number_of_screens', type: 'uint8', scale: null, offset: '', units: '' },
      95: { field: 'smart_notification_display_orientation', type: 'display_orientation', scale: null, offset: '', units: '' },
    },
    // 更多消息定义...
    20: {
      name: 'record',
      253: { field: 'timestamp', type: 'date_time', scale: null, offset: '', units: 's' },
      0: { field: 'position_lat', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      1: { field: 'position_long', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      2: { field: 'altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
      3: { field: 'heart_rate', type: 'uint8', scale: null, offset: '', units: 'bpm' },
      4: { field: 'cadence', type: 'uint8', scale: null, offset: '', units: 'rpm' },
      5: { field: 'distance', type: 'uint32', scale: 100, offset: '', units: 'm' },
      6: { field: 'speed', type: 'uint16', scale: 1000, offset: '', units: 'm/s' },
      7: { field: 'power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      8: { field: 'compressed_speed_distance', type: 'byte', scale: null, offset: '', units: '' },
      9: { field: 'grade', type: 'sint16', scale: 100, offset: '', units: '%' },
      10: { field: 'resistance', type: 'uint8', scale: null, offset: '', units: '' },
      11: { field: 'time_from_course', type: 'sint32', scale: 1000, offset: '', units: 's' },
      12: { field: 'cycle_length', type: 'uint8', scale: 100, offset: '', units: 'm' },
      13: { field: 'temperature', type: 'sint8', scale: null, offset: '', units: 'C' },
      17: { field: 'speed_1s', type: 'uint8', scale: 16, offset: '', units: 'm/s' },
      18: { field: 'cycles', type: 'uint8', scale: null, offset: '', units: 'cycles' },
      19: { field: 'total_cycles', type: 'uint32', scale: null, offset: '', units: 'cycles' },
      28: { field: 'compressed_accumulated_power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      29: { field: 'accumulated_power', type: 'uint32', scale: null, offset: '', units: 'watts' },
      30: { field: 'left_right_balance', type: 'left_right_balance', scale: null, offset: '', units: '' },
      31: { field: 'gps_accuracy', type: 'uint8', scale: null, offset: '', units: 'm' },
      32: { field: 'vertical_speed', type: 'sint16', scale: 1000, offset: '', units: 'm/s' },
      33: { field: 'calories', type: 'uint16', scale: null, offset: '', units: 'kcal' },
      39: { field: 'vertical_oscillation', type: 'uint16', scale: 10, offset: '', units: 'mm' },
      40: { field: 'stance_time_percent', type: 'uint16', scale: 100, offset: '', units: 'percent' },
      41: { field: 'stance_time', type: 'uint16', scale: 10, offset: '', units: 'ms' },
      42: { field: 'activity_type', type: 'activity_type', scale: null, offset: '', units: '' },
      43: { field: 'left_torque_effectiveness', type: 'uint8', scale: 2, offset: '', units: 'percent' },
      44: { field: 'right_torque_effectiveness', type: 'uint8', scale: 2, offset: '', units: 'percent' },
      45: { field: 'left_pedal_smoothness', type: 'uint8', scale: 2, offset: '', units: 'percent' },
      46: { field: 'right_pedal_smoothness', type: 'uint8', scale: 2, offset: '', units: 'percent' },
      47: { field: 'combined_pedal_smoothness', type: 'uint8', scale: 2, offset: '', units: 'percent' },
      48: { field: 'time128', type: 'uint8', scale: 128, offset: '', units: 's' },
      49: { field: 'stroke_type', type: 'stroke_type', scale: null, offset: '', units: '' },
      50: { field: 'zone', type: 'uint8', scale: null, offset: '', units: '' },
      51: { field: 'ball_speed', type: 'uint16', scale: 100, offset: '', units: 'm/s' },
      52: { field: 'cadence256', type: 'uint16', scale: 256, offset: '', units: 'rpm' },
      53: { field: 'fractional_cadence', type: 'uint8', scale: 128, offset: '', units: 'rpm' },
      54: { field: 'total_hemoglobin_conc', type: 'uint16', scale: 100, offset: '', units: 'g/dL' },
      55: { field: 'total_hemoglobin_conc_min', type: 'uint16', scale: 100, offset: '', units: 'g/dL' },
      56: { field: 'total_hemoglobin_conc_max', type: 'uint16', scale: 100, offset: '', units: 'g/dL' },
      57: { field: 'saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: '', units: '%' },
      58: { field: 'saturated_hemoglobin_percent_min', type: 'uint16', scale: 10, offset: '', units: '%' },
      59: { field: 'saturated_hemoglobin_percent_max', type: 'uint16', scale: 10, offset: '', units: '%' },
    },
    19: {
      name: 'lap',
      254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
      253: { field: 'timestamp', type: 'date_time', scale: null, offset: '', units: 's' },
      0: { field: 'event', type: 'event', scale: null, offset: '', units: '' },
      1: { field: 'event_type', type: 'event_type', scale: null, offset: '', units: '' },
      2: { field: 'start_time', type: 'date_time', scale: null, offset: '', units: '' },
      3: { field: 'start_position_lat', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      4: { field: 'start_position_long', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      5: { field: 'end_position_lat', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      6: { field: 'end_position_long', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      7: { field: 'total_elapsed_time', type: 'uint32', scale: 1000, offset: '', units: 's' },
      8: { field: 'total_timer_time', type: 'uint32', scale: 1000, offset: '', units: 's' },
      9: { field: 'total_distance', type: 'uint32', scale: 100, offset: '', units: 'm' },
      10: { field: 'total_cycles', type: 'uint32', scale: null, offset: '', units: 'cycles' },
      11: { field: 'total_calories', type: 'uint16', scale: null, offset: '', units: 'kcal' },
      12: { field: 'total_fat_calories', type: 'uint16', scale: null, offset: '', units: 'kcal' },
      13: { field: 'avg_speed', type: 'uint16', scale: 1000, offset: '', units: 'm/s' },
      14: { field: 'max_speed', type: 'uint16', scale: 1000, offset: '', units: 'm/s' },
      15: { field: 'avg_heart_rate', type: 'uint8', scale: null, offset: '', units: 'bpm' },
      16: { field: 'max_heart_rate', type: 'uint8', scale: null, offset: '', units: 'bpm' },
      17: { field: 'avg_cadence', type: 'uint8', scale: null, offset: '', units: 'rpm' },
      18: { field: 'max_cadence', type: 'uint8', scale: null, offset: '', units: 'rpm' },
      19: { field: 'avg_power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      20: { field: 'max_power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      21: { field: 'total_ascent', type: 'uint16', scale: null, offset: '', units: 'm' },
      22: { field: 'total_descent', type: 'uint16', scale: null, offset: '', units: 'm' },
      23: { field: 'intensity', type: 'intensity', scale: null, offset: '', units: '' },
      24: { field: 'lap_trigger', type: 'lap_trigger', scale: null, offset: '', units: '' },
      25: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
      26: { field: 'event_group', type: 'uint8', scale: null, offset: '', units: '' },
    },
    18: {
      name: 'session',
      254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
      253: { field: 'timestamp', type: 'date_time', scale: null, offset: '', units: 's' },
      0: { field: 'event', type: 'event', scale: null, offset: '', units: '' },
      1: { field: 'event_type', type: 'event_type', scale: null, offset: '', units: '' },
      2: { field: 'start_time', type: 'date_time', scale: null, offset: '', units: '' },
      3: { field: 'start_position_lat', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      4: { field: 'start_position_long', type: 'sint32', scale: null, offset: '', units: 'semicircles' },
      5: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
      6: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: '', units: '' },
      7: { field: 'total_elapsed_time', type: 'uint32', scale: 1000, offset: '', units: 's' },
      8: { field: 'total_timer_time', type: 'uint32', scale: 1000, offset: '', units: 's' },
      9: { field: 'total_distance', type: 'uint32', scale: 100, offset: '', units: 'm' },
      10: { field: 'total_cycles', type: 'uint32', scale: null, offset: '', units: 'cycles' },
      11: { field: 'total_calories', type: 'uint16', scale: null, offset: '', units: 'kcal' },
      12: { field: 'total_fat_calories', type: 'uint16', scale: null, offset: '', units: 'kcal' },
      13: { field: 'avg_speed', type: 'uint16', scale: 1000, offset: '', units: 'm/s' },
      14: { field: 'max_speed', type: 'uint16', scale: 1000, offset: '', units: 'm/s' },
      15: { field: 'avg_heart_rate', type: 'uint8', scale: null, offset: '', units: 'bpm' },
      16: { field: 'max_heart_rate', type: 'uint8', scale: null, offset: '', units: 'bpm' },
      17: { field: 'avg_cadence', type: 'uint8', scale: null, offset: '', units: 'rpm' },
      18: { field: 'max_cadence', type: 'uint8', scale: null, offset: '', units: 'rpm' },
      19: { field: 'avg_power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      20: { field: 'max_power', type: 'uint16', scale: null, offset: '', units: 'watts' },
      21: { field: 'total_ascent', type: 'uint16', scale: null, offset: '', units: 'm' },
      22: { field: 'total_descent', type: 'uint16', scale: null, offset: '', units: 'm' },
      23: { field: 'total_training_effect', type: 'uint8', scale: 10, offset: '', units: '' },
      24: { field: 'first_lap_index', type: 'uint16', scale: null, offset: '', units: '' },
      25: { field: 'num_laps', type: 'uint16', scale: null, offset: '', units: '' },
      26: { field: 'event_group', type: 'uint8', scale: null, offset: '', units: '' },
    }
  };

  static types: { [key: string]: any } = {
    fit_base_type: {
      0: 'enum',
      1: 'sint8', 
      2: 'uint8',
      3: 'sint16',
      4: 'uint16',
      5: 'sint32',
      6: 'uint32',
      7: 'string',
      8: 'float32',
      9: 'float64',
      10: 'uint8z',
      11: 'uint16z',
      12: 'uint32z',
      13: 'byte',
      14: 'sint64',
      15: 'uint64',
      16: 'uint64z'
    },
    file: {
      1: 'device',
      2: 'settings',
      3: 'sport',
      4: 'activity',
      5: 'workout',
      6: 'course',
      7: 'schedules',
      9: 'weight',
      10: 'totals',
      11: 'goals',
      14: 'blood_pressure',
      15: 'monitoring_a',
      20: 'activity_summary',
      28: 'monitoring_daily'
    },
    manufacturer: {
      1: 'garmin',
      2: 'garmin_fr405_antfs',
      3: 'zephyr',
      4: 'dayton',
      5: 'idt',
      6: 'srm',
      7: 'quarq',
      8: 'ibike',
      9: 'saris',
      10: 'spark_hk',
      11: 'tanita',
      12: 'echowell',
      13: 'dynastream_oem',
      14: 'nautilus',
      15: 'dynastream',
      16: 'timex',
      17: 'metrigear',
      18: 'xelic',
      19: 'beurer',
      20: 'cardiosport',
      21: 'a_and_d',
      22: 'hmm',
      23: 'suunto',
      24: 'thita_elektronik',
      25: 'gpulse',
      26: 'clean_mobile',
      27: 'pedal_brain',
      28: 'peaksware',
      29: 'saxonar',
      30: 'lemond_fitness',
      31: 'dexcom',
      32: 'wahoo_fitness',
      33: 'octane_fitness',
      34: 'archinoetics',
      35: 'the_hurt_box',
      36: 'citizen_systems',
      37: 'magellan',
      38: 'osynce',
      39: 'holux',
      40: 'concept2',
      42: 'one_giant_leap',
      43: 'ace_sensor',
      44: 'brim_brothers',
      45: 'xplova',
      46: 'perception_digital',
      47: 'bf1systems',
      48: 'pioneer',
      49: 'spantec',
      50: 'metalogics',
      51: '4iiiis',
      52: 'seiko_epson',
      53: 'seiko_epson_oem',
      54: 'ifor_powell',
      55: 'maxwell_guider',
      56: 'star_trac',
      57: 'breakaway',
      58: 'alatech_technology_ltd',
      59: 'mio_technology_europe',
      60: 'rotor',
      61: 'geonaute',
      62: 'id_bike',
      63: 'specialized',
      64: 'wtek',
      65: 'physical_enterprises',
      66: 'north_pole_engineering',
      67: 'bkool',
      68: 'cateye',
      69: 'stages_cycling',
      70: 'sigmasport',
      71: 'tomtom',
      72: 'peripedal',
      73: 'wattbike',
      76: 'moxy',
      77: 'ciclosport',
      78: 'powerbahn',
      79: 'acorn_projects_aps',
      80: 'lifebeam',
      81: 'bontrager',
      82: 'wellgo',
      83: 'scosche',
      84: 'magura',
      85: 'woodway',
      86: 'elite',
      87: 'nielsen_kellerman',
      88: 'dk_city',
      89: 'tacx',
      90: 'direction_technology',
      91: 'magtonic',
      92: '1partcarbon',
      93: 'inside_ride_technologies',
      94: 'sound_of_motion',
      95: 'stryd',
      96: 'icg',
      97: 'MiPulse',
      98: 'bsx_athletics',
      99: 'look',
      100: 'campagnolo_srl',
      101: 'body_bike_smart',
      102: 'praxisworks',
      103: 'limits_technology',
      104: 'topaction_technology',
      105: 'cosinuss',
      106: 'fitcare',
      107: 'magene',
      108: 'giant_manufacturing_co',
      109: 'tigrasport',
      110: 'salutron',
      111: 'technogym',
      112: 'bryton_sensors',
      113: 'latitude_limited',
      114: 'soaring_technology',
      115: 'igpsport',
      116: 'thinkrider',
      117: 'gopher_sport',
      118: 'waterrower',
      119: 'orangetheory',
      120: 'inpeak',
      121: 'kinetic_by_kurt',
      122: 'healthandlife',
      123: 'lomo',
      124: 'sensitivus_gauge',
      125: 'cycplus',
      126: 'gravaa',
      127: 'virtual_training',
      128: 'heartcity',
      255: 'development'
    }
  };

  /**
   * 根据消息编号获取消息名称
   * @param messageNum 消息编号
   * @returns 消息名称
   */
  static getMessageName(messageNum: number): string {
    return this.messages[messageNum]?.name || 'unknown';
  }

  /**
   * 根据字段编号和消息编号获取字段对象
   * @param fieldNum 字段编号
   * @param messageNum 消息编号
   * @returns 字段对象
   */
  static getFieldObject(fieldNum: number, messageNum: number): FieldDefinition {
    const message = this.messages[messageNum];
    if (!message) {
      return { field: 'unknown', type: 'unknown', scale: null, offset: '', units: '' };
    }
    
    return message[fieldNum] || { field: 'unknown', type: 'unknown', scale: null, offset: '', units: '' };
  }
}
