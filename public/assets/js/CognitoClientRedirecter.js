(function(global) {
    "use strict;"

    var allowRedirectUrlPatterns = [
        "^/.+",
    ]; // このリストに含まれたPatternにしかリダイレクトしない

    // Class ------------------------------------------------
    function CognitoClientRedirecter($exceptionRender) {

        self.$exceptionRender = $exceptionRender;

        this.config = {
            SignIn: {
                success: {
                    forcedRedirect: true, // URLにredirectUrlパラメータがあればそっちのURLにリダイレクト
                    redirectUrl: "/signin-complete", // redirect先URL
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signin",
                },
                NotAuthorizedException: { 
                    forcedRedirect: false,
                    redirectUrl: "/signin",
                    message: "ユーザ名もしくはパスワードが違います"
                },
                UserNotConfirmedException: { // ユーザ登録されているが、認証されていない場合
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: "確認コードを認証して下さい"
                },
                UserNotFoundException:{
                    forcedRedirect: false,
                    redirectUrl: "/signin",
                    message: "そのユーザ名は存在しません"
                },
            },

            SignOut: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/signout-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signout",
                },
            },

            SignOutGlobal: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/signout-global-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signout-global",
                },
            },
            
            SignUp: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signup",
                },
                CUSTOM_UserIsAlreadyConfirmedException: {
                    forcedRedirect: false,
                    redirectUrl: "/signin",
                    message: "既にユーザは作成されています。ログインしてください"
                },
                CUSTOM_UserIsNotConfirmedException: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: ""
                },

            },

            SignUpConfirm: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                },
                CodeMismatchException:{
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: "認証コードが一致しません",
                },
                CUSTOM_InvalidCodeProvidedException:{
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: "認証コードを使用できません。認証コードを再送信してください",
                },
            },

            ResendConfirmationCode: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                },
                LimitExceededException: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: "一定時間内の送信数を上回りました。しばらくしてから再度お試しください"
                },
                CUSTOM_UserIsAlreadyConfirmedException: {
                    forcedRedirect: false,
                    redirectUrl: "/signin",
                    message: "既にユーザは作成されています。ログインしてください"
                },
                CUSTOM_UserIsNotConfirmedException: {
                    forcedRedirect: false,
                    redirectUrl: "/signup-confirm",
                    message: "認証コードを再送信しました"
                },
            },
            
            ForgetPassword: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/forget-password-confirm",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/forget-password",
                },
                UserNotFoundException: {
                    forcedRedirect: false,
                    redirectUrl: "/forget-password",
                    message: "ユーザーが見つかりませんでした"
                },
                LimitExceededException:{
                    forcedRedirect: false,
                    redirectUrl: "/forget-password",
                    message: "一定時間内に要求が多すぎました。しばらくしてから再度お試しください"
                }
            },
            ForgetPasswordConfirm: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/forget-password-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/forget-password-confirm",
                },
            },
            ChangePassword: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/change-password-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/change-password",
                },
                NotAuthorizedException: {
                    forcedRedirect: false,
                    redirectUrl: "/change-password",
                    message: "現在のパスワードが違います"
                },
            },
            DeleteUser: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/delete-user-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/delete-user",
                },
            },
            UpdateProfile: {
                success: {
                    forcedRedirect: false,
                    redirectUrl: "/update-profile-complete",
                },
                error: {
                    forcedRedirect: false,
                    redirectUrl: "/update-profile",
                },
            },

        }

    };

    // Header -----------------------------------------------
    CognitoClientRedirecter["prototype"]["redirect"] = CognitoClientExceptionRender_redirect;
    CognitoClientRedirecter["prototype"]["urlParamExceptionRender"] = CognitoClientExceptionRender_urlParamExceptionRender;

    function CognitoClientExceptionRender_urlParamExceptionRender() {

        if (location.search.substring(1).length > 0) {

            var params = JSON.parse('{"' + decodeURI(location.search.substring(1).replace(/&/g, "\",\"").replace(/=/g, "\":\"")) + '"}');

            var errorMessage = "";
            errorMessage = params.exception ? errorMessage + decodeURIComponent(params.exception) + "<br/>" : errorMessage;
            errorMessage = params.exception_message ? errorMessage + decodeURIComponent(params.exception_message) + "<br/>" : errorMessage;
            errorMessage = params.message ? errorMessage + decodeURIComponent(params.message) + "<br/>" : errorMessage;

            if (errorMessage) {
                self.$exceptionRender.html(errorMessage);
                self.$exceptionRender.show();
            }

        }

    }

    function CognitoClientExceptionRender_redirect(action, err) {

        // 成功か、定義されたエラーか、未定義のエラーかで設定を切り替える
        var urlConfig = null;

        urlConfig = action.success;
        
        if (err){

            if (action[err.name]) {
                urlConfig = action[err.name];
            }
            else {
                urlConfig = action.error;
            }

        }
        
        console.log(urlConfig);
        
        // 適当なパラメータパーサ
        var getSearchParams = function(k) {
            var p = {};
            location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(s, k, v) {
                p[k] = v
            })
            return k ? p[k] : p;
        }

        // forced Redirect
        if (urlConfig.forcedRedirect && urlConfig.forcedRedirect == true && getSearchParams("redirectUrl")) {

            var redirectUrl = getSearchParams("redirectUrl");

            for (var k in allowRedirectUrlPatterns) {

                var allowRedirectUrlPattern = allowRedirectUrlPatterns[k];
                var regex = new RegExp(allowRedirectUrlPattern, 'ig');

                if (regex.test(redirectUrl)) {

                    console.log("redirect to " + redirectUrl);
                    window.location.href = redirectUrl;
                    return false;

                }

            }

        }

        // Redirect
        var redirectUrl = urlConfig.redirectUrl;

        for (var k in allowRedirectUrlPatterns) {

            var allowRedirectUrlPattern = allowRedirectUrlPatterns[k];

            var regex = new RegExp(allowRedirectUrlPattern, 'ig');

            if (regex.test(redirectUrl)) {

                let ret = [];

                // 成功時はリダイレクト先のページにメッセージ直書きするはずだからいらんでしょ
                // if (action.message && action.message.length > 0) {
                //     ret.push("message" + '=' + encodeURIComponent(action.message));
                // }

                if(urlConfig.message === ""){
                    // エラーメッセージを表示したくない時用
                } else if(urlConfig.message && urlConfig.message.length > 0){
                    ret.push("exception_message" + '=' + encodeURIComponent(urlConfig.message));
                }else if (err) {
                    ret.push("exception" + '=' + encodeURIComponent(err.name));
                    ret.push("exception_message" + '=' + encodeURIComponent(err.message));
                }

                console.log("redirect to " + redirectUrl + "?" + ret.join('&'));
                window.location.href = redirectUrl + "?" + ret.join('&');
                return false;

            }

        }
        
        console.log(action, err);
        console.log("Failed to redirect");
        throw new Error("Failed to redirect");

    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = CognitoClientRedirecter;
    }
    global["CognitoClientRedirecter"] = CognitoClientRedirecter;

})((this || 0).self || global);
