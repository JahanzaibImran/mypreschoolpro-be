import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: ['.env.local', '.env'] });

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DATABASE_URL')?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

