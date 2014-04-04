define(['jquery', 'util/urls'], function($, urls) {

    var SignIn = function(parameters) {
        this.user = parameters.user;
        this.into = parameters.into || $('<div>');

        this._initUI();
        this._attachEvents();
    };

    SignIn.prototype._initUI = function() {
        this.ui = {};

        var userInput = this.into.find('.user-input');
        if (userInput.length) {
            this.ui.userInput = userInput;
        }

        this.ui.userSubmit = this.into.find('.user-submit');
    };

    SignIn.prototype._attachEvents = function() {
        var self = this;

        if (this.ui.userInput) {
            this.ui.userInput.on('keydown', function(e) {
                if (e.which === 13) {
                    e.preventDefault();

                    //pressed enter
                    self._onUserSubmitted();

                    return false;
                }
            });
        }

        this.ui.userSubmit.on('click', $.proxy(this._onUserSubmitted, this));
    };

    SignIn.prototype._onUserSubmitted = function() {
        var return_to = window.location.href;
        var auth_url = urls.get_url('auth') + '?return_to=' + encodeURIComponent(return_to);

        if (this.ui.userInput) {
            var user = $.trim(this.ui.userInput.val());
            if (!user) {
                this.ui.userInput.focus();
                return;
            }
            auth_url = auth_url + '&username=' + encodeURIComponent(user);
        }

        window.location.href = auth_url;
    };

    SignIn.prototype.hide = function() {
        this.into.addClass('hide');

        if (this.ui.userInput) {
            this.ui.userInput.val('');
        }
    };

    SignIn.prototype.show = function() {

        this.into.removeClass('hide');

        if (this.ui.userInput) {
            this.ui.userInput.focus();
        }
    };

    return SignIn;

});