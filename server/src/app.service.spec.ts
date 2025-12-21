import { AppService } from './app.service';

describe('AppService', () => {
	let appService: AppService;

	beforeEach(() => {
		appService = new AppService();
	});

	test('should return expected value', () => {
		expect(appService.getHello()).toBe('POS System Backend is running!');
	});
});