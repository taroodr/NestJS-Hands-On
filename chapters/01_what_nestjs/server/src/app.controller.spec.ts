import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService, User } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    appService = new AppService();
    appController = new AppController(appService);
  });

  describe('root', () => {
    it('should return users', () => {
      jest.spyOn(appService, 'getUsers').mockImplementation(() => {
        const user: User = {
          id: 1,
          name: 'Mock Name',
          mail: 'Mock Email',
        };
        return [user];
      });
      expect(appController.getUsers()).toHaveLength(1);
    });
  });
});
