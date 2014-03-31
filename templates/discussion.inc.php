<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'time_ago.inc.php';

function discussion($row)
{
    $subject = preg_replace('/[AT]\d+\[/', '[', $row['subject']);

    $message_count = $row['message_count'];
    $message_count_tooltip = 'Message Count';
    if (isset($row['match_count'])) {
        $message_count = $row['match_count'] . ' / ' . $message_count;
        $message_count_tooltip = 'Matches / Message Count';
    }

    ob_start();
    ?>
    <li class="item discussion clearfix" data-id="<?php echo $row['id']?>">
        <div class="message-count badge tooltip-me"
             title="<?php echo $message_count_tooltip ?>"><?php echo $message_count ?></div>
        <div class="subject"><?php echo $subject ?></div>
        <div class="last-comment-at muted">Updated <?php echo ago($row['last_comment_at']) ?> ago</div>
    </li>
    <?php
    return ob_get_clean();
}
