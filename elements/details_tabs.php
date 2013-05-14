<?php

function details_tabs($index)
{
    $tweetListId = "tweet-list-$index";
    $usersListId = "users-list-$index";
    $keywordsListId = "keywords-list-$index";

    ob_start();
    ?>
    <div class="tab-group">
        <ul class="nav nav-tabs row">
            <li class="active"><a data-target="#<?php echo $tweetListId ?>" data-toggle="tab">Tweets <i class="tweet-list-spinner spinner-16"></i></a>
            </li>
            <li><a data-target="#<?php echo $usersListId ?>" data-toggle="tab">Users <i class="user-list-spinner spinner-16"></i></a></li>
            <li><a data-target="#<?php echo $keywordsListId ?>" data-toggle="tab">Keywords <i class="keyword-list-spinner spinner-16"></i></a></li>
        </ul>

        <div class="tab-content row">
            <div class="tab-pane active tweet-list" id="<?php echo $tweetListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
            </div>
            <div class="tab-pane users-list" id="<?php echo $usersListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
            </div>
            <div class="tab-pane keywords-list" id="<?php echo $keywordsListId ?>">
                <div class="tab-pane-body row col scroll-y"></div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}