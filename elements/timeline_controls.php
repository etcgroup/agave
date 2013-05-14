<?php

function timeline_controls()
{
    ob_start();
    ?>
    Display:
    <div class="btn-group mode-switch-button-group">
        <button type="button" class="btn dropdown-toggle mode-switch-button" data-toggle="dropdown">
            <span class="dropdown-label"></span>
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" role="menu">
            <li><a tabindex="-1" href="#" class="select" data-mode="simple" data-focus=""><i class="display-icon display-simple"></i> Overlay Both</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="stack" data-focus="0"><i class="display-icon display-stack"></i> Sentiment Layers 1</a></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="stack" data-focus="1"><i class="display-icon display-stack blank"></i> Sentiment Layers 2</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="expand" data-focus="0"><i class="display-icon display-expand"></i> Normalized Layers 1</a></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="expand" data-focus="1"><i class="display-icon display-expand blank"></i> Normalized Layers 2</a></li>
        </ul>
    </div>
    <label class="checkbox annotations-checkbox">
        <input type="checkbox" class="annotations-toggle"/>
        Annotations
    </label>
    <?php
    return ob_get_clean();
}