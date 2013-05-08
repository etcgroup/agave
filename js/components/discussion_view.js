define(['jquery',
    'util/events',
    'util/poll',
    'lib/bootstrap'], function($, events, Poll, bootstrap) {

    //Check for messages every 10 seconds
    var POLL_INTERVAL = 10000;

    var DiscussionView = function(options) {
        this.into = options.into || $('<div>');
        this.api = options.api;
        this.user = options.user;

        this._initUI();
        this._attachEvents();

        this.poll = new Poll({
            callback: $.proxy(this._requestData, this),
            interval: POLL_INTERVAL
        });
    };

    DiscussionView.prototype._initUI = function() {
        this.ui = {};

        this.ui.backButton = this.into.find('.back-button');
        this.ui.commentList = this.into.find('.comments');

        this.ui.commentBox = this.into.find('.comment-box');
        this.ui.commentInput = this.ui.commentBox.find('textarea');
        this.ui.userDisplay = this.ui.commentBox.find('.user-display');
        this.ui.commentSubmit = this.ui.commentBox.find('.send-button');
    };

    DiscussionView.prototype._attachEvents = function() {
        this.ui.backButton.on('click', $.proxy(this._onBackClicked, this));
        this.ui.commentSubmit.on('click', $.proxy(this._onSendClicked, this));
        this.user.on('change', $.proxy(this._userChanged, this));
        this.api.on('messages', $.proxy(this._onData, this));
    };

    DiscussionView.prototype.show = function(discussion_id) {
        this.discussion_id = discussion_id;

        //Clear the current list contents
        this.ui.commentList.html('');

        this._requestData();

        this.poll.start();

        this.ui.commentInput.focus();
    };

    DiscussionView.prototype.hide = function() {
        this.poll.stop();
    };

    DiscussionView.prototype._onBackClicked = function() {
        this.trigger('back');
    };

    DiscussionView.prototype._disableCommentBox = function() {
        this.ui.commentInput.prop('disabled', true);
        this.ui.commentSubmit.prop('disabled', true);
    };

    DiscussionView.prototype._enableCommentBox = function() {
        if (this.ui.commentInput.prop('disabled')) {
            this.ui.commentInput.prop('disabled', false);
            this.ui.commentSubmit.prop('disabled', false);

            this.ui.commentInput.val('');
        }
    };

    DiscussionView.prototype._userChanged = function(e, user) {
        this.ui.userDisplay.html('Hello, <b>' + user.name() + '</b>!');
    };

    DiscussionView.prototype._onSendClicked = function() {
        this._disableCommentBox();

        this.api.send_message({
            user: this.user.name(),
            message: this.ui.commentInput.val(),
            discussion_id: this.discussion_id
        });
    };

    DiscussionView.prototype._onData = function(e, result) {
        this._enableCommentBox();

        var data = result.data;
        this.ui.commentList.html(data);

        if (!this.discussion_id) {
            var comments = this.ui.commentList.find('.comment');
            if (comments.size()) {
                this.discussion_id = comments.data('discussion-id');
            }
        }
    };

    DiscussionView.prototype._requestData = function() {
        this.api.messages({
            discussion_id: this.discussion_id
        });
    };

    events(DiscussionView);

    return DiscussionView;
});