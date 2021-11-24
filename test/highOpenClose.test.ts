import { klineData } from '@iii8iii/dfcfbot/dist/types';
import { highClose, highOpen } from '../src/index';
describe('highClose', () => {
  const highOpenData = {
    close: [1, 2, 3, 4],
    open: [2, 3, 4, 5],
    low: [1, 2, 3, 4],
  };
  const highCloseData = {
    close: [4, 4, 4, 4],
    high: [5, 5, 5, 5],
    low: [1, 1, 1, 1],
  };
  it('highOpen', () => {
    expect(highOpen(highOpenData as klineData)).toBeTruthy();
  });
  it('highClose', () => {
    expect(highClose(highCloseData as klineData)).toBeTruthy();
  });
});
