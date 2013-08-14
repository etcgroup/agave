<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'time_ago.inc.php';

function discussion_message($row)
{
    //Fill possible null fields
    if ($row['name'] === NULL) {
        $row['name'] = $row['user'];
    }

    if ($row['screen_name'] === NULL) {
        $row['screen_name'] = $row['user'];
    }

    ob_start();
    ?>
    <li class="item comment" data-id="<?php echo $row['id'] ?>" data-discussion-id="<?php echo $row['discussion_id'] ?>">
        <div class="time muted"><?php echo ago($row['created'], true) ?></div>
        <?php if ($row['view_state']) { ?>
            <div class="view-state tooltip-me" data-placement="bottom"
                title="Restore this view"
                 data-view="<?php echo $row['view_state'] ?>">
                see it
                <i class="icon-white icon-bookmark"></i>
            </div>
        <?php } ?>
        <div class="user muted"><?php echo $row['screen_name'] ?></div>
        <div class="message"><?php echo $row['message'] ?></div>
    </li>
    <?php
    return ob_get_clean();
}
