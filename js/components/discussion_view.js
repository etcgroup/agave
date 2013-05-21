define(['jquery',
    'underscore',
    'util/events',
    'util/poll',
    'util/loader',
    'util/urls',
    'util/references',
    'lib/bootstrap'], function ($, _, events, Poll, loader, urls, references, bootstrap) {

    //Check for messages every 10 seconds
    var POLL_INTERVAL = 10000;

    var DiscussionView = function (options) {
        this.into = options.into || $('<div>');
        this.api = options.api;
        this.user = options.user;
        this.interval = options.interval;
        this.display = options.display;

        this.discussion_id = null;

        this._initUI();
        this._attachEvents();

        this.poll = new Poll({
            callback: $.proxy(this._requestData, this),
            interval: POLL_INTERVAL
        });
    };

    DiscussionView.prototype._initUI = function () {
        this.ui = {};

        this.ui.backButton = this.into.find('.back-button');
        this.ui.commentList = this.into.find('.comments');

        this.ui.commentBox = this.into.find('.comment-box');
        this.ui.commentInput = this.ui.commentBox.find('textarea');
        this.ui.userDisplay = this.ui.commentBox.find('.user-display');
        this.ui.commentSubmit = this.ui.commentBox.find('.send-button');
        this.ui.referenceButton = this.ui.commentBox.find('.reference-button');

        this.loader = loader({
            into: this.into,
            delay: 500
        });
    };

    DiscussionView.prototype._attachEvents = function () {
        this.api.on('annotations', $.proxy(this._onAnnotationData, this));

        this.ui.backButton.on('click', $.proxy(this._onBackClicked, this));
        this.ui.commentSubmit.on('click', $.proxy(this._onSendClicked, this));
        this.ui.referenceButton.on('click', $.proxy(this._onReferenceButtonClicked, this));

        var self = this;
        this.ui.commentList.on('mouseenter', '.ref', function () {
            self._referenceMouseEntered($(this));
        });

        this.ui.commentList.on('mouseleave', '.ref', function () {
            self._referenceMouseLeft($(this));
        });

        this.ui.commentList.on('click', '.ref', function () {
            self._referenceClicked($(this));
        });

        this.ui.commentList.on('click', '.view-state', function () {
            self._viewStateClicked($(this));
        });

        this.user.on('change', $.proxy(this._userChanged, this));
        this.api.on('messages', $.proxy(this._onData, this));

        this.api.on('reference-selected', $.proxy(this._onReferenceInserted, this));

        this.api.on('brush', $.proxy(this._onBrush, this));

        this.api.on('unbrush', $.proxy(this._onUnBrush, this));
    };

    DiscussionView.prototype.show = function (discussion_id) {
        this.discussion_id = discussion_id;

        //Clear the current list contents
        this.ui.commentList.html('');

        //Clear the input box
        this.ui.commentInput.val('');

        this.loader.start();
        this._requestData();

        this.poll.start();

        this.ui.commentInput.focus();
    };

    DiscussionView.prototype.isShowing = function () {
        //We are showing if we are polling
        return this.poll.isPolling();
    };

    DiscussionView.prototype.hide = function () {
        this.discussion_id = null;

        this.poll.stop();
    };

    DiscussionView.prototype._onBackClicked = function () {
        this.trigger('back');
    };

    DiscussionView.prototype._disableCommentBox = function () {
        this.ui.commentInput.prop('disabled', true);
        this.ui.commentSubmit.prop('disabled', true);
    };

    DiscussionView.prototype._enableCommentBox = function () {
        if (this.ui.commentInput.prop('disabled')) {
            this.ui.commentInput.prop('disabled', false);
            this.ui.commentSubmit.prop('disabled', false);

            this.ui.commentInput.val('');
        }
    };

    DiscussionView.prototype._userChanged = function (e, user) {
        this.ui.userDisplay.html('Hello, ' + user.name() + '!');
    };

    DiscussionView.prototype.toggleReferenceMode = function (value) {
        $('body').toggleClass('reference-mode', value);
        this.display.reference_mode(value);
    };

    DiscussionView.prototype._onReferenceButtonClicked = function () {
        this.toggleReferenceMode(!this.ui.referenceButton.is('.active'));
    };

    DiscussionView.prototype._onSendClicked = function () {
        var message = $.trim(this.ui.commentInput.val());

        if (message) {
            this._disableCommentBox();

            var view_state = urls.query_string();

            this.loader.start();

            this.api.send_message({
                user: this.user.name(),
                message: this.ui.commentInput.val(),
                discussion_id: this.discussion_id,
                view_state: view_state
            });
        }
    };

    DiscussionView.prototype._onReferenceInserted = function (e, result) {
        if (!this.isShowing() || !this.display.reference_mode()) {
            // TODO: this isn't the best place for this, but its the only listener for
            // reference-selected and its the only one that knows about insert mode
            // also ignore annotations for the moment
            if (result.type == "tweet") {
                this.interval.centerAround(result.data.created_at);
            } else if (result.type == "annotation") {
                this.interval.centerAround(result.data.time);
            }
            return;
        }

        this.ui.referenceButton.button('toggle');
        this.toggleReferenceMode(false);


        //Get the reference type
        var type = result.type;

        //Generate a reference code
        var referenceCode = references.build(type, result.data);

        //Append to the comment input
        var currentMsg = $.trim(this.ui.commentInput.val());

        //focus and clear the input to force the cursor to the end
        this.ui.commentInput.focus();
        this.ui.commentInput.val('');

        if (currentMsg) {
            //Add some space if needed
            currentMsg += " ";
        }
        this.ui.commentInput.val(currentMsg + referenceCode + " ");
    };

    function getReferenceType(refUI) {
        var type = refUI.hasClass('type-T') ? 'tweet' :
            (refUI.hasClass('type-A') ? 'annotation' : undefined);

        if (!type) {
            throw "unknown reference type!";
        }

        return type;
    }

    DiscussionView.prototype._referenceMouseEntered = function (refUI) {
        var type = getReferenceType(refUI);
        var id = refUI.data('id');

        this.api.trigger('brush', [
            {
                type: type,
                id: id,
                data: this.tweets[id]
            }
        ]);
    };

    DiscussionView.prototype._referenceMouseLeft = function (refUI) {
        var type = getReferenceType(refUI);
        var id = refUI.data('id');

        this.api.trigger('unbrush', [
            {
                type: type,
                id: id,
                data: this.tweets[id]
            }
        ]);
    };

    DiscussionView.prototype._onBrush = function (e, brush) {
        var refs = this.ui.commentList.find('.ref');
        _.each(brush, function (item) {
            refs.filter('[data-id=' + item.id + ']')
                .addClass('highlight');
        });
    };

    DiscussionView.prototype._onUnBrush = function (e, brush) {
        var refs = this.ui.commentList.find('.ref');
        _.each(brush, function (item) {
            refs.filter('[data-id=' + item.id + ']')
                .removeClass('highlight');
        });
    };

    DiscussionView.prototype._viewStateClicked = function (viewStateUI) {
        var state = viewStateUI.data('view');

        this.trigger('restore-state', state);
    };

    DiscussionView.prototype._referenceClicked = function (refUI) {
        var type = getReferenceType(refUI);
        var id = refUI.data('id');
        var text = refUI.html();
        var time = 0;

        var reference = {
            id: id
        };

        switch (type) {
            case 'annotation':
                reference.label = text;
                reference = this.annotations[id];
                time = reference.created;
                break;
            case 'tweet':
                //reference.text = text;
                reference = this.tweets[id];
                time = reference.created_at;
                break;
        }

        //Send it out through the normal channels, in case anyone else is watching
        this.api.trigger('reference-selected', {
            type: type,
            data: reference,
            time: time
        });

    };

    DiscussionView.prototype._onData = function (e, result) {
        this.loader.stop();

        this._enableCommentBox();

        var data = $($.trim(result.data.rendered)).filter(function () {
            //Remove 'text' nodes
            return this.nodeType !== 3;
        });

        //don't bother if there are no new messages
        if (data.length === this.ui.commentList.find('.comment').length) {
            return;
        }

        // add our map of the data
        this.tweets = [];
        var self = this;
        result.data.tweets.forEach(function (d, i) {
            //d.created_at = Date.parse(d.created_at);
            self.tweets[d.id] = d;
        });

        //Format all the messages (looking for entities)
        data.each(function (index, element) {
            var msgElement = $(this).find('.message');
            msgElement.html(references.replace(msgElement.html()));
        });

        this.ui.commentList.html(data);

        if (!this.discussion_id) {
            var comments = this.ui.commentList.find('.comment');
            if (comments.size()) {
                this.discussion_id = comments.data('discussion-id');
            }
        }

        this.ui.commentList.find('.tooltip-me').tooltip({
            container: this.into,
            animation: false
        });

        this.ui.commentList.find('.ref').tooltip({
            container: this.into,
            animation: false,
            placement: 'right',
            title: function() {
                if (self.display.reference_mode()) {
                    return 'Add to comment';
                }
                switch(getReferenceType($(this))) {
                    case 'tweet':
                        return 'Go to this Tweet';
                    case 'annotation':
                        return 'Go to this label';
                }
            }
        });
    };

    DiscussionView.prototype._requestData = function () {
        this.api.messages({
            discussion_id: this.discussion_id
        });
    };

    /**
     * Called when new annotation data arrives.
     * @private
     */
    DiscussionView.prototype._onAnnotationData = function (e, result) {
        this.annotations = [];

        var self = this;
        result.data.forEach(function (d, i) {
            self.annotations[+d.id] = d;
        });

        //this._updateAnnotations();
    };


    events(DiscussionView);

    return DiscussionView;
});