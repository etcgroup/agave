<?php

include_once 'time_ago.php';

function discussion_message($row)
{
    ob_start();
    ?>
    <div class="comment" data-id="<?php echo $row['id']?>" data-discussion-id="<?php echo $row['discussion_id']?>">
        <div class="time muted"><?php echo ago($row['time'], true) ?></div>
        <div class="user"><?php echo $row['user'] ?></div>
        <div class="message"><?php echo $row['message'] ?></div>
    </div>
    <?php
    return ob_get_clean();
}
