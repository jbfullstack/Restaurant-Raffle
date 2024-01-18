import { HttpStatus, Injectable, Res } from '@nestjs/common';
import { UsersMemoryStorage } from './users-memory-storage/users-memory.storage';
import { parseSecondsToHMS } from './utils/parser';

@Injectable()
export class AppService {
  MAX_RNG_VALUE: number = 4;

  constructor(private readonly userMemoryStorage: UsersMemoryStorage) {}

  getHello(): string {
    return `Hello !`;
  }

  async turnTheWheel(ip: string): Promise<WheelResponse> {
    if (await this.userMemoryStorage.validate(ip)) {
      const randomNumber = Math.floor(Math.random() * this.MAX_RNG_VALUE);
      return {
        generatedNumber: randomNumber,
        message: 'Success',
        status: HttpStatus.OK,
      };
    } else {
      return {
        generatedNumber: -1,
        message: `User will be allowed in ${parseSecondsToHMS(
          await this.userMemoryStorage.timeUntilNextPlay(ip),
        )}s`,
        status: HttpStatus.TOO_MANY_REQUESTS,
      };
    }
  }
}
