# CognitoClientFormLibrary

Cognito Client SDK
amazon-cognito-identity-js
https://github.com/aws/amazon-cognito-identity-js
を容易に具体的に実装するサンプルです
node.js Express&pug を使っていますがjavascriptはすべてクライントサイドで動作します。

## 依存ライブラリ
* [aws-sdk](https://github.com/aws/aws-sdk-js)
* [amazon-cognito-identity-js](https://github.com/aws/amazon-cognito-identity-js)
* jQuery 3.x
* Bootstrap 3.x
* [jquery-validation](https://github.com/jquery-validation/jquery-validation)

## Documentation

### js/CognitoClientPromise.js

amazon-cognito-identity-jsをプロミスでラップし、一部機能を追加したクラスです。
単体ではセッション管理や、ユーザ情報を保有しません。
コンストラクタにAccessTokenをCookieに浸透させるためのリロードのコードが含まれています。
この機能はLamba@Edgeや、サーバサイドでログイン認証を行うために存在します。
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

