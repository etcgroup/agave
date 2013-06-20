define(['jquery'], function($) {

    var SignIn = function(parameters) {
        this.user = parameters.user;
        this.into = parameters.into || $('<div>');

        this._initUI();
        this._attachEvents();
    };

    SignIn.prototype._initUI = function() {
        this.ui = {};

        this.ui.userSubmit = this.into.find('.user-submit');
    };

    SignIn.prototype._attachEvents = function() {
        var self = this;
        this.ui.userSubmit.on('click', $.proxy(this._onUserSubmitted, this));
    };

    SignIn.prototype._onUserSubmitted = function() {
        var return_to = window.location.href;
        var auth_url = 'auth.php?return_to=' + encodeURIComponent(return_to);
        window.location.href = auth_url;
    };

    SignIn.prototype.hide = function() {

    };

    SignIn.prototype.show = function() {

    };

    return SignIn;

});