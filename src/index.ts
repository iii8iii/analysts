import { trendUp, cross, above } from './utils/helper';
import { macd, boll, kdj, ma } from './utils/jstock';
import { klineData } from '@iii8iii/dfcfbot/dist/types';
import { takeRight } from 'lodash';
import { fangxiang } from './types';

/**
 * 获取MACD值的变化趋势，可以在trend中设置方向UP或是DOWN
 * @param {klineData} data 传入的数据本身的周期决定了你分析的是哪个周期的MACD趋势
 * @param {fangxiang} [trend='UP']
 * @param {number} [dp=3] 最终趋势连续最小次数
 * @return {*}  {boolean}
 */
export function macdTrend(
  data: klineData,
  trend: fangxiang = 'UP',
  dp: number = 1
): boolean {
  let { close } = data;
  close = takeRight(close, 300);
  const { bar } = macd(close, 12, 26, 9);
  const { isUp, deep } = trendUp(bar);
  const up = isUp && deep >= dp;

  switch (trend) {
    case 'DOWN':
      return !up;
    default:
      return up;
  }
}

/**
 * kdj 死叉后J线开始上挑, 金叉后5个单元以内被认为是上升
 * @param {klineData} data
 * @param {fangxiang} [trend='UP']
 * @return {*}  {boolean}
 */
export function kdjTrend(data: klineData, trend: fangxiang = 'UP'): boolean {
  let { close, high, low } = data;
  close = takeRight(close, 300);
  high = takeRight(high, 300);
  low = takeRight(low, 300);

  const { k, d, j } = kdj(close, high, low, 9);
  const df = cross(j, d, false);
  const gf = cross(j, d, true);
  const jUp = trendUp(j).isUp;
  const jDeep = trendUp(j).deep;
  const kUp = trendUp(k).isUp;

  //死叉之后K线和J线都表现为向上或金叉后到J线向下之前
  const up = (gf && jUp && jDeep < 5) || (df && kUp && jUp);
  //金叉后J线开始向下或死叉后J线未向上
  const down = !jUp;
  switch (trend) {
    case 'DOWN':
      return down;
    default:
      return up;
  }
}

/**
 * 布林线的中间值连线上升大于5个单元并且上下张的开口在扩大则认为会上升
 * @param {klineData} data
 * @param {fangxiang} [trend='UP']
 * @param {number} [dp=4] 中线连续上升的次数
 * @return {*}  {boolean}
 */
export function bollTrend(
  data: klineData,
  trend: fangxiang = 'UP',
  dp: number = 2
): boolean {
  let { close } = data;
  close = takeRight(close, 300);
  const { mb, up, bn } = boll(close, 20); //{中，高，低}
  // 计算上下边界的距离，因为都是大的减小的所以不需要求绝对值，通过趋势函数判断距离是不是越来越大，如果是则说明目前的形式会继续
  let upToBn = [];
  for (let i = 0; i < close.length; i++) {
    upToBn.push(up[i] - bn[i]);
  }
  const isExpand = trendUp(upToBn).isUp;
  // 中值大体上就是股票目前的涨势，通过中线来判断目前是否在涨
  const { isUp, deep } = trendUp(mb);
  // 是否在涨而且会继续涨
  const wilUp = isUp && deep >= dp && isExpand;
  switch (trend) {
    case 'DOWN':
      return !wilUp;
    default:
      return wilUp;
  }
}

/**
 * 用于长周期MA做趋势分析，要求MA趋势向上，并且aboveZq内最低价不得穿过无线
 * @param {klineData} data
 * @param {number} [mazq=50]
 * @param {number} [aboveZq=9]
 * @return {*}  {boolean}
 */
export function maTrendUp(
  data: klineData,
  mazq: number = 50,
  aboveZq: number = 9
): boolean {
  let { close, low } = data;
  let maArr = ma(close, mazq);
  const { isUp, deep } = trendUp(maArr);
  const ifUp = isUp && deep > 3;
  if (ifUp) {
    low = takeRight(low, aboveZq);
    maArr = takeRight(maArr, aboveZq);
    return above(low, maArr);
  } else {
    return false;
  }
}

/**
 * 三高，更高的高点，低点，收盘
 * @param {klineData} data
 * @return {*}  {boolean}
 */
export function threeHigh(data: klineData): boolean {
  let { high, low, close } = data;
  high = takeRight(high, 4);
  low = takeRight(low, 4);
  close = takeRight(close, 4);
  const { isUp, deep } = trendUp(high);
  if (isUp && deep >= 3) {
    const { isUp, deep } = trendUp(low);
    if (isUp && deep >= 3) {
      const { isUp, deep } = trendUp(close);
      if (isUp && deep >= 3) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 缩量，判断成交量趋势
 * @param {klineData} data
 * @return {*}  {boolean}
 */
export function suoliang(data: klineData): boolean {
  const { cjl } = data;
  const maCjl = ma(cjl, 5);
  return !trendUp(maCjl).isUp;
}

/**
 * 高开，当日开盘价高于上一交易日收盘价
 * @param {klineData} data
 * @return {*} {boolean}
 */
export function highOpen(data: klineData): boolean {
  const { open, close } = data;
  const todayOpen = takeRight(open, 1)[0];
  const lastClose = takeRight(close, 2)[0];
  return todayOpen > lastClose;
}


/**
 * 收高，最高与收盘之间的距离小于最高到最低之间距离的一半
 * @param {klineData} data
 * @param {number} [fazhi=2.15] 用于调节比例，如3则最高到收盘的距离是最高到最低距离的三分之一，数字越大表示收盘越接近最高点
 * @param {number} [dayFromToday=1]
 * @return {*}  {boolean}
 */
export function highClose(data: klineData, fazhi: number = 2.15, dayFromToday: number = 1): boolean {
  const { high, low, close } = data;
  const h = takeRight(high, dayFromToday)[0];
  const l = takeRight(low, dayFromToday)[0];
  const c = takeRight(close, dayFromToday)[0];
  const h2c = Math.abs(h - c);
  const h2l = Math.abs(h - l);
  return h2c < h2l / fazhi;
}
