# CognitoClientFormLibrary

Cognito Client SDK(amazon-cognito-identity-js)を容易に具体的に実装するサンプルライブラリです
node.js Express&pug を使っていますがjavascriptはすべてクライントサイドで動作します。

## Setup

### import libraries
* [aws-sdk](https://github.com/aws/aws-sdk-js)
* [amazon-cognito-identity-js](https://github.com/aws/amazon-cognito-identity-js)
* jQuery 3.x
* Bootstrap 3.x
* [jquery-validation](https://github.com/jquery-validation/jquery-validation)
* [jquery.cookie.js](https://github.com/carhartl/jquery-cookie)

## Config

* js/CognitoClientPromise.js

```
 var Region = "";
 var UserPoolId = '';
 var ClientId = '';
 var IdentityPoolId = '';
```

* js/CognitoClientRedirecter.js

```
this.config
```

* js/CustomValidator.js

```
var options = {}
```

## Documentation

### js/CognitoClientPromise.js

amazon-cognito-identity-jsをプロミスでラップし、一部機能を追加したクラスです。

実装例は
views/user/signup.pug
views/user/signup-confirm.pug
views/user/signup-complete.pug
等を参照

単体ではセッション管理や、ユーザ情報を保有しません。
コンストラクタにAccessTokenをCookieに浸透させるためのリロードのコードが含まれています。
この機能はサーバサイドでログイン確認を行うために存在します。
Lamba@Edgeでは適切な設定により、Cognito AccessTokenがeventオブジェクト等から取得できるようです。

```
    function CognitoClient_init() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser()
            .then(function(cognitoUser, session) {

                if (session && session.accessToken.jwtToken && session.accessToken.jwtToken.length > 0) {

                    var accessToken = session.accessToken.jwtToken;
                    var oldAccessToken = $.cookie("AccessToken");

                    if (accessToken !== oldAccessToken) {

                        // save AccessToken to cookie
                        saveAccessTokenToCookie(session.accessToken.jwtToken);

                        // Cookie有効化のため、再ロード
                        // Lambda@EdgeやApi GatewayなどでAccessTokenの取得を容易にする
                        if (config.AccessTokenCookieAutoReload === true) {
                            window.location.reload();
                            //d.resolve(null);
                        }
                    }
                }

                d.resolve(null);

            }, function(err) {

                d.reject(err);

            })

        return d.promise();

    }
```

### js/CognitoClientRedirecter.js

CognitoClientPromise.jsの処理結果により適切なリダイレクトを行います。
CognitoClientPromise.jsは非同期処理ですが、リダイレクトで簡素なエラーハンドリングとメッセージの表示を行います。

### js/CustomValidator.js

jquery-validationの機能拡張とエラーメッセージの定義を行います。
requiesはhtmlロード時に行われる為、表示がうざったいのでCustomValidator_isInputAllを作成し適当に処理。
