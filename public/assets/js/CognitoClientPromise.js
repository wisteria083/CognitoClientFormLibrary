(function(global) {
    "use strict;"

    var Region = "ap-northeast-1";
    var UserPoolId = 'ap-northeast-1_fn27jfafw';
    var ClientId = '6ppd75cn45a32laiiub2i4bgi4';
    var IdentityPoolId = 'ap-northeast-1:ffddb598-e8ab-4215-a9ee-b9a36d568744';

    var allowRedirectUrlPatterns = [
        "^/.+",
    ]; // このリストに含まれたPatternにしかリダイレクトしない

    var config = {
        AccessTokenCookieAutoReload: true,
    };

    // Class ------------------------------------------------
    function CognitoClient() {

        AWS.config.region = Region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        });

    };

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

    // Header -----------------------------------------------
    CognitoClient["prototype"]["init"] = CognitoClient_init;

    CognitoClient["prototype"]["isSignedIn"] = CognitoClient_isSignedIn;
    CognitoClient["prototype"]["getCurrentUser"] = CognitoClient_getCurrentUser;

    CognitoClient["prototype"]["signin"] = CognitoClient_signin;
    CognitoClient["prototype"]["signup"] = CognitoClient_signup;
    CognitoClient["prototype"]["signout"] = CognitoClient_signout;
    CognitoClient["prototype"]["globalSignOut"] = CognitoClient_globalSignOut;

    CognitoClient["prototype"]["resendConfirmationCode"] = CognitoClient_resendConfirmationCode;
    CognitoClient["prototype"]["confirmRegistration"] = CognitoClient_confirmRegistration;

    CognitoClient["prototype"]["forgetPassword"] = CognitoClient_forgetPassword;
    CognitoClient["prototype"]["confirmPassword"] = CognitoClient_confirmPassword;

    CognitoClient["prototype"]["deleteUser"] = CognitoClient_deleteUser;

    CognitoClient["prototype"]["changePassword"] = CognitoClient_changePassword;

    CognitoClient["prototype"]["getUserAttributes"] = CognitoClient_getUserAttributes;
    CognitoClient["prototype"]["updateUserAttributes"] = CognitoClient_updateUserAttributes;

    function saveAccessTokenToCookie(accessToken) {

        var date = new Date();
        date.setTime(date.getTime() + (61 * 60 * 1000));

        $.cookie("AccessToken", accessToken, {
            expires: date,
            path: "/"
        });

    }

    function getUserPool() {

        var data = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };

        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(data);

        return userPool;

    }

    // Implementation ---------------------------------------

    /**
     * localストレージから現在のユーザを取得し、サインイン状態であるか判断します
     */
    function CognitoClient_isSignedIn() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser()
            .then(function(cognitoUser, session) {

                console.log(cognitoUser);
                console.log(session);

                if (cognitoUser && session) {
                    d.resolve(true);
                }
                else {
                    d.resolve(false);
                }

            }, function(err) {
                d.reject(err);
            });

        return d.promise();

    }

    /**
     * localストレージから現在のユーザを取得し、セッション情報も取得します
     */
    function CognitoClient_getCurrentUser() {

        var d = $.Deferred();

        var userPool = getUserPool();
        var cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser) {
            d.resolve(null);
        }
        else {

            console.log(cognitoUser);

            cognitoUser.getSession(function(err, session) {

                if (err) {
                    d.reject(err);
                }
                else {
                    d.resolve(cognitoUser, session);
                }

            });


        }

        return d.promise();

    }

    /**
     * ユーザ名とパスワードからサインインします
     * サインインに成功した場合はクッキーにアクセストークンを保存し
     * Lambda,ApiGateway、Lambda@edgeで活用しやすくします
     * クッキーを浸透させるためリダイレクト前提の仕様です
     */
    function CognitoClient_signin(username, password, callback) {

        var d = $.Deferred();

        var userPool = getUserPool();

        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({
            Username: username,
            Pool: userPool
        });

        var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {

                console.log(result);

                // save AccessToken to cookie
                saveAccessTokenToCookie(result.accessToken.jwtToken);

                d.resolve(result);

            },
            onFailure: function(err) {
                d.reject(err);
            },
        });

        return d.promise();

    }

    /**
     * Cognitoにサインアップします
     * 既に同名のユーザが存在している場合、resendConfirmationCodeを試行し、
     * 未認証の場合は認証コードの確認を促し、認証済みであった場合はサインインを促します
     */
    function CognitoClient_signup(nickname, username, password, attributes, callback) {

        var d = $.Deferred();

        var userPool = getUserPool();

        var attributeList = [];

        attributeList.push(new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({
            Name: 'nickname',
            Value: nickname
        }));

        // try sign up
        userPool.signUp(username, password, attributeList, null, function(err, result) {

            if (err && err.name == "UsernameExistsException") {
                // ユーザは既に存在している

                var userData = {
                    Username: username,
                    Pool: userPool
                };

                var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

                // resendConfirmationCodeの戻り値で認証済みかわかる
                cognitoUser.resendConfirmationCode(function(err, result) {

                    if (err && err.message == "User is already confirmed.") {
                        d.reject(Object.assign(new Error('User is already confirmed.'), {
                            name: 'CUSTOM_UserIsAlreadyConfirmedException'
                        })); //サインイン可能
                    }
                    else {
                        d.reject(Object.assign(new Error('User is not confirmed.'), {
                            name: 'CUSTOM_UserIsNotConfirmedException'
                        })); // サインイン不可(認証コード未確認状態)
                    }

                });

            }
            else if (err) {
                // 不明なエラー
                d.reject(err);
            }
            else {
                d.resolve(null)
            }

        });

        return d.promise();

    }

    /**
     * cognitoからサインアウトします
     */
    function CognitoClient_signout() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser()
            .then(function(cognitoUser, session) {

                cognitoUser.signOut();
                d.reject();

            }, function(err) {
                d.reject(err);
            });

        return d.promise();

    }

    /**
     * cognitoから全端末サインアウトします
     */
    function CognitoClient_globalSignOut() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser()
            .then(function(cognitoUser, session) {

                cognitoUser.globalSignOut();
                d.reject();

            }, function(err) {
                d.reject(err);
            });

        return d.promise();

    }

    /**
    * 再度認証コーを送ります
    */
    function CognitoClient_resendConfirmationCode(username, callback) {

        var d = $.Deferred();

        var userPool = getUserPool();

        var userData = {
            Username: username,
            Pool: userPool
        };

        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.resendConfirmationCode(function(err, result) {

            if (err && err.message == "User is already confirmed.") {
                d.reject(Object.assign(new Error('User is already confirmed.'), {
                    name: 'CUSTOM_UserIsAlreadyConfirmedException'
                })); //サインイン可能
            }
            else if (err && err.message == "User is not confirmed.") {
                d.reject(Object.assign(new Error('User is not confirmed.'), {
                    name: 'CUSTOM_UserIsNotConfirmedException'
                })); // サインイン不可(認証コード未確認状態)
            }
            else if (err) {
                d.reject(err);
            }
            else {
                d.resolve(result);
            }

        });

        return d.promise();

    }

    /**
    * 認証コードを認証します
    */
    function CognitoClient_confirmRegistration(username, code, callback) {

        var d = $.Deferred();

        var userPool = getUserPool();

        var userData = {
            Username: username,
            Pool: userPool
        };

        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.confirmRegistration(code, true, function(err, result) {

            if (err && err.name == "CodeMismatchException") {
                d.reject(err);
            }
            else if (err && err.message == "Invalid code provided, please request a code again.") {
                d.reject(Object.assign(new Error('Invalid code provided, please request a code again.'), {
                    name: 'CUSTOM_InvalidCodeProvidedException'
                }));
            }
            else if (err) {
                d.reject(err);
            }
            else {
                d.resolve(result);
            }

        });

        return d.promise();

    }

    /**
    * パスワードの再発行処理を開始します
    */
    function CognitoClient_forgetPassword(username) {

        var d = $.Deferred();

        var poolData = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };

        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var userData = {
            Username: username,
            Pool: userPool
        };

        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function(result) {
                d.resolve(result);
            },
            onFailure: function(err) {
                d.reject(err);
            }
        });

        return d.promise();

    }

    /**
    * 認証コードで新しいパスワードを認証します
    */
    function CognitoClient_confirmPassword(username, verificationCode, newPassword) {

        var d = $.Deferred();

        var poolData = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };

        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var userData = {
            Username: username,
            Pool: userPool
        };

        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: function(result) {
                d.resolve(result);
            },
            onFailure: function(err) {
                d.reject(err);
            }
        });

        return d.promise();

    }

    /**
    * パスワードを変更します
    */
    function CognitoClient_changePassword(oldPassword, newPassword) {

        var d = $.Deferred();

        CognitoClient_getCurrentUser().then(function(cognitoUser, session) {

            cognitoUser.changePassword(oldPassword, newPassword, function(err, result) {

                if (err) {
                    d.reject(err);
                }
                else {
                    d.resolve(result);
                }

            });

        }, function(err) {
            d.reject(err);
        });

        return d.promise();

    }

    /**
    * ユーザ情報を取得します
    */
    function CognitoClient_getUserAttributes() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser().then(function(cognitoUser, session) {

            cognitoUser.getUserAttributes(function(err, result) {

                if (err) {
                    d.reject(err);
                }
                else {

                    var attributes = {};

                    for (var i = 0; i < result.length; i++) {
                        attributes[result[i].getName()] = result[i].getValue();
                    }

                    d.resolve(attributes);

                }

            });

        });

        return d.promise();

    };

    /**
    * ユーザ情報を更新します
    */
    function CognitoClient_updateUserAttributes(attributes) {

        var d = $.Deferred();

        var attributeList = [];

        for (var key in attributes) {
            var attribute = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(attributes[key]);
            attributeList.push(attribute);
        }

        CognitoClient_getCurrentUser().then(function(cognitoUser, session) {

            cognitoUser.updateAttributes(attributeList, function(err, result) {
                if (err) {
                    d.reject(err);
                }
                else {
                    d.resolve(result);
                }
            });

        });

        return d.promise();

    }

    /**
    * ユーザを削除します
    */
    function CognitoClient_deleteUser() {

        var d = $.Deferred();

        CognitoClient_getCurrentUser().then(function(cognitoUser, session) {

            cognitoUser.deleteUser(function(err, result) {

                if (err) {
                    d.reject(err);
                }
                else {
                    d.resolve(result);
                }

            });

        }, function(err) {
            d.reject(err);
        });

        return d.promise();

    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = CognitoClient;
    }
    global["CognitoClient"] = CognitoClient;

})((this || 0).self || global);
