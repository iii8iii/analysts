import { qxs } from '../src/utils/helper';
describe('qsx', () => {
  it('0', () => {
    expect(qxs(10.213, 0)).toBe(10);
  });
  it('2', () => {
    expect(qxs(10.213, 2)).toBe(10.21);
  });
  it('3', () => {
    expect(qxs(10.21, 3)).toBe(10.21);
  });
});
