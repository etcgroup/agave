<?php

function timeline_controls()
{
    function modeButton($options) {
        $mode = $options['mode'];
        $focus = $options['focus'] === '' ? $options['focus'] : $options['focus'] + 1;
        $title = $options['title'];
        $class = isset($options['class']) ? $options['class'] : '';
        $label = $options['label'];

        echo "<li>";
        echo "<a class='tooltip-me {$class}' data-placement='top' data-mode='{$mode}' data-focus='{$focus}' data-animation='true' data-html='true' title='{$title}' href='#'>";
        echo "<i class='display-icon display-{$mode}'></i> {$label}</a>";
        echo "</li>";
    }

    ob_start();
    ?>
    <?php echo help_icon(array(
        'class' => 'popover-me display-mode-help',
        'placement' => 'right',
        'title' => 'Switch timeline modes.',
        'content' => 'You can see # of Tweets from <u>both</u> of your filter sets at once or view the sentiment composition of just one, in either <u># of Tweets</u> or <u>% of Tweets</u>.',
        'trigger' => 'hover'
    )); ?>
    <ul class="nav nav-pills mode-switch-buttons">
        <?php echo modeButton(array(
            'class' => 'active',
            'mode' => 'simple',
            'focus' => '',
            'label' => 'Both',
            'title' => 'Tweets from <b>both</b> filter sets.'
        )); ?>

        <?php echo modeButton(array(
            'mode' => 'stack',
            'focus' => 0,
            'label' => '# Left',
            'title' => 'Tweet sentiment from <b>left</b> filter'
        )); ?>

        <?php echo modeButton(array(
            'mode' => 'stack',
            'focus' => 1,
            'label' => '# Right',
            'title' => 'Tweet sentiment from <b>right</b> filter'
        )); ?>

        <?php echo modeButton(array(
            'mode' => 'expand',
            'focus' => 0,
            'label' => '% Left',
            'title' => 'Percent Tweet sentiment from <b>left</b> filter'
        )); ?>

        <?php echo modeButton(array(
            'mode' => 'expand',
            'focus' => 1,
            'label' => '% Right',
            'title' => 'Percent Tweet sentiment from <b>right</b> filter'
        )); ?>
    </ul>

    <div class="annotation-help">
        <span class="add-help">click to label a time</span>
    </div>

    <ul class="legend">
        <li class="tooltip-me" title="All three combined" data-placement="top">
            <div class="legend-swatch sentiment-combined" ></div>
            Combined
        </li>
        <li class="tooltip-me" title="Positive Tweets" data-placement="top">
            <div class="legend-swatch sentiment-positive"></div>
            Positive
        </li>
        <li class="tooltip-me" title="Neutral Tweets" data-placement="top">
            <div class="legend-swatch sentiment-neutral"></div>
            Neutral
        </li>
        <li class="tooltip-me" title="Negative Tweets" data-placement="top">
            <div class="legend-swatch sentiment-negative"></div>
            Negative
        </li>
    </ul>
    <?php
    return ob_get_clean();
}
