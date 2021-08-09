/**
 * Moving Average
 *
 */
export function ma(close: number[], n = 5) {
  let result: number[] = [];
  let len = close.length;
  if (len === 0 || n <= 0) {
    return result;
  }
  let avg = close[0];
  result.push(avg);
  for (let i = 1; i < len; i++) {
    if (i < n) {
      let sum = close[0];
      for (let j = 1; j <= i; j++) {
        sum += close[j];
      }
      avg = sum / (i + 1);
    } else {
      avg += (close[i] - close[i - n]) / n;
    }
    result.push(avg);
  }
  return result;
}

/**
 * Weighted moving average
 *
 */
export function wma(close: number[], n = 5) {
  let result: number[] = [];
  let len = close.length;
  if (len === 0 || n <= 0) {
    return result;
  }
  let avg = close[0];
  result.push(avg);

  let T_m = close[0];
  let div = (n * (n + 1)) / 2;
  for (let i = 1; i < len; i++) {
    if (i < n) {
      T_m += close[i];
      let sum = 0;
      let d = 0;
      for (let j = 0; j <= i; j++) {
        sum += close[i - j] * (n - j);
        d += n - j;
      }
      avg = sum / d;
    } else {
      avg += (n * close[i] - T_m) / div;
      T_m += close[i] - close[i - n];
    }
    result.push(avg);
  }
  return result;
}
/**
 * Exponential moving average
 *
 * alpha = 2 / (N + 1)
 */
export function ema(close: number[], n = 5) {
  let len = close.length;
  let result: number[] = [];
  if (len === 0 || n <= 0) {
    return result;
  }
  let alpha = 2 / (n + 1);
  let avg = close[0];
  result.push(avg);
  for (let i = 1; i < len; i++) {
    avg = alpha * close[i] + (1 - alpha) * avg;
    result.push(avg);
  }
  return result;
}

export function macd(close: number[], fast = 10, slow = 22, mid = 7) {
  let len = close.length;
  let dif: number[] = [];
  let bar: number[] = [];
  let dea: number[] = [];
  if (len === 0) {
    return { dif, dea, bar };
  }
  let f = ema(close, fast);
  let s = ema(close, slow);
  for (let i = 0; i < len; i++) {
    dif.push(f[i] - s[i]);
  }

  dea = ema(dif, mid);
  for (let i = 0; i < len; i++) {
    bar.push((dif[i] - dea[i]) * 2);
  }
  return { dif, dea, bar };
}

/**
 * Bollinger Bands
 *
 *
 */
export function boll(close: number[], n = 20) {
  let mb: number[] = [];
  let up: number[] = [];
  let bn: number[] = [];
  let len = close.length;
  if (len === 0) {
    return { mb, up, bn };
  }
  mb = ma(close, n);
  up.push(mb[0]);
  bn.push(mb[0]);
  for (let i = 1; i < len; i++) {
    let sum = 0;
    for (let j = i; j > -1 && j > i - n; j--) {
      sum += Math.pow(close[j] - mb[i], 2);
    }
    let sd = Math.sqrt(sum / Math.min(i + 1, n));
    up.push(mb[i] + 2 * sd);
    bn.push(mb[i] - 2 * sd);
  }

  return { mb, up, bn };
}

/**
 * KDJ
 * close should have
 *
 */

export function kdj(close: number[], high: number[], low: number[], n = 5) {
  let len = close.length;
  let k: number[] = [];
  let d: number[] = [];
  let j: number[] = [];
  if (len === 0 || n <= 0) {
    return { k, d, j };
  }
  let ik = 50;
  let id = 50;
  let ij = 50;
  let rsv = ((close[0] - low[0]) * 100) / (high[0] - low[0]);
  ik = (2 * ik) / 3 + rsv / 3;
  id = (2 * id) / 3 + ik / 3;
  ij = 3 * ik - 2 * id;
  k.push(ik);
  d.push(id);
  j.push(ij);

  let ln = low[0];
  let hn = high[0];
  for (let i = 1; i < len; i++) {
    if (i < n) {
      if (ln > low[i]) {
        ln = low[i];
      }
      if (hn < high[i]) {
        hn = high[i];
      }
    } else {
      if (ln === low[i - n]) {
        ln = low[i];
        for (let j = 1; j < n; j++) {
          if (low[i - j] < ln) {
            ln = low[i - j];
          }
        }
      } else {
        if (ln > low[i]) {
          ln = low[i];
        }
      }

      if (hn === high[i - n]) {
        hn = high[i];
        for (let j = 1; j < n; j++) {
          if (high[i - j] > hn) {
            hn = high[i - j];
          }
        }
      } else {
        if (hn < high[i]) {
          hn = high[i];
        }
      }
    }
    rsv = ((close[i] - ln) * 100) / (hn - ln);
    ik = (2 * ik) / 3 + rsv / 3;
    id = (2 * id) / 3 + ik / 3;
    ij = 3 * ik - 2 * id;
    k.push(ik);
    d.push(id);
    j.push(ij);
  }
  return { k, d, j };
}
