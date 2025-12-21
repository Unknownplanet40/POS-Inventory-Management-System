const { sum, multiply } = require('./utils');

test('sum adds two numbers', () => {
	expect(sum(1, 2)).toBe(3);
	expect(sum(-1, 1)).toBe(0);
});

test('multiply multiplies two numbers', () => {
	expect(multiply(2, 3)).toBe(6);
	expect(multiply(-1, 1)).toBe(-1);
});