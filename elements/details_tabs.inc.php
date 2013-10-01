<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

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
        </ul>

        <div class="tab-content row content-panel">
            <div class="tab-pane fade in active tweet-list" id="<?php echo $tweetListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
                <div class="tab-pane-explanation muted"></div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}