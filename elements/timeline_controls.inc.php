<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

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

    <div class="muted timeline-help-text">Amount of positive, neutral, and negative tweets over time.</div>

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
