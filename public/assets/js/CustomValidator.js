(function(global) {
    "use strict;"

    // Class ------------------------------------------------
    function CustomValidator($form) {

        this.$form = $form;

        // add regex method
        // ------------------------------
        $.validator.addMethod("regex", function(value, element, regexpr) {
            return regexpr.test(value);
        }, "regex error");

        // validate config
        // ------------------------------
        var options = {
            rules: {
                confirmDelete: {
                    regex: /^delete$/i
                },
                oldPassword: {
                    minlength: 6,
                    maxlength: 24,
                    regex: /^(?=.*?[a-z])(?=.*?\d)(?=.*?[!-\/:-@[-`{-~])[!-~]{6,24}$/i
                },
                newPassword: {
                    minlength: 6,
                    maxlength: 24,
                    regex: /^(?=.*?[a-z])(?=.*?\d)(?=.*?[!-\/:-@[-`{-~])[!-~]{6,24}$/i
                },
                nickname: {
                    minlength: 3,
                    maxlength: 12,
                    regex: /^[A-Za-z0-9\s.-]+$/i
                },
                username: {
                    email: true,
                },
                password: {
                    minlength: 6,
                    maxlength: 24,
                    regex: /^(?=.*?[a-z])(?=.*?\d)(?=.*?[!-\/:-@[-`{-~])[!-~]{6,24}$/i
                },
                code: {
                    regex: /^[0-9]+$/i
                },
            },
            messages: {
                oldPassword: {
                    minlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    maxlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    regex: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                },
                newPassword: {
                    minlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    maxlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    regex: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                },
                confirmDelete: {
                    regex: "deleteと入力して下さい",
                },
                nickname: {
                    minlength: "3~12文字以内で半角英数字で入力してください",
                    maxlength: "3~12文字以内で半角英数字で入力してください",
                    regex: "3~12文字以内で半角英数字で入力してください",
                },
                username: {
                    email: "正しいメールアドレス形式で入力してください",
                },
                password: {
                    minlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    maxlength: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                    regex: "6-24文字で半角英数字記号を<br/>それぞれ一文字以上入力してください",
                },
                code: {
                    regex: "半角数字で入力してください",
                },
            },
            onkeyup: function(element) {
                $(element).valid()
            },
            errorClass: "invalid-feedback",
            errorElement: "div",
        }

        // attach validate
        // ------------------------------
        $form.validate(options);

    }

    CustomValidator["prototype"]["isInputAll"] = CustomValidator_isInputAll;
    CustomValidator["prototype"]["valid"] = CustomValidator_valid;

    function CustomValidator_valid() {
        return this.$form.valid();
    }

    function CustomValidator_isInputAll() {

        var $inputs = this.$form.find("input");

        for (var input of $inputs) {
            if (!$(input).val()) {
                return false;
            }
        }

        return true;

    }

    // Exports ----------------------------------------------
    if ("process" in global) {
        module["exports"] = CustomValidator;
    }
    global["CustomValidator"] = CustomValidator;

})((this || 0).self || global);
