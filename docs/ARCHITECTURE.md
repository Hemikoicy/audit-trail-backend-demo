# Architecture

## Overview

このデモでは、HTTP API・外部処理・監査記録・永続化を分離しています。

```text
Client
  |
  v
Express API
  |----> Processor --------> Mock / OpenAI (optional)
  |
  |----> SHA-256 / Merkle utilities
  |
  `----> Store interface --> Memory Store (default)
                       `----> Supabase / PostgreSQL (optional)
```

## Components

### `src/app.js`
HTTP endpoint、入力チェック、レスポンス生成を担当します。

### `src/services/processor.js`
テキスト処理を抽象化し、モック処理と OpenAI API を環境変数で切り替えます。

### `src/services/auditService.js`
監査イベントの保存と、同一バッチ内イベントからの Merkle Root 更新を担当します。

### `src/store/`
永続化レイヤーです。API層からデータ保存方法を分離するため、共通のメソッドを持つ `MemoryStore` / `SupabaseStore` を用意しています。

### `src/utils/hash.js`
SHA-256 と Merkle Root の生成を担当します。

## Design decisions

### Memory-first
外部アカウントを用意しなくても、`npm install` → `npm start` だけで主要APIを確認できるようにしています。

### Optional integrations
Supabase と OpenAI API はオプションとし、資格情報がなくてもソースレビューやローカル動作確認が可能です。

### Audit trail
業務データそのものではなく、処理に関するイベントを共通形式で保存し、関連IDから追跡できる構成にしています。

## Production considerations

本番化する場合には、少なくとも以下が必要です。

- Authentication / Authorization
- Strict schema validation
- Rate limiting
- Centralized logging / monitoring
- Secret manager
- Database RLS / permission design
- Batch close / rotation policy
- Transaction and concurrency handling
