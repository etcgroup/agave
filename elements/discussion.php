<?php

/**
 * Given a unix time stamp, return the nice time ago string.
 *
 * Plagiarized from here: http://css-tricks.com/snippets/php/time-ago-function/
 *
 * @param $time
 * @return string
 */
function ago($time)
{
    $periods = array("second", "minute", "hour", "day", "week", "month", "year", "decade");
    $lengths = array("60","60","24","7","4.35","12","10");

    $now = time();

    $difference     = $now - $time;
    $tense         = "ago";

    for($j = 0; $difference >= $lengths[$j] && $j < count($lengths)-1; $j++) {
        $difference /= $lengths[$j];
    }

    $difference = round($difference);

    if($difference != 1) {
        $periods[$j].= "s";
    }

    return "$difference $periods[$j]";
}

function discussion($row)
{
    ob_start();
    ?>
    <div class="discussion clearfix" data-id="<?php echo $row['id']?>">
        <div class="message-count badge"><?php echo $row['message_count'] ?></div>
        <div class="subject"><?php echo $row['subject'] ?></div>
        <div class="users muted"><?php echo $row['users'] ?></div>
        <div class="last-comment-at">Updated <?php echo ago($row['last_comment_at']) ?> ago</div>
    </div>
    <?php
    return ob_get_clean();
}
