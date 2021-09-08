# NestJSではじめるGraphQLサーバー

# はじめに
本章ではNestJSを使ってシンプルなGraphQLサーバーを手を動かしながら作っていきます。

GraphQLがどういうものなのかという説明はしないので、GraphQLに触れたことがない場合は
適宜調べてもらいながら進めていただければと思います。

## 今回作るアプリケーションの紹介
userを返すAPIを作成します。  
[user API](./user_api.png)

完成品のコードは [こちら](./server)


## やってみる
### プロジェクト初期化と必要パッケージのインストール
前回と同様にNestJSのプロジェクトを作ってみましょう。  

```bash
$ yarn global add @nestjs/cli
$ nest new project-name
```

GraphQL用のパッケージもインストールしておきます。

```bash
$ yarn add @nestjs/graphql graphql apollo-server-express

```

### コードファーストかスキーマファーストか
NestJSでは、GraphQLサーバーを構築する方法として、コードファーストとスキーマファーストの2つのパターンが用意されています。  
コードファーストの場合、まずTypeScriptのコードを書き、コードからGraphQLスキーマを生成します。  
スキーマファーストの場合、まずGraphQLスキーマを書き、スキーマからTypeScriptのコードを生成します。

今回のハンズオンではスキーマファーストでの実装方法を紹介します。

## 実装していく
`app.module.ts` を以下の通り書き換えます。
```
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({}),
  ],
})
export class AppModule {}
```

今回はスキーマファーストで実装していくので、GraphQL Moduleにスキーマ定義ファイルの場所を教えてあげます。

```typescript
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'], // 追加
}),
```

サーバーの実装をするにあたって、GraphQLスキーマに対応するTypeScriptの定義(classやinterface)が必要になります。  
手動でTypeScriptの定義を生成するのは面倒かつ、運用に耐えられる代物ではないので自動生成できるとよいでしょう。  
`@nestjs/grpahql` パッケージではTypeScriptの定義を生成する機能も内包しています。  
この機能を有効にするには `definitions` optionを追加します。

```typescript
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
}),
```

これにより、`src/graphql.ts` にTypeScriptの定義が生成されます。
このコード生成はアプリケーションが起動するたびに動作します。

コマンドによって生成したい場合は、スクリプトを書いてもOKです。
```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
});
```
実行
```bash
$ ts-node generate-typings
```

### スキーマ定義とリゾルバーの自動生成
では、スキーマ定義を書きresolverを実装していきます。  
ファイルを1から作成してもいいのですが、NestJSには、テンプレートを生成できるコマンドがあるので積極的に利用すると良さそうです。

```bash
$ nest g resource 
```

色々聞かれるので以下のように答えていきます。  
```bash
? What name would you like to use for this resource (plural, e.g., "users")? users
? What transport layer do you use? GraphQL (schema first)
? Would you like to generate CRUD entry points? Yes
CREATE src/users/users.graphql (397 bytes)
CREATE src/users/users.module.ts (224 bytes)
CREATE src/users/users.resolver.spec.ts (525 bytes)
CREATE src/users/users.resolver.ts (959 bytes)
CREATE src/users/users.service.spec.ts (453 bytes)
CREATE src/users/users.service.ts (625 bytes)
CREATE src/users/dto/create-user.input.ts (32 bytes)
CREATE src/users/dto/update-user.input.ts (192 bytes)
CREATE src/users/entities/user.entity.ts (21 bytes)
UPDATE src/app.module.ts (342 bytes)
```

ここまでできたらサーバーを立ち上げてみます。

```bash
$ yarn start:dev
```

※エラーが出る場合は以下も入れておくとよいでしょう。
```
$ yarn add ts-morph @apollo/gateway
```

### playgroundから実行する
`http://localhost:3000/graphql` にアクセスすると GraphQL Playgroundを使うことができます。

Playgroundの左側はGraphQLのQueryやMutationを書くエディタ側になっていて、右側は結果のレスポンスが表示されるようになっています。  
では、Queryを書いて実行ボタンをおしてみましょう。

```graphql
query getUser {
  user(id: 1) {
    exampleField
  }
}
```

以下のようにデータが返ってくるはずです。
```graphql
{
  "data": {
    "user": {
      "exampleField": null
    }
  }
}
```

このようにコード生成を使うことでGraphQLのResolverが一瞬で作れてしまいました。

### スキーマ定義とリゾルバーの修正
自動生成された schema は exampleFieldと書いてあるとおり、サンプルなので実際のAPIっぽく修正することにします。

`/src/users/users.graphql` を以下に書き換えます。
```graphql
type User {
  id: Int!
  name: String!
  email: String!
}
```

変更したらサーバーを立ち上げ直してTypeScriptのコード生成をおこなっておきます。

サーバーが立ち上がったら、playgroundから以下のQueryを実行してみます。
```graphql
query getUser {
  user(id: 1) {
    id
    name
    email
  }
}
```

`Cannot return null for non-nullable field User.id.` というエラーが発生するはずです。  
これはスキーマを変更しただけで実装を修正していないからですね。  

`src/users/users.service.ts` に変更を加えます。
```typescript
import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from "src/graphql"

@Injectable()
export class UsersService {
  findOne(id: number): User {
    return {
      id: 12345,
      name: "name",
      email: "test@test.com",
    };
  }
}
```

playgroundから先程ののQueryを実行してみましょう。  
以下が返却されていれば、user APIの完成です。

```
{
  "data": {
    "user": {
      "id": 12345,
      "name": "name",
      "email": "test@test.com"
    }
  }
}
```

GraphQLスキーマの変更は他のAPIにも影響があるのでついでに修正しておくとよいでしょう。

```typescript
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
```

以上でAPIの実装は完了です。  

※実際のプロジェクトではserviceで固定値を返すことはせず、  
外部のAPIやgRPCサーバとのやりとり、DBとのやりとりをすることになるでしょう。

## まとめ
コード生成を用いることで雛形が作成されるので、初めて触る人でもとっつきやすいのではないでしょうか？  
とはいえ、今回紹介したコードだけでは本番運用に耐えられるものではないので、次回はエラーハンドリングやバリデーションについての話をします。  

