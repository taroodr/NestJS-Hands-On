import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from "src/graphql"

const user = {
  id: 12345,
  name: "name",
  email: "test@test.com",
}

@Injectable()
export class UsersService {
  create(createUserInput: CreateUserInput): User {
    return user;
  }

  findAll(): User[] {
    return [user];
  }

  findOne(id: number): User {
    return user;
  }

  update(id: number, updateUserInput: UpdateUserInput): User {
    return user;
  }

  remove(id: number): User {
    return user;
  }
}
