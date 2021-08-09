import { map, takeRight, last } from 'lodash';

//取小数
const qxs = (number: number, num: number) =>
  Number(String(number).replace(new RegExp(`^(.*\\..{${num}}).*$`), '$1'));

// 转向，用于判断数据大小趋势变化的点，返回这个点在数组中的下标
export const trendUp = (arr: number[], xs = 2) => {
  arr = map(arr, o => qxs(o, xs));

  let first = true;
  let pre = false;
  let deep = 0;
  for (let i = arr.length - 1; i > 1; i--) {
    if (first) {
      pre = arr[i] > arr[i - 1];
      first = false;
    } else {
      const cur = arr[i] > arr[i - 1];
      if (cur === !pre) {
        deep = arr.length - i;
        break;
      }
    }
  }
  return { isUp: pre, deep };
};

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
