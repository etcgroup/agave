<?php

function query_box($name)
{
    ?>
    <form class="query form-inline">
        <div class="btn-group" data-toggle="buttons-radio">
            <button type="button" class="btn active">W</button>
            <button type="button" class="btn">X</button>
            <button type="button" class="btn">H</button>
            <button type="button" class="btn">_</button>
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
            <option>Positive</option>
            <option>Neutral</option>
            <option>Negative</option>
        </select>
        <button type="button" class="btn query-update">Update</button>
    </form>
    <?php
}
