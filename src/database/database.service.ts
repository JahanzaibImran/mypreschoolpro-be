import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

/**
 * Database service for direct SQL queries
 * Use this when TypeORM entities aren't sufficient
 */
@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private connection: Connection) {}

  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.connection.query(sql, parameters);
  }

  getRepository(entity: any) {
    return this.connection.getRepository(entity);
  }
}







