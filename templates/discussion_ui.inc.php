<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

function sign_in_box($auth_mode)
{
    ob_start();
    ?>
    <div class="user-box col">
        <div class="header">
            <div class="title">Welcome!</div>
            <div class="message">Discuss this data set!</div>
        </div>
        <div class="form">
            <?php if ($auth_mode == 'twitter') { ?>
            <button type="button" class="user-submit btn btn-large btn-primary">
                <i class="twitter-icon-light"></i>
                Sign in with Twitter
            </button>
            <?php } else { ?>
                <input type="text" class="user-input" placeholder="Make up a user name"/><br/>
                <button type="button" class="user-submit btn btn-large btn-primary">Sign in</button>
            <?php } ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

function discussion_box()
{
    ob_start();
    ?>
    <div class="discussions col">
        <div class="header row">
            <div class="title">Discussions</div>
            <div class="discussion-search-wrapper input-append">
                <input type="text" class="discussion-search-input" placeholder="Search discussions"/>
                <span class="add-on">
                    <i class="icon-search icon-white"></i>
                </span>
            </div>

            <button type="button" class="btn btn-primary new-button tooltip-me" data-placement="bottom"
                    title="Create a new discussion">
                <i class="icon-white icon-plus-sign"></i>
                New</button>
            <div>Join an existing discussion</div>
        </div>
        <ul class="discussion-list content-panel item-list row scroll-y"></ul>
    </div>
    <?php
    return ob_get_clean();
}

function discussion_view()
{
    ob_start();
    ?>
    <div class="discussion-view col">
        <div class="comment-box row">
            <button type="button" class="btn back-button tooltip-me" data-placement="right"
                    title="Back to discussion list">
                <i class="icon-white icon-arrow-left"></i>
                Back
            </button>
            <div class="discussion-title"></div>
            <textarea></textarea>
            <button type="button"
                    class="send-button btn btn-primary tooltip-me" data-placement="bottom"
                    title="Post your comment">
                <i class="icon-white icon-comment"></i> Post
            </button>
            <button type="button" data-toggle="button"
                    class="reference-button btn tooltip-me" data-placement="right"
                    title="Reference a tweet or annotation">
                <i class="icon-white icon-map-marker"></i> Reference
            </button>
        </div>
        <ul class="comments item-list content-panel row scroll-y"></ul>
    </div>
    <?php
    return ob_get_clean();
}