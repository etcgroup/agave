<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'util/helpers.inc.php';

/**
 * @param $request Request
 * @return string
 */
function nav_bar($request)
{
    $title = $request->corpus_title();
    $stats = $request->corpus_properties();

    $tweet_count = Helpers::friendly_bignum($stats['tweet_count']);
    $user_count = Helpers::friendly_bignum($stats['user_count']);

    ob_start();
    ?>
    <div class="navbar row">
        <div class="navbar-inner">
            <div class="container-fluid">
                <div class="nav-main-info">
                    <a class="brand" href="?">
                    </a>
                    <span class="colon"><i class="icon-chevron-right icon-white"></i></span>
                    <span class="title muted"><?php echo $title; ?></span>
                </div>
                <ul class="details">
                    <li><?php echo $stats['start_time'] ?> - <?php echo $stats['end_time'] ?> <?php echo $stats['timezone'] ?></li>
                    <li class="divider-vertical"></li>
                    <li><?php echo $tweet_count ?> tweets</li>
                    <li class="divider-vertical"></li>
                    <li><?php echo $user_count ?> authors</li>
                </ul>
                <div class="user-display hide fade">
                    <span class="welcome-message">
                        Welcome, <i class="twitter-icon-light hide" title="Signed in with Twitter"></i> <span class="user-name"></span>!
                    </span>
                    <button type="button" class="btn sign-out-button">Sign out</button>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
