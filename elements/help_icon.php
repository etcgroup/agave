<?php

function help_icon($options)
{
    $attrs = array();
    foreach ($options as $key => $value) {
        $attrs[] = "data-$key='$value''";
    }
    ob_start();
    ?>
    <div class="help-icon popover-me" data-animation="true" data-trigger="hover" data-html="true" <?php echo implode(' ', $attrs)?> >
        <i class="icon-white icon-question-sign"></i>
    </div>
    <?php
    return ob_get_clean();
}