define(['jquery'], function($) {

    var SignIn = function(parameters) {
        this.user = parameters.user;
        this.into = parameters.into || $('<div>');

        this._initUI();
        this._attachEvents();
    };

    SignIn.prototype._initUI = function() {
        this.ui = {};

        this.ui.userInput = this.into.find('input');
        this.ui.userSubmit = this.into.find('.user-submit');
    };

    SignIn.prototype._attachEvents = function() {
        var self = this;
        this.ui.userInput.on('keydown', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                //pressed enter
                self._onUserSubmitted();
                return false;
            }
        });
        this.ui.userSubmit.on('click', $.proxy(this._onUserSubmitted, this));
    };

    SignIn.prototype._onUserSubmitted = function() {
        var user = $.trim(this.ui.userInput.val());
        if (!user) {
            alert("Come on... type a user name :)");
            return;
        }

        //Save the user data
        this.user.set({
            name: user,
            signed_in: true
        });
        this.user.trigger('signed-in');
    };

    SignIn.prototype.hide = function() {

    };

    SignIn.prototype.show = function() {

    };

    return SignIn;

});