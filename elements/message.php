<?php

function discussion_message($row)
{
    ob_start();
    ?>
    <div class="discussion-message" data-id="<?php echo $row['id']?>">
        <div class="time"><?php echo $row['time'] ?></div>
        <div class="user"><?php echo $row['user'] ?></div>
        <div class="message"><?php echo $row['message'] ?></div>
    </div>
    <?php
    return ob_get_clean();
}
