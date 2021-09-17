import { trendUp } from "../src/utils/helper";
describe('analysts', () => {
  it('up', async () => {
    const data = [1, 2, 3, 4, 5, 6];
    expect(trendUp(data).isUp).toBeTruthy();
    expect(trendUp(data).deep).toBe(5);
  });
  it('up with donw in middle', async () => {
    const data = [1, 2, 3, 2, 5, 6];
    expect(trendUp(data).isUp).toBeTruthy();
    expect(trendUp(data).deep).toBe(2);
  });
  it('down', async () => {
    const data = [6, 5, 4, 3, 2, 1];
    expect(trendUp(data).isUp).toBeFalsy();
  });
  it('down with up in middle', async () => {
    const data = [6, 5, 6, 3, 2, 1];
    expect(trendUp(data).isUp).toBeFalsy();
    expect(trendUp(data).deep).toBe(3);
  });
});