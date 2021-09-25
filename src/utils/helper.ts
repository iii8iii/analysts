import { map, takeRight, last } from 'lodash';

/**
 * 取小数，不做四舍五入之类的处理
 * @param {number} number 要处理的数据
 * @param {number} num 小数位数
 */
const qxs = (number: number, num: number) =>
  Number(String(number).replace(new RegExp(`^(.*\\..{${num}}).*$`), '$1'));


/**
 * 趋势判断，将数组最后一位与第倒数第二位相减得出一个趋势，连续进行循环操作，直到趋势反转就停止
 * @param {number[]} arr 要判断的数组
 * @param {number} [xs=3] 对数组内容做取小数处理以忽略一些细微的变动
 * @return {*}  {{ isUp: boolean, deep: number, }} 趋势是否向上，以及这个趋势的连续次数
 */
export function trendUp(arr: number[], xs = 3): { isUp: boolean, deep: number, } {
  arr = map(arr, o => qxs(o, xs));

  let first = true;
  let pre = false;
  let deep = 0;
  for (let i = arr.length - 1; i > 0; i--) {
    if (first) {
      pre = arr[i] > arr[i - 1];
      deep = 1;
      first = false;
    } else {
      const cur = arr[i] > arr[i - 1];
      if (cur === !pre) {
        break;
      }
      deep = deep + 1;
    }
  }
  return { isUp: pre, deep };
};


/**
 * 确认两条线是否有交点，从右向左查询，直到查询到一个交点就停止。在没有upwards时只判断有没有交点，有upwards时要有交点且方向与upwards相同才为真
 * @param {number[]} lineA 线A
 * @param {number[]} lineB 线B
 * @param {boolean} [upwards] 是否A线从下向上穿过B线
 * @return {*}  {boolean}
 */
export function cross(
  lineA: number[],
  lineB: number[],
  upwards?: boolean
): boolean {
  const aLength = lineA.length;
  const bLength = lineB.length;
  if (!aLength || !bLength) {
    return false;
  }
  const length = aLength > bLength ? bLength : aLength;

  lineA = takeRight(lineA, length);
  lineB = takeRight(lineB, length);

  let first = true;
  let pre = false;
  let ifCross = false;
  for (let i = length - 1; i > 0; i--) {
    if (first) {
      pre = lineA[i] > lineB[i];
      first = false;
    } else {
      const cur = lineA[i] > lineB[i];
      if (!pre === cur) {
        ifCross = true;
        break;
      }
    }
  }

  if (ifCross) {
    if (typeof upwards != 'undefined') {
      return upwards === pre;
    }
    return true;
  } else {
    return false;
  }
}


/**
 * 判断A是不是在B的上面，如果有交点就返回否，没有交点就判断A的最后一个值是不是大于B的最后一个值
 * @param {number[]} lineA
 * @param {number[]} lineB
 * @return {*}  {boolean}
 */
export function above(lineA: number[], lineB: number[]): boolean {
  if (!lineA.length || !lineB.length) {
    return false;
  }
  const ifCross = cross(lineA, lineB);
  if (ifCross) {
    return false;
  } else {
    const lastA = last(lineA) || 0;
    const lastB = last(lineB) || 0;
    return lastA > lastB;
  }
}
