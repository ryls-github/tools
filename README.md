# tools

これまでブログに置いてたツール系を今後は Github Pages に置こうかなとか考えてるので用意した仮の場所

ひとつひとつは大したものじゃないのに個別にリポジトリを作るのもどうなのって思ったので小さいものはここで 1 つのリポジトリにまとめる

## フォルダ配置ルール

ツールはここに配置

```
public/{tool-name}
```

この public フォルダを公開する

`tool-name` のところに、 HTML 1 ファイルなら直接 HTML を置く  
フォルダならフォルダを置いて中に `index.html` などを置く

（例）

```
- public/
    - test01.html
    - test02/
        - index.html
        - app.js
```

ビルド処理が必要なツールは src フォルダ内にソースを配置

```
src/{tool-name}
```

package.json の build と deploy を実行する

- build: ビルド処理、フォルダ内のどこかに成果物を出力
- deploy: 指定フォルダに成果物をコピー

コピー先：

```
src/{tool-name}/{成果物フォルダ}

↓

public/{tool-name}
```

ビルドが必要なものはリポジトリ独立させるかも？
