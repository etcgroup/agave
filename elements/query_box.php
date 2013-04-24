<?php

function query_box($name)
{
    ?>
    <form class="query form-inline">
        <div class="btn-group view-buttons" data-toggle="buttons-radio">
            <button data-mode="area" type="button" class="btn active">W</button>
            <button data-mode="stacked" type="button" class="btn">X</button>
            <button data-mode="expand" type="button" class="btn">H</button>
            <button data-mode="hidden" type="button" class="btn">_</button>
        </div>
        <label><?php echo $name ?></label>
        <input class="query-search" type="search" placeholder="Search tweet text"/>
        <input class="query-author" type="text" placeholder="@author"/>
        <label class="checkbox" title="Check to view retweets">
            <input class="query-rt" type="checkbox"> RT?
        </label>
        <label class="" title="Filter tweets with less than this many retweets">
            <input class="query-minrt" type="number" min="0" max="10" value="0"/> Min RT
        </label>
        <select class="query-sentiment">
            <option selected="selected"></option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
        </select>
        <button type="button" class="btn query-update">Update</button>
    </form>
    <?php
}
