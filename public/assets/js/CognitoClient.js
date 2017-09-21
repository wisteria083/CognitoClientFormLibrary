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
        AccessTokenCookieAutoReload : true,
        Uri: {
            SignIn: {
                url: "/signin",
                success: {
                    forcedRedirect: true, // URLにredirectUrlパラメータがあればそっちのURLにリダイレクト
                    redirect: true, // redirectするか falseならcallback
                    redirectUrl: "/signin-complete", // redirect先URL
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signin",
                },
                user_is_not_confirmed: { // ユーザ登録されているが、認証されていない場合
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup-confirm",
                },
            },

            SignOut: {
                url: "/signout",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signout-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signout",
                },
            },

            SignOutGlobal: {
                url: "/signout-global",
                success: {
                    forcedRedirect: true,
                    redirect: true,
                    redirectUrl: "/signout-global-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signout-global",
                },
            },

            SignUpConfirm: {
                url: "/signup-confirm",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup-confirm",
                },
                resend_confirmation_code: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup-confirm",
                },
            },

            SignUp: {
                url: "/signup",
                success: {
                    forcedRedirect: true,
                    redirect: true,
                    redirectUrl: "/signup-confirm",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup",
                },
                user_is_already_confirmed: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signin",
                },
                user_is_not_confirmed: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/signup-confirm",
                },

            },
            ForgetPassword: {
                url: "/forget-password",
                success: {
                    forcedRedirect: true,
                    redirect: true,
                    redirectUrl: "/forget-password-confirm",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/forget-password",
                },
            },
            ForgetPasswordConfirm: {
                url: "/forget-password-confirm",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/forget-password-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/forget-password-confirm",
                },
            },
            ChangePassword: {
                url: "/change-password",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/change-password-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/change-password",
                },
            },
            DeleteUser: {
                url: "/delete-user",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/delete-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/delete-user",
                },
            },            
            UpdateProfile: {
                url: "/update-profile",
                success: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/update-profile-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirect: true,
                    redirectUrl: "/update-profile",
                },
            },                

        }
    };

    // Class ------------------------------------------------
    function CognitoClient() {

        AWS.config.region = Region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        });
        
        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {
            
            if(session && session.accessToken.jwtToken && session.accessToken.jwtToken.length > 0){
                
                var accessToken = session.accessToken.jwtToken;
                var oldAccessToken = $.cookie("AccessToken");

                if(accessToken !== oldAccessToken){
                    
                    // save AccessToken to cookie
                    saveAccessTokenToCookie(session.accessToken.jwtToken);
                    
                    // Cookie有効化のため、再ロード
                    // Lambda@EdgeやApi GatewayなどでAccessTokenの取得を容易にする
                    if(config.AccessTokenCookieAutoReload === true){
                        window.location.reload();    
                    }else{
                        return;    
                    }
                    
                }else{
                    return;
                }
            
            }else{
                return; 
            }
            
        });

    };

    // Header -----------------------------------------------
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
    
    // CognitoClient["prototype"]["deleteUser"] = CognitoClient_deleteUser;

    // CognitoClient["prototype"]["changePassword"] = CognitoClient_changePassword;

    CognitoClient["prototype"]["getUserAttributes"] = CognitoClient_getUserAttributes;
    CognitoClient["prototype"]["updateUserAttributes"] = CognitoClient_updateUserAttributes;

    function saveAccessTokenToCookie(accessToken) {

        var date = new Date();
        date.setTime( date.getTime() + ( 61 * 60 * 1000 ));
        
        $.cookie("AccessToken",accessToken, { expires: date , path: "/"});

    }
    
    function response(urlConfig, err, result, callback) {

        var getSearchParams = function(k) {
            var p = {};
            location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(s, k, v) {
                p[k] = v
            })
            return k ? p[k] : p;
        }

        if (!(urlConfig.forcedRedirect && urlConfig.forcedRedirect == true) && !(urlConfig.redirect && urlConfig.redirect == true)) {

            callback(err, result);
            return;

        }
        else {

            if (urlConfig.forcedRedirect && urlConfig.forcedRedirect == true && getSearchParams("redirectUrl")) {

                var redirectUrl = getSearchParams("redirectUrl");

                for (var k in allowRedirectUrlPatterns) {

                    var allowRedirectUrlPattern = allowRedirectUrlPatterns[k];

                    var regex = new RegExp(allowRedirectUrlPattern, 'ig');

                    if (regex.test(redirectUrl)) {

                        window.location.href = redirectUrl;
                        return;

                    }

                }

            }
            else if (urlConfig.redirect && urlConfig.redirect == true) {

                var redirectUrl = urlConfig.redirectUrl;

                for (var k in allowRedirectUrlPatterns) {

                    var allowRedirectUrlPattern = allowRedirectUrlPatterns[k];

                    var regex = new RegExp(allowRedirectUrlPattern, 'ig');

                    if (regex.test(redirectUrl)) {

                        let ret = [];
                        for (let d in result) {
                            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(result[d]));
                        }

                        if (err) {
                            ret.push("exception" + '=' + encodeURIComponent(err.name));
                            ret.push("exception_message" + '=' + encodeURIComponent(err.message));
                        }

                        window.location.href = redirectUrl + "?" + ret.join('&');
                        return;
                    }

                }


            }

            throw new Error("redirect is not defined");

        }

    }

    // Implementation ---------------------------------------

    function CognitoClient_isSignedIn(callback) {
        
        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {
            
            if(cognitoUser && session){
                callback(true);
                return;
            }else{
                callback(false);
                return;
            }
            
        });
        
    }

    function CognitoClient_getCurrentUser(callback) {

        var data = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };

        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(data);
        var cognitoUser = userPool.getCurrentUser();

        console.log(cognitoUser);
        
        if(!cognitoUser){
            
            callback(new Error("CurrentUser is not signed in"),null,null);
            return false;
        }

        cognitoUser.getSession(function(err, session) {

            if (err) {
                callback(err,null,null);
                return false;
            }

            // callback
            callback(null, cognitoUser, session);
            return false;
            
        });

    }

    function CognitoClient_signin(username, password, callback) {

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

        var authenticationData = {
            Username: username,
            Password: password,
        };
        var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                
                console.log(result);
                // save AccessToken to cookie
                //saveAccessTokenToCookie(result.session.accessToken.jwtToken);
                
                response(
                    config.Uri.SignIn.success,
                    null, {
                        username: username,
                    },
                    callback
                );

                return;

            },
            onFailure: function(err) {

                if (err && err.name == "UserNotConfirmedException") {

                    response(
                        config.Uri.SignIn.error,
                        err, {
                            message: "確認コードを認証して下さい",
                            username: username,
                        },
                        callback
                    );

                    return;

                }
                else {

                    response(
                        config.Uri.SignIn.error,
                        err, {
                            message: "不明なエラー",
                            username: username,
                        },
                        callback
                    );

                    return;

                }
            },
        });

    }

    function CognitoClient_signup(nickname, username, password, attributes, callback) {

        AWSCognito.config.region = Region;

        var poolData = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };
        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

        var attributeList = [];

        attributeList.push(new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({
            Name: 'nickname',
            Value: nickname
        }));

        // サインアップ試行
        userPool.signUp(username, password, attributeList, null, function(err, result) {

            if (err) {

                if (err.name == "UsernameExistsException" || err.message == "An account with the given email already exists.") {

                    // ユーザは既に存在している
                    // 未認証なら確認コードメールを再送付、認証済みならログインページへ
                    CognitoClient_getUnauthenticatedCognitoUser(username, function(err, unauthenticatedCognitoUser) {

                        if (err && !unauthenticatedCognitoUser) {

                            response(
                                config.Uri.SignUp.error,
                                err, {
                                    username: username,
                                    message: "getUnauthenticatedCognitoUserError",
                                },
                                callback
                            );

                            return;

                        }
                        else {

                            // resendConfirmationCodeの戻り値で認証済みかわかる
                            unauthenticatedCognitoUser.resendConfirmationCode(function(err, result) {

                                console.log(err);

                                if (err && err.message == "User is already confirmed.") {

                                    // ---------------------------------
                                    // 既に認証済み user_is_already_confirmed
                                    // ---------------------------------
                                    response(
                                        config.Uri.SignUp.user_is_already_confirmed,
                                        err, {
                                            username: username,
                                            message: "既にそのユーザは存在しています",
                                        },
                                        callback
                                    );

                                    return;

                                }
                                else {

                                    // ---------------------------------
                                    // ユーザ登録済みだが、コード未認証 user_is_not_confirmed
                                    // ---------------------------------
                                    response(
                                        config.Uri.SignUp.user_is_not_confirmed,
                                        err, {
                                            username: username,
                                            message: "確認コードを認証して下さい",
                                        },
                                        callback
                                    );

                                    return;

                                }

                            });

                        }

                    });

                }
                else {

                    // ---------------------------------
                    // error
                    // ---------------------------------
                    response(
                        config.Uri.SignUp.error,
                        err, {
                            username: username,
                            message: "不明なエラー",
                        },
                        callback
                    );

                    return;

                }

            }
            else {

                // ---------------------------------
                // success
                // ---------------------------------
                response(
                    config.Uri.SignUp.success,
                    null, {
                        username: username,
                    },
                    callback
                );

                return;

            }

        });

    }

    function CognitoClient_signout(callback) {

        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {

            if(err){
                
                response(
                    config.Uri.SignOut.error,
                    err, 
                    null,
                    callback);
                    
            }else{
                
                cognitoUser.signOut();
                
                response(
                    config.Uri.SignOut.success,
                    null, 
                    null,
                    callback);
                
            }

        });

    }

    function CognitoClient_globalSignOut(callback) {

        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {
            if (!err && cognitoUser) {
                cognitoUser.globalSignOut();
                callback(null);
            }
        });

    }

    function CognitoClient_getUnauthenticatedCognitoUser(username, callback) {

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

        console.log(cognitoUser);

        callback(null, cognitoUser);

    }

    function CognitoClient_resendConfirmationCode(username, callback) {

        CognitoClient_getUnauthenticatedCognitoUser(username, function(err, unauthenticatedCognitoUser) {

            if (err && !unauthenticatedCognitoUser) {

                response(
                    config.Uri.SignUpConfirm.resend_confirmation_code,
                    err, {
                        username: username,
                        message: "getUnauthenticatedCognitoUserError",
                    },
                    callback);

                return;

            }
            else {

                unauthenticatedCognitoUser.resendConfirmationCode(function(err, result) {

                    if (err) {

                        response(
                            config.Uri.SignUpConfirm.resend_confirmation_code,
                            err, {
                                username: username,
                                message: "不明なエラー",
                            },
                            callback);

                        return;

                    }
                    else {

                        response(
                            config.Uri.SignUpConfirm.resend_confirmation_code,
                            new Error("resendConfirmationCode"), {
                                username: username,
                                message: "確認コードを再送信しました",
                            },
                            callback);

                        return;

                    }

                });
            }

        });

    }

    function CognitoClient_confirmRegistration(username, code, callback) {

        CognitoClient_getUnauthenticatedCognitoUser(username, function(err, unauthenticatedCognitoUser) {

            if (err && !unauthenticatedCognitoUser) {

                response(
                    config.Uri.SignUpConfirm.error,
                    err, {
                        username: username,
                        message: "getUnauthenticatedCognitoUserError",
                    },
                    callback);

                return;

            }
            else {

                unauthenticatedCognitoUser.confirmRegistration(code, true, function(err, result) {

                    console.log(err);

                    if (err) {

                        if (err.name == "CodeMismatchException") {

                            response(config.Uri.SignUpConfirm.error,
                                err, {
                                    username: username,
                                    message: "認証コードが一致しません",
                                }, callback);

                            return;

                        }
                        else if (err.message == "Invalid code provided, please request a code again.") {

                            response(config.Uri.SignUpConfirm.error,
                                err, {
                                    username: username,
                                    message: "認証コードが一致しません。認証コードを再送信してください。",
                                }, callback);

                            return;

                        }
                        else {

                            response(config.Uri.SignUpConfirm.error,
                                err, {
                                    username: username,
                                    message: "不明なエラー",
                                }, callback);

                            return;
                        }

                    }
                    else {

                        response(
                            config.Uri.SignUpConfirm.success,
                            null, {
                                //username: username,
                            },
                            callback);

                        return;

                    }

                });
            }

        });

    }

    function CognitoClient_forgetPassword(username, callback) {

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

                response(
                    config.Uri.ForgetPassword.success,
                    null,
                    {
                        username: username,
                    },
                    callback);

                return;

            },
            onFailure: function(err) {

                response(
                    config.Uri.ForgetPassword.error,
                    err, {
                        username: username,
                    },
                    callback);

                return;

            }
        });

    }

    function CognitoClient_confirmPassword(username, verificationCode, newPassword, callback) {

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
            onFailure(err) {

                response(
                    config.Uri.ForgetPasswordConfirm.error,
                    err, {
                        username: username,
                    },
                    callback);

                return;
                
            },
            onSuccess() {
                    
                response(
                    config.Uri.ForgetPasswordConfirm.success,
                    null,
                    null,
                    callback);
                    
                return;
                
            },
        });

    }
    
    function CognitoClient_getUserAttributes(callback) {
        
        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {
            
            if (err) {
                
                callback(err,null);
                return;
                    
            }else{
                
                cognitoUser.getUserAttributes(function(err, result) {
                    
                    if (err) {
                        callback(err,null);
                        return;
                    }
                    
                    var attributes = {};
                    
                    for (var i = 0; i < result.length; i++) {
                        attributes[result[i].getName()] = result[i].getValue(); 
                    }
                    
                    callback(null,attributes);
                    return;
                    
                });
            }
            
        });
        
    };
    
    function CognitoClient_updateUserAttributes(attributes, callback) {

        var poolData = {
            UserPoolId: UserPoolId,
            ClientId: ClientId
        };
        
        var attributeList = [];
        
        for(var key in attributes){
            var attribute = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(attributes[key]);
            attributeList.push(attribute);            
        }
        
        CognitoClient_getCurrentUser(function(err, cognitoUser, session) {
            
            if (err) {
                
                response(
                    config.Uri.UpdateProfile.error,
                    err, 
                    null,
                    callback);
                    
            }else{
                
                cognitoUser.updateAttributes(attributeList, function(err, result) {
                    if (err) {
                        response(
                            config.Uri.UpdateProfile.error,
                            err, 
                            null,
                            callback);
                    }else{
                        response(
                            config.Uri.UpdateProfile.success,
                            null, 
                            result,
                            callback);
                    }
                });
                
            }
            
        });
    
    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = CognitoClient;
    }
    global["CognitoClient"] = CognitoClient;

})((this || 0).self || global);
