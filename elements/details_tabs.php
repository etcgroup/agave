<?php

function details_tabs($index)
{
    $tweetListId = "tweet-list-$index";
    $usersListId = "users-list-$index";
    $keywordsListId = "keywords-list-$index";

    ob_start();
    ?>
    <div class="tab-group row">
        <ul class="nav nav-pills row">
            <li class="active tooltip-me" title="Top 50 most retweeted Tweets.">
                <a data-target="#<?php echo $tweetListId ?>" data-toggle="tab">Tweets</a>
            </li>
            <li class="tooltip-me" title="Top 50 most prolific users.">
                <a data-target="#<?php echo $usersListId ?>" data-toggle="tab">Users</a>
            </li>
            <li class="tooltip-me" title="Top 50 'bursting keywords' - words with rapidly increased usage.">
                <a data-target="#<?php echo $keywordsListId ?>" data-toggle="tab">Keywords</a>
            </li>
        </ul>

        <div class="tab-content row content-panel">
            <div class="tab-pane fade in active tweet-list" id="<?php echo $tweetListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
                <div class="tab-pane-explanation muted"></div>
            </div>
            <div class="tab-pane fade users-list" id="<?php echo $usersListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
                <div class="tab-pane-explanation muted"></div>
            </div>
            <div class="tab-pane fade keywords-list" id="<?php echo $keywordsListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
                <div class="tab-pane-explanation muted"></div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}