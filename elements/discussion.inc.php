<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'time_ago.inc.php';

function discussion($row)
{
    $subject = preg_replace('/[AT]\d+\[/', '[', $row['subject']);

    ob_start();
    ?>
    <li class="item discussion clearfix" data-id="<?php echo $row['id']?>">
        <div class="message-count badge tooltip-me" Title="Message Count"><?php echo $row['message_count'] ?></div>
        <div class="subject"><?php echo $subject ?></div>
        <div class="last-comment-at muted">Updated <?php echo ago($row['last_comment_at']) ?> ago</div>
    </li>
    <?php
    return ob_get_clean();
}
