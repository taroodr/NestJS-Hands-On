# part1 はじめてのNestJS

## はじめに
このハンズオンの目的は、  
「フロントエンドはわかるけどTypeScriptでバックエンド開発はしたことが無い」  
という人にNestJSでの開発の基本を学んでもらうことです。  
パートは複数回に分かれています。

- part1 NestJSの基本
- part2 NestJSでGraphQLサーバーを作ってみる
- part3 未定


## とりあえず読むといい資料
https://speakerdeck.com/potato4d/what-is-nestjs-number-nestjs-meetup?slide=40

## NestJSとは
- TypeScriptによって記述されたバックエンドフレームワーク
- 実装と疎結合になるようなアーキテクチャを採用(DI: dependency injectionが書きやすい)
- cli でプロジェクトやモジュールのテンプレートが生成可能
  - アーキテクチャの統一がしやすい

### DI: dependency injectionとは？
※すでに知ってるよっていう人は飛ばしてOKです

オブジェクトやクラスの依存を外部から注入すること。  
これだけを聞いてもよくわからないと思うのでコードを見ながら説明します。

DBにアクセスしてデータを取得してくるRepository クラスと
```typescript
type Jedi = {
    id: string;
    name: string;
}

interface JediRepositoryIF {
    get(): Jedi
}

class JediRepository implements JediRepositoryIF {
    get(): Jedi {
        // 実際にはRDB等にアクセスしてデータをとってくるコードを想定
        return {
            id: "id",
            name: "luke",
        }
    }
}
```

Repository クラスを利用するServiceクラスがあったとします。


```typescript

class JediService {
    constructor(private readonly repository: JediRepositoryIF) {}

    getJedi() {
        return this.repository.get()
    }
}

```

注目すべき点は、 Service クラスの constructor部分です。

```typescript
    constructor(private readonly repository: JediRepositoryIF) {}
```

サービスクラスの実装ではなく、Interfaceを指定して点がポイントです。  
なぜこんなことをするのでしょうか？

それはService クラスから Repository クラスへの依存を避けるためです。  


上記のクラスを使うコンシューマ側の実装を考えてみしょう。  
以下のようにインスタンスを作る際に依存関係を注入することになりますね。

```typescript
function main () {
    const jediRepository = new JediRepository();
    const jediService = new JediService(jediRepository);
    console.log(jediService.getJedi())
}

main()
```

JediServiceにわたす引数はInterfaceを満たしていればよいので、別の実装を渡すことも可能です。  
つまりユースケースによって実装を差し替えられるようになります。  

例えばテストの時だけ実装をMockに差し替えることも可能です。

```typescript
function test () {
    const jediRepository = new MockJediRepository();
    const jediService = new JediService(jediRepository);
    console.log(jediService.getJedi())
}

main()
```
#### DIのメリット・デメリット

■メリット
- DBや外部APIなどを扱うクラスへ依存があるクラスのテスタビリティがあがる  

■デメリット
- 規模が大きくなってくるとDI用のコードが増え複雑になる。


※ちなみにNestJSではフレームワークがDIの面倒を見てくれるので、楽です。



## やってみる
早速NestJSのプロジェクトを作ってみましょう。  
Nest CLIを使うことでプロジェクトの雛形を作成できます。

```bash
yarn global add @nestjs/cli
nest new project-name
```

yarn か npmを選んでと言われますが、好みの方を選択してください。  
以下のメッセージが出力されたらOKです。
```
                          Thanks for installing Nest 🙏
                 Please consider donating to our open collective
                        to help us maintain this package.
                                         
                                         
               🍷  Donate: https://opencollective.com/nest
```

では `yarn start:dev` で起動してみましょう。  
localhost:3000 でサーバが立ち上がります。  
以下のように表示されれば大丈夫です。

 ```
 [21:15:46] Starting compilation in watch mode...

[21:15:51] Found 0 errors. Watching for file changes.

[Nest] 42241  - 2021/08/30 21:15:51     LOG [NestFactory] Starting Nest application...
[Nest] 42241  - 2021/08/30 21:15:51     LOG [InstanceLoader] AppModule dependencies initialized +25ms
[Nest] 42241  - 2021/08/30 21:15:51     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 42241  - 2021/08/30 21:15:51     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 42241  - 2021/08/30 21:15:51     LOG [NestApplication] Nest application successfully started +2ms

```

