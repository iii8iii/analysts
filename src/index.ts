import { trendUp, cross, above } from './utils/helper';
import { macd, boll, kdj, ma } from './utils/jstock';
import { klineData } from '@iii8iii/dfcfbot/dist/types';
import { takeRight, last } from 'lodash';
import { fangxiang } from './types';

/**
 * 获取MACD值的变化趋势，可以在trend中设置方向UP或是DOWN
 * 将最近300个单元找到最价比当前最高价稍高的点，根据这些点的前后顺序把序列分割成若干个子序列
 * 求出每个序列的MACD，并判断其趋势
 * 如果最后一个序列（当前）的趋势是向上，则尝试用当前的MACD值去减去临近的趋势相同的上一个序列的MADCD值，如果当前MACD值更大则为上升
 * 其他一切情况都判断为下降
 * @param {klineData} data 传入的数据本身的周期决定了你分析的是哪个周期的MACD趋势
 * @param {fangxiang} [trend='UP']
 * @return {*}  {boolean}
 */
export function macdTrend(data: klineData, trend: fangxiang = 'UP'): boolean {
  let { close, high } = data;
  close = takeRight(close, 300);
  high = takeRight(high, 300);

  const highNow = last(high) as number;
  // 获取与当前高点接近，略高于目前高点的点
  const highEqNow: number[][] = [];
  high.forEach((h, i) => {
    const ifHighEqNow = h >= highNow && h - highNow < highNow * 0.0025;
    if (ifHighEqNow) {
      highEqNow.push(close.slice(0, i));
    }
  });

  // 求出这些点收盘价的macd,其中最后一个是当前的macd(bar)
  let barTends: { m: number; up: boolean; deep: number }[] = [];
  highEqNow.forEach(v => {
    const { bar } = macd(v, 12, 26, 9);
    const m = Number(last(bar));
    const { isUp, deep } = trendUp(bar);
    barTends.push({ m, up: isUp, deep }); //m是对应数组的macd,up是对应的趋势,deep是趋势持续时间
  });

  // 当前的macd趋势
  let up = last(barTends)?.up && (last(barTends)?.deep as number) > 3;
  // 如果当前趋势为上升且获取的同高点多于1个则找出离当前位置最近且趋势也是上升的高点，取出其macd与当前macd比较，如果当前的比较大，则为真否则为假
  if (up) {
    if (barTends.length > 1) {
      for (let i = barTends.length - 2; i > 0; i--) {
        if (barTends[i].up) {
          up = barTends[i].m - barTends[barTends.length - 1].m < 0;
          break;
        }
      }
    }
  }
  switch (trend) {
    case 'DOWN':
      return !up;
    default:
      return !!up;
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
  const down = (df && !jUp) || (gf && !jUp);

  switch (trend) {
    case 'DOWN':
      return down;
    default:
      return up;
  }
}

/**
 * 布木线的中间值连线上升大于5个单元并且上下张的开口在扩大则认为会上升
 * @param {klineData} data
 * @param {fangxiang} [trend='UP']
 * @return {*}  {boolean}
 */
export function bollTrend(data: klineData, trend: fangxiang = 'UP'): boolean {
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
  const wilUp = isUp && deep > 4 && isExpand;
  switch (trend) {
    case 'DOWN':
      return !wilUp;
    default:
      return wilUp;
  }
}

/**
 * 以长期无线来判断大体趋势，以忽略价格波动对趋势的判断
 * 默认50个单位（5分钟/日/周/月，取决于传入的数据）均线判断股票是否在上升趋势，且60个单位内最低价位于无线上方
 * @param {klineData} data
 * @param {number} [zq=50]
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
