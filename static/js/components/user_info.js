define(['jquery', 'util/urls'], function($, urls) {

    /**
     * A view for managing the user welcome message and sign out box.
     *
     * @param options
     * @constructor
     */
    var UserInfoView = function(options) {
        this.user = options.user;
        this.into = options.into;

        this.initUI();
        this.attachEvents();

        if (this.user.signed_in()) {
            this.show();
        }
    };

    UserInfoView.prototype.initUI = function() {
        this.ui = {};
        this.ui.user_display = this.into;
        this.ui.user_name = this.ui.user_display.find('.user-name');
        this.ui.sign_out_button = this.ui.user_display.find('.sign-out-button');
        this.ui.twitter_icon = this.ui.user_display.find('.twitter-icon-light');
    };

    UserInfoView.prototype.attachEvents = function() {

        this.user.on('signed-in', $.proxy(this.show, this));
        this.user.on('signed-out', $.proxy(this.hide, this));


        this.ui.sign_out_button.on('click', $.proxy(this.onSignOutClicked, this));
    };

    UserInfoView.prototype.show = function() {
        if (this.isShowing()) {
            return false;
        }

        if (this.user.data.twitter_id) {
            this.ui.twitter_icon.removeClass('hide');
        }

        this.ui.user_name.html(this.user.screen_name());

        this.ui.user_display.show();

        //Force reflow
        this.ui.user_display[0].offsetWidth;

        this.ui.user_display.addClass('in');
    };

    UserInfoView.prototype.isShowing = function() {
        return this.ui.user_display.is('.in');
    };

    UserInfoView.prototype.hide = function() {
        if (!this.isShowing()) {
            return false;
        }

        if ($.support.transition) {
            var self = this;
            this.ui.user_display.one($.support.transition.end, function() {
                self.ui.user_display.hide();
            });
        } else {
            this.ui.user_display.hide();
        }

        this.ui.user_display.removeClass('in');
    };

    UserInfoView.prototype.onSignOutClicked = function() {
        var return_to = window.location.href;
        var auth_url = urls.get_url('auth') + '?sign_out=1&return_to=' + encodeURIComponent(return_to);
        window.location.href = auth_url;
    };

    return UserInfoView;

});