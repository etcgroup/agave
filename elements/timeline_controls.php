<?php

function timeline_controls()
{
    function foo($options) {
        $mode = $options['mode'];
        $focus = $options['focus'] === '' ? $options['focus'] : $options['focus'] + 1;
        $title = $options['title'];
        $class = isset($options['class']) ? $options['class'] : '';
        $label = $options['label'];

        echo "<li class='tooltip-me {$class}' data-placement='bottom' data-mode='{$mode}' data-focus='{$focus}' title='{$title}'>";
        echo "<a href='#'><i class='display-icon display-{$mode}'></i> {$label}</a>";
        echo "</li>";
    }

    ob_start();
    ?>
    <ul class="nav nav-pills mode-switch-buttons">
        <?php echo foo(array(
            'class' => 'active',
            'mode' => 'simple',
            'focus' => '',
            'label' => 'Both',
            'title' => 'View both filters at the same time.'
        )); ?>

        <?php echo foo(array(
            'mode' => 'stack',
            'focus' => 0,
            'label' => 'Left Stack',
            'title' => 'View a stacked sentiment plot for the left filter set'
        )); ?>

        <?php echo foo(array(
            'mode' => 'stack',
            'focus' => 1,
            'label' => 'Right Stack',
            'title' => 'View a stacked sentiment plot for the right filter set'
        )); ?>

        <?php echo foo(array(
            'mode' => 'expand',
            'focus' => 0,
            'label' => 'Left Fill',
            'title' => 'View a normalized sentiment plot for the left filter set'
        )); ?>

        <?php echo foo(array(
            'mode' => 'expand',
            'focus' => 1,
            'label' => 'Right Fill',
            'title' => 'View a normalized sentiment plot for the right filter set'
        )); ?>
    </ul>

    <div class="annotation-help">
        <span class="add-help">click to label</span>
    </div>

    <ul class="legend">
        <li>
            <div class="legend-swatch sentiment-combined"></div>
            Combined
        </li>
        <li>
            <div class="legend-swatch sentiment-positive"></div>
            Positive
        </li>
        <li>
            <div class="legend-swatch sentiment-neutral"></div>
            Neutral
        </li>
        <li>
            <div class="legend-swatch sentiment-negative"></div>
            Negative
        </li>
    </ul>
    <?php
    return ob_get_clean();
}
