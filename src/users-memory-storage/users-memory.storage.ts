import { Injectable } from '@nestjs/common';
import { VercelKV, createClient } from '@vercel/kv';

@Injectable()
export class UsersMemoryStorage {
  private static readonly FOUR_HOURS_IN_MILLISECONDS = 4 * 60 * 60 * 1000;
  private redisClient: VercelKV;

  constructor() {
    const apiUrl = process.env.KV_REST_API_URL;
    const apiToken = process.env.KV_REST_API_TOKEN;

    if (!apiUrl || !apiToken) {
      throw new Error(
        'Environment variables for Vercel KV are not set properly.',
      );
    }

    try {
      this.redisClient = createClient({ url: apiUrl, token: apiToken });
    } catch (error) {
      console.error('Error initializing Vercel KV client:', error);
      throw error;
    }
  }

  /**
   * Calculates the remaining time (in seconds) before the user can play again.
   *
   * @param key - The key associated with the user.
   * @returns The number of remaining seconds. Returns 0 if the user can already play again.
   */
  async timeUntilNextPlay(userIp: string): Promise<number> {
    const storedEventDateStr: string = await this.redisClient.get(
      this.constructKeyFromIP(userIp),
    );
    if (!storedEventDateStr) {
      // If no date is stored, the user can play immediately.
      return 0;
    }

    const storedEventDate = new Date(storedEventDateStr);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - storedEventDate.getTime();

    if (timeDifference >= UsersMemoryStorage.FOUR_HOURS_IN_MILLISECONDS) {
      return 0;
    } else {
      // Calculate the remaining time in seconds.
      const remainingTime =
        UsersMemoryStorage.FOUR_HOURS_IN_MILLISECONDS - timeDifference;
      return Math.ceil(remainingTime / 1000); // Convert to seconds and round up.
    }
  }

  /**
   * Validates a user based on their IP address.
   * If the user is new or last event is older than 4 hours, returns true.
   *
   * @param userIp - The IP address of the user.
   * @returns true if the user is valid, false otherwise.
   */
  async validate(userIp: string): Promise<boolean> {
    try {
      const remainingTime = await this.timeUntilNextPlay(userIp);

      if (remainingTime === 0) {
        const currentDate = new Date();
        const key = this.constructKeyFromIP(userIp);
        await this.storeEventDate(key, currentDate);
        return true;
      }
    } catch (error) {
      console.error('Error during Redis operation (validate):', error);
    }
    return false;
  }

  /**
   * Constructs a key for Redis storage based on the user's IP address.
   *
   * @param ip - The IP address of the user.
   * @returns The constructed key.
   */
  private constructKeyFromIP(ip: string): string {
    return `user-${ip}`;
  }

  /**
   * Stores the event date for a given key in Redis.
   *
   * @param key - The key under which to store the data.
   * @param date - The date of the event to store.
   */
  private async storeEventDate(key: string, date: Date): Promise<void> {
    await this.redisClient.set(key, date.toISOString());
  }
}
