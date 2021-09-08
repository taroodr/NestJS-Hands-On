import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'], 
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
      },
    }),
    UsersModule,
  ],
})
export class AppModule {}