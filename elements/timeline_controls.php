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
            <li><a tabindex="-1" href="#" class="select" data-mode="simple" data-focus="">Overlay Both</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="stack" data-focus="0">Sentiment Layers 1</a></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="stack" data-focus="1">Sentiment Layers 2</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="expand" data-focus="0">Normalized Layers 1</a></li>
            <li><a tabindex="-1" href="#" class="select" data-mode="expand" data-focus="1">Normalized Layers 2</a></li>
        </ul>
    </div>
    <label class="checkbox annotations-checkbox">
        <input type="checkbox" class="annotations-toggle"/>
        Annotations
    </label>
    <?php
    return ob_get_clean();
}