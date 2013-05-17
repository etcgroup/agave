<?php

function timeline_controls()
{
    ob_start();
    ?>
    <ul class="nav nav-pills mode-switch-buttons">
        <li class="active" data-mode="simple" data-focus="">
            <a href="#"><i class="display-icon display-simple"></i> Both</a>
        </li>

        <li data-mode="stack" data-focus="1">
            <a href="#"><i class="display-icon display-stack"></i> Left Stack</a>
        </li>
        <li data-mode="stack" data-focus="2">
            <a href="#"><i class="display-icon display-stack"></i> Right Stack</a>
        </li>

        <li data-mode="expand" data-focus="1">
            <a href="#"><i class="display-icon display-expand"></i> Left Fill</a>
        </li>
        <li data-mode="expand" data-focus="2">
            <a href="#"><i class="display-icon display-expand"></i> Right Fill</a>
        </li>
    </ul>

    <label class="checkbox annotations-checkbox">
        <input type="checkbox" class="annotations-toggle"/>
        Show/Hide Annotations
    </label>

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