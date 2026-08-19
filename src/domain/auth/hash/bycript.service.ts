import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptHashingService extends HashingService {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