## プロジェクトの構成
いくつかファイルが作成されたと思いますが、コアとなるファイルはsrcディレクトリ配下のファイルになります。

```
src
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

### app.service.ts
アプリケーションサービスクラスを定義するためのファイル。  
とりあえず、メインとなる処理を書く場所と考えてしまってOKです。

生成されたファイルには Hello Worldを返却するメソッドが定義されています。

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

```
コラム 
例えばDDDを用いたプロジェクトでいうと、Domainレイヤーのクラスを扱うクラスになる。
例: Entity, Value Object, Repository, Domain Service などを扱う
```

### app.controller.ts
controllerはRailsなどでも存在するいわゆるcontrollerのことです。  
リクエストを処理し、クライアントにレスポンスを返す処理にだけ関心を持ちます。  
なるべく薄い実装にしておくと良いです。  

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```


```
コラム 
https://docs.nestjs.com/controllers#request-object
`@Req` デコレータを使うことで requestオブジェクトを触れるようになるが、
requestオブジェクトをcontroller以外から触るような実装は避けたほうがよい。
```


### app.module.ts
依存関係の解決をしてくれるファイルです。  
以下のように書くことでcontrollerのconstructorへserviceのインスタンスの注入がおこなえます。

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### main.ts
アプリケーションのエントリポイントです。  
デフォルトでは内部的にexpressが使われますが、Fastifyを使うように変更することもできます。

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

## APIを書いてみる
概要が分かってきたところで、コードに手を加えてみましょう。

今回は以下の定義のUserを返却するAPIを作ってみることにします。

```typescript
type User = {
  id: number;
  name: string;
  mail: string;
}
```

serviceに定義します
```typescript
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

```

次にcontrollerに手を加えます。  
特に言うことはないですが、呼び出すserviceのメソッドを変更し、型定義を追加しています。


``` typescript
import { Controller, Get } from '@nestjs/common';
import { AppService, User } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getUsers(): User[] {
    return this.appService.getUsers();
  }
}
```

## 動作確認
`http://localhost:3000/` にアクセスしてみましょう。  
以下のjsonが出力されていればOKです。

```json
[{"id":1,"name":"Anakin Skywalker","mail":"anakin@example.com"},{"id":2,"name":"Luke Skywalker","mail":"luke@example.com"}]
```

## テストを書いてみる
ここで一度テストを実行してみます。

`yarn test` とすると以下のように失敗するはずです。

```
yarn run v1.22.10
$ jest
 PASS  src/app.controller.spec.ts
  AppController
    root
      ✓ should return users (10 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        2.542 s, estimated 3 s
Ran all test suites.
✨  Done in 3.18s.
taroodr@nakamurahikaritarounoMacBook-Pro server % yarn test

yarn run v1.22.10
$ jest
 FAIL  src/app.controller.spec.ts
  ● Test suite failed to run

    src/app.controller.spec.ts:19:28 - error TS2339: Property 'getHello' does not exist on type 'AppController'.

    19       expect(appController.getHello()).toBe('Hello World!');
                                  ~~~~~~~~

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.988 s, estimated 3 s
Ran all test suites.
error Command failed with exit code 1.
```

これでは駄目なので修正します。  
2人のユーザが返却されることが確認できました。

```typescript 
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return users', () => {
      expect(appController.getUsers()).toHaveLength(2);
    });
  });
});
```

## テストの改善
上記のコードには問題点があります。  
どこが問題でしょうか？  

正解はcontrollerのテストが serviceの実装に依存してしまっているという点です。  
これを改善するために jestを使ってserviceをモック化してみます。

```typescript 
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

```

これでserviceの実装に依存しないテストがかけました！  

## まとめ
このように、NestJSはDIの仕組みを用いておりクリーンなコードが書きやすいフレームワークといえるでしょう。
## 筆者感想
自分でDIコンテナを実装する必要もないのでDDDとの相性もいいと思いました。
