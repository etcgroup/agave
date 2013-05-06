<?php

include_once 'time_ago.php';

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
