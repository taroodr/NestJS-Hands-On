import { Injectable } from '@nestjs/common';

export type User = {
  id: number;
  name: string;
  mail: string;
}

const  users: User[] = [
  {
    id: 1,
    name: "Anakin Skywalker",
    mail: "anakin@example.com"
  },
  {
    id: 2,
    name: "Luke Skywalker",
    mail: "luke@example.com"
  },
];

@Injectable()
export class AppService {
  getUsers(): User[] {
    return users;
  }
}
