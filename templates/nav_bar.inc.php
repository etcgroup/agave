<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'util/helpers.inc.php';

/**
 * @param string $corpus_title
 * @param array $corpus_stats
 * @param Router $router
 * @return string
 */
function nav_bar($corpus_title, $corpus_stats, $router)
{
    $tweet_count = Helpers::friendly_bignum($corpus_stats['tweet_count']);
    $user_count = Helpers::friendly_bignum($corpus_stats['user_count']);

    $start_time = Helpers::friendly_date($corpus_stats['start_time']);
    $end_time  = Helpers::friendly_date($corpus_stats['end_time']);

    $base_url = $router->base_url();

    ob_start();
    ?>
    <div class="navbar row">
        <div class="navbar-inner">
            <div class="container-fluid">
                <div class="nav-main-info">
                    <a class="brand" href="<?php echo $base_url ?>">
                    </a>
                    <span class="colon"><i class="icon-chevron-right icon-white"></i></span>
                    <span class="title muted"><?php echo $corpus_title; ?></span>
                </div>

                <div class="user-display hide fade">
                    <span class="welcome-message">
                        Welcome, <i class="twitter-icon-light hide" title="Signed in with Twitter"></i>
                        <span class="user-name"></span>!
                    </span>
                    <button type="button" class="btn sign-out-button">Sign out</button>
                </div>

                <ul class="details">
                    <li><?php echo $start_time ?> - <?php echo $end_time ?> <?php echo $corpus_stats['timezone'] ?></li>
                    <li class="divider-vertical"></li>
                    <li><?php echo $tweet_count ?> tweets</li>
                    <li class="divider-vertical"></li>
                    <li><?php echo $user_count ?> authors</li>
                </ul>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
