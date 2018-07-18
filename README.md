# TipSLACK

環境構築方法は後々追記していきます。

# TipSLACKとは？
Slack上でNEMのモザイク送金などを実現するためのサーバプログラムです。
node.jsで動作し、nem-libraryを使用しています。
すべての人が共通で使用するtipnemなどとは異なり、チーム内部でサーバを立てての運用を想定しています。

# 仕様
ユーザごとにNEMアカウントが割り振られるオンチェーン型チップボットです。
システム秘密鍵を用意し、各アカウントのuser_nameと組み合わせてブレインウォレットを生成します。ユーザが自分の秘密鍵を知ることは出来ません。
## コマンド
* deposit
* withdraw
* tip


# 環境構築
## Slack側の設定
### Slash Commands
  - command
    - /tipslack
  - URL
    - http://ipaddress:1337/tipslack
  - トークン
    - この部分に表示された文字列をプログラム上のSLACK_TOKENに記入	

### 着信 Web フック
  - Webhook URL
        - この部分に表示された文字列をSLACK_HOOK_URLに記入

## Node.js設定
### Node.jsインストール
### ライブラリ
* log4js (2.8.0)
* nem-library (1.0.7)
* express (4.16.3)
* request


