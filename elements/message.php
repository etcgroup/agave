<?php

include_once 'time_ago.php';

function discussion_message($row)
{
    ob_start();
    ?>
    <li class="item comment" data-id="<?php echo $row['id'] ?>" data-discussion-id="<?php echo $row['discussion_id'] ?>">
        <div class="time muted"><?php echo ago($row['created'], true) ?></div>
        <?php if ($row['view_state']) { ?>
            <div class="view-state tooltip-me" data-placement="bottom"
                title="Restore this view"
                 data-view="<?php echo $row['view_state'] ?>">
                <i class="icon-white icon-fullscreen"></i>
            </div>
        <?php } ?>
        <div class="user muted"><?php echo $row['user'] ?></div>
        <div class="message"><?php echo $row['message'] ?></div>
    </li>
    <?php
    return ob_get_clean();
}
