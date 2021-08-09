import { fangxiang } from '../types';
import { klineData } from '@iii8iii/dfcfbot';
import { trendUp, cross, above } from './helper';
import { last, takeRight } from 'lodash';
import { ma, macd, kdj, boll } from './jstock';

// 指标检测
export const macdTrend = (
  data: klineData,
  trend: fangxiang = 'UP'
): boolean => {
  //只取一段，减少运算量
  let { close, high } = data;
  close = takeRight(close, 300);
  high = takeRight(high, 300);
  //获取当前高点
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
    const { up, deep } = trendUp(bar);
    barTends.push({ m, up, deep }); //m是对应数组的macd，t是对应的趋势
  });
  // 当前的macd趋势
  let up = last(barTends)?.up && (last(barTends)?.deep as number) > 3;
  // 如果当前趋势为上升且获取的同高点多于1个则找出离当前位置最近且趋势也是上升的高点，取出其macd与当前macd比较，如果当前的比较大，则为真否则为假
  if (up) {
    if (barTends.length > 1) {
      for (let i = barTends.length - 2; i >= 0; i--) {
        if (barTends[i].up) {
          up = barTends[i].m - barTends[barTends.length - 1].m < 0;
          break;
        }
      }
    }
  }
  // console.log(up);
  switch (trend) {
    case 'DOWN':
      return !up;
    // break;
    default:
      return !!up;
    // break;
  }
};

export const kdjTrend = (data: klineData, trend: fangxiang = 'UP'): boolean => {
  let { close, high, low } = data;
  close = takeRight(close, 300);
  high = takeRight(high, 300);
  low = takeRight(low, 300);

  const { k, d, j } = kdj(close, high, low, 9);
  const df = cross(j, d, false);
  const gf = cross(j, d, true);
  const jUp = trendUp(j).up;
  const kUp = trendUp(k).up;

  //死叉之后K线和J线都表现为向上或金叉后到J线向下之前
  const up = (gf && jUp) || (df && kUp && jUp);
  //金叉后J线开始向下或死叉后J线未向上
  const down = (df && !jUp) || (gf && !jUp);

  switch (trend) {
    case 'DOWN':
      return down;
    // break;
    default:
      return up;
    // break;
  }
};

export const bollTrend = (
  data: klineData,
  trend: fangxiang = 'UP'
): boolean => {
  let { close } = data;
  close = takeRight(close, 300);

  const { mb, up, bn } = boll(close, 20); //{中，高，低}
  // 计算上下边界的距离，因为都是大的减小的所以不需要求绝对值，通过趋势函数判断距离是不是越来越大，如果是则说明目前的形式会继续
  let upToBn = [];
  for (let i = 0; i < close.length; i++) {
    upToBn.push(up[i] - bn[i]);
  }
  const isExpand = trendUp(upToBn).up;
  // 中值大体上就是股票目前的涨势，通过中线来判断目前是否在涨
  const isUp = trendUp(mb).up;
  // 是否在涨而且会继续涨
  const wilUp = isUp && isExpand;
  switch (trend) {
    case 'DOWN':
      return !wilUp;
    // break;
    default:
      return wilUp;
    // break;
  }
};

//以长期无线来判断大体趋势，以忽略价格波动对趋势的判断
//默认50个单位（5分钟/日/周/月，取决于传入的数据）均线判断股票是否在上升趋势，且60个单位内最低价位于无线上方
export function maTrendUp(data: klineData, zq: number = 50): boolean {
  let { close, low } = data;
  let maArr = ma(close, zq);
  const { up, deep } = trendUp(maArr);
  const ifUp = up && deep > 3;
  if (ifUp) {
    low = takeRight(low, 25);
    maArr = takeRight(maArr, 25);
    return above(low, maArr);
  } else {
    return false;
  }
}
